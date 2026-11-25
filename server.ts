import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { MAIN_CATEGORIES } from './src/data/categories';
import {
  DEFAULT_ACCEPTED_PAYMENT_METHODS,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_SOCIAL_LINKS,
} from './src/data/storeContent';
import type {
  CartItem,
  CategoryDefinition,
  CustomerCheckoutData,
  CustomerReview,
  FaqItem,
  NewsletterSubscriber,
  OrderRecord,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductQuestion,
  StoreSettings,
} from './src/types/store';
import {
  calculateCartTotals,
  calculateSuggestedPrice,
  evaluateProductPrice,
  PROMO_40_THRESHOLD_BRL,
} from './src/utils/pricing';
import { getCleanProductSlug } from './src/utils/seo';
import { isValidCEP, isValidCPF } from './src/utils/validators';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_DISPLAY,
  DEFAULT_WHATSAPP_NUMBER,
  sanitizeWhatsAppNumber,
} from './src/utils/whatsapp';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const CATALOG_PATH = path.resolve(DATA_DIR, 'catalog.json');
const STATE_PATH = path.resolve(DATA_DIR, 'store-state.json');
const ADMIN_AUTH_PATH = path.resolve(DATA_DIR, 'admin-auth.json');

const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

interface PersistedState {
  products: Product[];
  categories: CategoryDefinition[];
  settings: StoreSettings;
  orders: OrderRecord[];
  reviews: CustomerReview[];
  productQuestions: ProductQuestion[];
  newsletterSubscribers: NewsletterSubscriber[];
}

interface AdminAuthFile {
  salt: string;
  hash: string;
  claimedAt: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'AGROLEITE',
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  whatsappDisplay: DEFAULT_WHATSAPP_DISPLAY,
  defaultDiscountPercent: 40,
  minMarginPercent: 10,
  requireCostApprovalToPublish: false,
  supportHours: 'Seg a Sex · 08h às 18h · Sáb · 08h às 12h',
  supportCityState: 'Atendimento Nacional · Envio para todo o Brasil',
  acceptedPaymentMethods: DEFAULT_ACCEPTED_PAYMENT_METHODS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  newsletterWebhookUrl: '',
  companyLegalInfo: '',
  faqItems: DEFAULT_FAQ_ITEMS,
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadInitialState(): PersistedState {
  ensureDataDir();
  if (fs.existsSync(STATE_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) as Partial<PersistedState>;
      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        return {
          products: parsed.products,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : MAIN_CATEGORIES,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(parsed.settings || {}),
            acceptedPaymentMethods: {
              ...DEFAULT_ACCEPTED_PAYMENT_METHODS,
              ...(parsed.settings?.acceptedPaymentMethods || {}),
            },
            socialLinks: {
              ...DEFAULT_SOCIAL_LINKS,
              ...(parsed.settings?.socialLinks || {}),
            },
            faqItems:
              Array.isArray(parsed.settings?.faqItems) && parsed.settings.faqItems.length > 0
                ? parsed.settings.faqItems
                : DEFAULT_FAQ_ITEMS,
          },
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
          productQuestions: Array.isArray(parsed.productQuestions) ? parsed.productQuestions : [],
          newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers)
            ? parsed.newsletterSubscribers
            : [],
        };
      }
    } catch {
      // Fallback to base catalog below if state file is corrupted
    }
  }

  let initialProducts: Product[] = [];
  if (fs.existsSync(CATALOG_PATH)) {
    initialProducts = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as Product[];
  }

  const state: PersistedState = {
    products: initialProducts,
    categories: MAIN_CATEGORIES,
    settings: DEFAULT_SETTINGS,
    orders: [],
    reviews: [],
    productQuestions: [],
    newsletterSubscribers: [],
  };
  saveState(state);
  return state;
}

function saveState(state: PersistedState): void {
  ensureDataDir();
  const tmpPath = `${STATE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpPath, STATE_PATH);
}

function getAdminPasscodeEnv(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function readAdminAuthFile(): AdminAuthFile | null {
  if (!fs.existsSync(ADMIN_AUTH_PATH)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(ADMIN_AUTH_PATH, 'utf8')) as AdminAuthFile;
    if (parsed && typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function hashPasswordScrypt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function verifyAdminPassword(candidate: string): boolean {
  const envSecret = getAdminPasscodeEnv();
  if (envSecret.length > 0) {
    return constantTimeStringEqual(candidate, envSecret);
  }
  const authFile = readAdminAuthFile();
  if (!authFile) return false;
  const candidateHash = hashPasswordScrypt(candidate, authFile.salt);
  const bufA = Buffer.from(candidateHash, 'hex');
  const bufB = Buffer.from(authFile.hash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function issueSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + 12 * 60 * 60 * 1000,
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (!constantTimeStringEqual(sig, expectedSig)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !verifySessionToken(token)) {
    res.status(401).json({ error: 'Sessão administrativa expirada ou não autenticada.' });
    return;
  }
  next();
}

function sanitizePublicProduct(product: Product, settings: StoreSettings): Product {
  const evalResult = evaluateProductPrice(product, settings);
  return {
    ...product,
    costPrice: null, // Never expose costPrice in public storefront API
    promoPrice: evalResult.displayPrice,
    priceOnRequest: evalResult.isConsultOnly,
  };
}

function formatPhoneDisplay(digits: string): string {
  const clean = sanitizeWhatsAppNumber(digits);
  if (clean.length === 13 && clean.startsWith('55')) {
    return `+55 ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  if (clean.length === 12 && clean.startsWith('55')) {
    return `+55 ${clean.slice(2, 4)} ${clean.slice(4, 8)}-${clean.slice(8)}`;
  }
  return `+${clean}`;
}

function sanitizePublicSettings(settings: StoreSettings): StoreSettings {
  const { newsletterWebhookUrl, ...rest } = settings;
  return {
    ...rest,
    newsletterIntegrationConfigured: Boolean(newsletterWebhookUrl && newsletterWebhookUrl.trim()),
  };
}

function sanitizePublicReview(review: CustomerReview): CustomerReview {
  return {
    ...review,
    authorName: review.authorizeName ? review.authorName : 'Cliente AGROLEITE',
    cityState: review.authorizeLocation ? review.cityState : '',
  };
}

function isSafeHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  let storeState = loadInitialState();

  // Public storefront data
  app.get('/api/store', (_req, res) => {
    const publicProducts = storeState.products.map((p) =>
      sanitizePublicProduct(p, storeState.settings)
    );
    const publicReviews = storeState.reviews
      .filter((r) => r.approved)
      .map(sanitizePublicReview);
    res.json({
      products: publicProducts,
      categories: storeState.categories,
      settings: sanitizePublicSettings(storeState.settings),
      reviews: publicReviews,
    });
  });

  // Approved customer reviews & submission (requires admin approval)
  app.get('/api/reviews', (_req, res) => {
    const publicReviews = storeState.reviews
      .filter((r) => r.approved)
      .map(sanitizePublicReview);
    res.json({ reviews: publicReviews });
  });

  app.post('/api/reviews', (req, res) => {
    const body = req.body as Partial<CustomerReview>;
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
    const authorName = typeof body?.authorName === 'string' ? body.authorName.trim() : '';
    const cityState = typeof body?.cityState === 'string' ? body.cityState.trim() : '';
    const productName = typeof body?.productName === 'string' ? body.productName.trim() : '';
    const authorizeName = Boolean(body?.authorizeName);
    const authorizeLocation = Boolean(body?.authorizeLocation);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Selecione uma avaliação entre 1 e 5 estrelas.' });
      return;
    }
    if (comment.length < 10 || comment.length > 600) {
      res.status(400).json({
        error: 'Escreva um comentário entre 10 e 600 caracteres sobre sua experiência.',
      });
      return;
    }
    if (authorizeName && authorName.length < 2) {
      res.status(400).json({ error: 'Informe seu nome para exibição autorizada.' });
      return;
    }
    if (authorizeLocation && cityState.length < 3) {
      res.status(400).json({ error: 'Informe sua cidade e estado para exibição autorizada.' });
      return;
    }

    const review: CustomerReview = {
      id: `REV-${Date.now().toString(36).toUpperCase()}`,
      rating,
      comment,
      authorName: authorName || 'Cliente',
      authorizeName,
      cityState,
      authorizeLocation,
      productName: productName || undefined,
      createdAt: new Date().toISOString(),
      approved: false,
    };

    storeState.reviews = [review, ...storeState.reviews].slice(0, 500);
    saveState(storeState);
    res.status(201).json({
      ok: true,
      message:
        'Avaliação enviada com sucesso! Ela passará por verificação administrativa antes de ser publicada na loja.',
    });
  });

  // Product Q&A (requires admin review & answer before publishing)
  app.get('/api/product-questions/:productId', (req, res) => {
    const pid = String(req.params.productId || '');
    const questions = storeState.productQuestions.filter(
      (q) => q.productId === pid && q.approved && Boolean(q.answer && q.answer.trim())
    );
    res.json({ questions });
  });

  app.post('/api/product-questions', (req, res) => {
    const body = req.body as Partial<ProductQuestion>;
    const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
    const customerName =
      typeof body?.customerName === 'string' ? body.customerName.trim() : '';
    const question = typeof body?.question === 'string' ? body.question.trim() : '';

    const product = storeState.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    if (customerName.length < 2) {
      res.status(400).json({ error: 'Informe seu nome para enviar a dúvida.' });
      return;
    }
    if (question.length < 8 || question.length > 500) {
      res.status(400).json({
        error: 'Escreva sua dúvida com pelo menos 8 e no máximo 500 caracteres.',
      });
      return;
    }

    const item: ProductQuestion = {
      id: `QST-${Date.now().toString(36).toUpperCase()}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      customerName,
      question,
      answer: null,
      createdAt: new Date().toISOString(),
      answeredAt: null,
      approved: false,
    };

    storeState.productQuestions = [item, ...storeState.productQuestions].slice(0, 1000);
    saveState(storeState);
    res.status(201).json({
      ok: true,
      message:
        'Dúvida registrada! Nossa equipe técnica irá analisar e responder antes da publicação nesta página.',
    });
  });

  // Newsletter signup (real server persistence + optional webhook integration)
  app.post('/api/newsletter', async (req, res) => {
    const emailRaw = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const consentAccepted = Boolean(req.body?.consentAccepted);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw)) {
      res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
      return;
    }
    if (!consentAccepted) {
      res.status(400).json({
        error: 'É necessário confirmar o consentimento para receber comunicações por e-mail.',
      });
      return;
    }

    const webhookUrl = (storeState.settings.newsletterWebhookUrl || '').trim();
    const integrationConfigured = Boolean(webhookUrl && isSafeHttpsUrl(webhookUrl));

    const existing = storeState.newsletterSubscribers.find((s) => s.email === emailRaw);
    if (existing) {
      res.json({
        ok: true,
        alreadySubscribed: true,
        integrationConfigured,
        message: integrationConfigured
          ? 'Este e-mail já está cadastrado na lista de ofertas da AGROLEITE.'
          : 'Este e-mail já está salvo no registro interno da loja. O envio automático depende da integração de e-mail no painel administrativo.',
      });
      return;
    }

    let integrationSent = false;
    if (integrationConfigured) {
      try {
        const hookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailRaw,
            consentAccepted: true,
            source: 'AGROLEITE',
            createdAt: new Date().toISOString(),
          }),
        });
        integrationSent = hookRes.ok;
      } catch {
        integrationSent = false;
      }
    }

    const sub: NewsletterSubscriber = {
      id: `SUB-${Date.now().toString(36).toUpperCase()}`,
      email: emailRaw,
      consentAccepted: true,
      createdAt: new Date().toISOString(),
      integrationSent,
    };

    storeState.newsletterSubscribers = [sub, ...storeState.newsletterSubscribers].slice(0, 5000);
    saveState(storeState);

    res.status(201).json({
      ok: true,
      alreadySubscribed: false,
      integrationConfigured,
      integrationSent,
      message: integrationConfigured
        ? integrationSent
          ? 'E-mail cadastrado e enviado à integração de ofertas com sucesso!'
          : 'E-mail salvo na lista da loja, mas a integração externa não confirmou o recebimento neste momento.'
        : 'Seu e-mail foi salvo no cadastro interno da loja. Atenção: nenhuma plataforma externa de envio automático de e-mails está integrada ainda.',
    });
  });

  // Real order lookup (only verified registered orders; zero fabricated tracking/delivery statuses)
  app.post('/api/orders/lookup', (req, res) => {
    const orderIdInput =
      typeof req.body?.orderId === 'string' ? req.body.orderId.trim().toUpperCase() : '';
    const cpfDigits =
      typeof req.body?.cpf === 'string' ? req.body.cpf.replace(/\D/g, '') : '';
    const phoneDigits =
      typeof req.body?.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';

    if (cpfDigits.length !== 11 || (!orderIdInput && phoneDigits.length < 10)) {
      res.status(400).json({
        error:
          'Informe seu CPF completo e o número de telefone ou código do pedido para consultar pedidos reais registrados.',
      });
      return;
    }

    const matches = storeState.orders.filter((o) => {
      const orderCpf = (o.customer.cpf || '').replace(/\D/g, '');
      if (orderCpf !== cpfDigits) return false;
      if (orderIdInput) {
        return o.id.toUpperCase() === orderIdInput;
      }
      const orderPhone = (o.customer.phone || '').replace(/\D/g, '');
      return orderPhone === phoneDigits;
    });

    res.json({
      integrationStatus: 'whatsapp_only',
      orders: matches.map((o) => {
        const payStatus = o.paymentStatus || 'AWAITING_WHATSAPP';
        const stageLabel =
          payStatus === 'PAGO'
            ? 'PAGO · Confirmado pelo provedor'
            : payStatus === 'AGUARDANDO PAGAMENTO'
            ? 'AGUARDANDO PAGAMENTO'
            : payStatus === 'PAGAMENTO NÃO APROVADO'
            ? 'PAGAMENTO NÃO APROVADO'
            : 'Registrado para atendimento via WhatsApp';

        return {
          id: o.id,
          createdAt: o.createdAt,
          customerName: o.customer.name,
          cityState: o.customer.cityState,
          cep: o.customer.cep,
          paymentMethod: o.customer.paymentMethod,
          paymentStatus: payStatus,
          paymentTransaction: o.paymentTransaction || null,
          subtotal: o.subtotal,
          pixDiscount: o.pixDiscount,
          total: o.total,
          items: o.items,
          whatsappUrl: o.whatsappUrl,
          stageLabel,
        };
      }),
    });
  });

  // Record order before WhatsApp redirect or Mercado Pago Card Checkout
  app.post('/api/orders', (req, res) => {
    const body = req.body as {
      customer?: Partial<CustomerCheckoutData>;
      items?: Array<{ productId?: string; quantity?: number }>;
    };

    const name = typeof body?.customer?.name === 'string' ? body.customer.name.trim() : '';
    const cpf = typeof body?.customer?.cpf === 'string' ? body.customer.cpf.trim() : '';
    const phone = typeof body?.customer?.phone === 'string' ? body.customer.phone.trim() : '';
    const cep = typeof body?.customer?.cep === 'string' ? body.customer.cep.trim() : '';
    const cityState =
      typeof body?.customer?.cityState === 'string' ? body.customer.cityState.trim() : '';
    const addressOrNotes =
      typeof body?.customer?.addressOrNotes === 'string'
        ? body.customer.addressOrNotes.trim()
        : '';
    const email =
      typeof body?.customer?.email === 'string' ? body.customer.email.trim().toLowerCase() : '';

    const rawMethod = body?.customer?.paymentMethod;
    const paymentMethod: PaymentMethod =
      rawMethod === 'credit_card' || rawMethod === 'debit_card' || rawMethod === 'standard'
        ? rawMethod
        : 'pix';

    if (name.length < 3) {
      res.status(400).json({ error: 'Informe o nome completo do comprador.' });
      return;
    }
    if (!isValidCPF(cpf)) {
      res.status(400).json({ error: 'Informe um CPF válido.' });
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      res.status(400).json({ error: 'Informe um telefone de contato válido com DDD.' });
      return;
    }
    if (!isValidCEP(cep)) {
      res.status(400).json({ error: 'Informe um CEP válido com 8 dígitos.' });
      return;
    }
    if (cityState.length < 3) {
      res.status(400).json({ error: 'Informe sua cidade e estado.' });
      return;
    }

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      res.status(400).json({ error: 'O carrinho está vazio.' });
      return;
    }

    const verifiedItems: CartItem[] = [];
    for (const rawItem of body.items) {
      const qty = Number(rawItem.quantity);
      if (!rawItem.productId || !Number.isInteger(qty) || qty < 1 || qty > 999) {
        res.status(400).json({ error: 'Quantidade inválida no pedido.' });
        return;
      }
      const product = storeState.products.find((p) => p.id === String(rawItem.productId));
      if (!product) {
        res.status(400).json({ error: 'Um dos produtos do carrinho não foi encontrado.' });
        return;
      }
      const priceEval = evaluateProductPrice(product, storeState.settings);
      if (priceEval.displayPrice === null) {
        res.status(400).json({
          error: `O produto "${product.name}" está com preço sob consulta e deve ser cotado diretamente pelo WhatsApp.`,
        });
        return;
      }
      verifiedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        image: product.images[0] || null,
        unitPrice: priceEval.displayPrice,
        originalPrice: priceEval.originalPrice,
        eligibleForPromo40: priceEval.eligibleForPromo40,
        quantity: qty,
        category: product.category,
      });
    }

    const totals = calculateCartTotals(verifiedItems, paymentMethod);
    const orderId = `PED-${Date.now().toString(36).toUpperCase()}`;
    const initialPaymentStatus: PaymentStatus = 'AWAITING_WHATSAPP';

    const customer: CustomerCheckoutData = {
      name,
      cpf,
      phone,
      cep,
      cityState,
      addressOrNotes,
      ...(email ? { email } : {}),
      paymentMethod,
    };
    const message = buildWhatsAppOrderMessage(customer, verifiedItems, totals.finalTotal, {
      orderId,
      paymentStatus: initialPaymentStatus,
    });
    const whatsappUrl = buildWhatsAppUrl(storeState.settings.whatsappNumber, message);

    const order: OrderRecord = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customer,
      items: verifiedItems,
      subtotal: totals.subtotal,
      pixDiscount: totals.pixDiscountApplied,
      promo40Savings: totals.promo40Savings,
      totalSavings: totals.totalSavingsApplied,
      total: totals.finalTotal,
      whatsappUrl,
      paymentStatus: initialPaymentStatus,
      paymentTransaction: null,
    };

    storeState.orders = [order, ...storeState.orders].slice(0, 500);
    saveState(storeState);

    res.status(201).json({ ok: true, order });
  });

  // Admin auth status
  app.get('/api/admin/auth-status', (_req, res) => {
    const hasEnv = getAdminPasscodeEnv().length > 0;
    const authFile = readAdminAuthFile();
    const claimed = Boolean(authFile);
    res.json({
      mode: hasEnv ? 'env' : claimed ? 'claimed' : 'unclaimed',
      hasConfiguredSecret: hasEnv,
      claimed,
    });
  });

  // First-run admin claim (only allowed when ADMIN_PASSCODE env is unset and not yet claimed)
  app.post('/api/admin/claim', (req, res) => {
    if (getAdminPasscodeEnv().length > 0) {
      res.status(403).json({
        error: 'A senha administrativa está configurada via variável de ambiente.',
      });
      return;
    }
    if (readAdminAuthFile()) {
      res.status(409).json({
        error: 'A senha administrativa já foi definida. Utilize o login.',
      });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (password.length < 8) {
      res.status(400).json({
        error: 'Defina uma senha com pelo menos 8 caracteres.',
      });
      return;
    }
    ensureDataDir();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPasswordScrypt(password, salt);
    const authRecord: AdminAuthFile = {
      salt,
      hash,
      claimedAt: new Date().toISOString(),
    };
    fs.writeFileSync(ADMIN_AUTH_PATH, JSON.stringify(authRecord, null, 2), {
      encoding: 'utf8',
      flag: 'wx',
    });
    const token = issueSessionToken();
    res.status(201).json({ token });
  });

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (!password) {
      res.status(400).json({ error: 'Informe a senha administrativa.' });
      return;
    }
    if (!verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }
    const token = issueSessionToken();
    res.json({ token });
  });

  // Protected Admin routes
  app.get('/api/admin/state', requireAdmin, (_req, res) => {
    res.json({
      products: storeState.products,
      categories: storeState.categories,
      settings: storeState.settings,
      orders: storeState.orders,
      reviews: storeState.reviews,
      productQuestions: storeState.productQuestions,
      newsletterSubscribers: storeState.newsletterSubscribers,
    });
  });

  app.put('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const idx = storeState.reviews.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Avaliação não encontrada.' });
      return;
    }
    const approved = Boolean(req.body?.approved);
    storeState.reviews[idx] = {
      ...storeState.reviews[idx],
      approved,
    };
    saveState(storeState);
    res.json({ review: storeState.reviews[idx] });
  });

  app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const before = storeState.reviews.length;
    storeState.reviews = storeState.reviews.filter((r) => r.id !== req.params.id);
    if (storeState.reviews.length === before) {
      res.status(404).json({ error: 'Avaliação não encontrada.' });
      return;
    }
    saveState(storeState);
    res.json({ ok: true });
  });

  app.put('/api/admin/product-questions/:id', requireAdmin, (req, res) => {
    const idx = storeState.productQuestions.findIndex((q) => q.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Pergunta não encontrada.' });
      return;
    }
    const answer = typeof req.body?.answer === 'string' ? req.body.answer.trim() : '';
    const approved = Boolean(req.body?.approved && answer.length > 0);
    storeState.productQuestions[idx] = {
      ...storeState.productQuestions[idx],
      answer: answer || null,
      answeredAt: answer ? new Date().toISOString() : null,
      approved,
    };
    saveState(storeState);
    res.json({ question: storeState.productQuestions[idx] });
  });

  app.delete('/api/admin/product-questions/:id', requireAdmin, (req, res) => {
    const before = storeState.productQuestions.length;
    storeState.productQuestions = storeState.productQuestions.filter((q) => q.id !== req.params.id);
    if (storeState.productQuestions.length === before) {
      res.status(404).json({ error: 'Pergunta não encontrada.' });
      return;
    }
    saveState(storeState);
    res.json({ ok: true });
  });

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body as Partial<Product>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    if (!name || !category) {
      res.status(400).json({ error: 'Nome e categoria são obrigatórios.' });
      return;
    }

    const referencePrice =
      typeof body.referencePrice === 'number' && body.referencePrice > 0
        ? body.referencePrice
        : null;
    const discountPercent =
      typeof body.discountPercent === 'number' && body.discountPercent >= 0
        ? body.discountPercent
        : storeState.settings.defaultDiscountPercent;
    const promoPrice =
      typeof body.promoPrice === 'number' && body.promoPrice > 0
        ? body.promoPrice
        : calculateSuggestedPrice(referencePrice, discountPercent);
    const costPrice =
      typeof body.costPrice === 'number' && body.costPrice > 0 ? body.costPrice : null;

    const id = `AG-${Date.now().toString(36).toUpperCase()}`;
    const newProduct: Product = {
      id,
      sku: typeof body.sku === 'string' && body.sku.trim() ? body.sku.trim() : id,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-'),
      category,
      subcategory:
        typeof body.subcategory === 'string' && body.subcategory.trim()
          ? body.subcategory.trim()
          : category,
      brand: typeof body.brand === 'string' && body.brand.trim() ? body.brand.trim() : null,
      model: typeof body.model === 'string' && body.model.trim() ? body.model.trim() : null,
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : `${name} — equipamento agropecuário.`,
      specs: Array.isArray(body.specs) ? body.specs : [],
      images: Array.isArray(body.images)
        ? body.images.filter((u) => typeof u === 'string' && /^https?:\/\/|^\/src\/assets\//.test(u))
        : [],
      referencePrice,
      referenceListPrice: null,
      discountPercent,
      promoPrice,
      costPrice,
      costConfirmed: costPrice !== null,
      priceApproved: Boolean(body.priceApproved && costPrice !== null),
      available: body.available !== false,
      priceOnRequest: promoPrice === null,
      featured: Boolean(body.featured),
    };

    storeState.products = [newProduct, ...storeState.products];
    saveState(storeState);
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const idx = storeState.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }

    const existing = storeState.products[idx];
    const body = req.body as Partial<Product>;

    const referencePrice =
      body.referencePrice !== undefined
        ? body.referencePrice !== null && Number(body.referencePrice) > 0
          ? Number(body.referencePrice)
          : null
        : existing.referencePrice;

    const discountPercent =
      body.discountPercent !== undefined && Number.isFinite(Number(body.discountPercent))
        ? Math.max(0, Math.min(90, Number(body.discountPercent)))
        : existing.discountPercent;

    let promoPrice = existing.promoPrice;
    if (body.promoPrice !== undefined) {
      promoPrice =
        body.promoPrice !== null && Number(body.promoPrice) > 0
          ? Number(body.promoPrice)
          : null;
    } else if (body.referencePrice !== undefined || body.discountPercent !== undefined) {
      promoPrice = calculateSuggestedPrice(referencePrice, discountPercent);
    }

    const costPrice =
      body.costPrice !== undefined
        ? body.costPrice !== null && Number(body.costPrice) > 0
          ? Number(body.costPrice)
          : null
        : existing.costPrice;

    const costConfirmed =
      body.costConfirmed !== undefined ? Boolean(body.costConfirmed) : costPrice !== null;

    const updated: Product = {
      ...existing,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
      sku: typeof body.sku === 'string' && body.sku.trim() ? body.sku.trim() : existing.sku,
      category:
        typeof body.category === 'string' && body.category.trim()
          ? body.category.trim()
          : existing.category,
      subcategory:
        typeof body.subcategory === 'string' && body.subcategory.trim()
          ? body.subcategory.trim()
          : existing.subcategory,
      brand: body.brand !== undefined ? body.brand || null : existing.brand,
      model: body.model !== undefined ? body.model || null : existing.model,
      description:
        typeof body.description === 'string' ? body.description.trim() : existing.description,
      images: Array.isArray(body.images)
        ? body.images.filter((u) => typeof u === 'string' && /^https?:\/\/|^\/src\/assets\//.test(u))
        : existing.images,
      available: body.available !== undefined ? Boolean(body.available) : existing.available,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
      referencePrice,
      discountPercent,
      promoPrice,
      costPrice,
      costConfirmed,
      priceApproved:
        body.priceApproved !== undefined ? Boolean(body.priceApproved) : existing.priceApproved,
      priceOnRequest: promoPrice === null,
    };

    storeState.products[idx] = updated;
    saveState(storeState);
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const before = storeState.products.length;
    storeState.products = storeState.products.filter((p) => p.id !== id);
    if (storeState.products.length === before) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    saveState(storeState);
    res.json({ ok: true });
  });

  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const parentCategory =
      typeof req.body?.parentCategory === 'string' ? req.body.parentCategory.trim() : '';
    if (!name) {
      res.status(400).json({ error: 'Informe o nome da categoria.' });
      return;
    }

    if (parentCategory === 'Peças e Acessórios') {
      const pecas = storeState.categories.find((c) => c.name === 'Peças e Acessórios');
      if (pecas) {
        const subs = pecas.subcategories || [];
        if (!subs.includes(name)) {
          pecas.subcategories = [...subs, name].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        }
      }
    } else {
      const exists = storeState.categories.some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (!exists) {
        storeState.categories.push({
          id: name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-'),
          name,
          slug: name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-'),
          isMain: true,
          description: `Categoria ${name}`,
        });
      }
    }

    saveState(storeState);
    res.status(201).json({ categories: storeState.categories });
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const body = req.body as Partial<StoreSettings>;
    const whatsappDigits =
      typeof body.whatsappNumber === 'string'
        ? sanitizeWhatsAppNumber(body.whatsappNumber)
        : storeState.settings.whatsappNumber;

    const defaultDiscountPercent =
      typeof body.defaultDiscountPercent === 'number' &&
      body.defaultDiscountPercent >= 0 &&
      body.defaultDiscountPercent <= 90
        ? body.defaultDiscountPercent
        : storeState.settings.defaultDiscountPercent;

    const minMarginPercent =
      typeof body.minMarginPercent === 'number' &&
      body.minMarginPercent >= 0 &&
      body.minMarginPercent <= 200
        ? body.minMarginPercent
        : storeState.settings.minMarginPercent;

    const currentPaymentMethods =
      storeState.settings.acceptedPaymentMethods || DEFAULT_ACCEPTED_PAYMENT_METHODS;
    const nextPaymentMethods = body.acceptedPaymentMethods
      ? {
          pix: Boolean(body.acceptedPaymentMethods.pix),
          visa: Boolean(body.acceptedPaymentMethods.visa),
          mastercard: Boolean(body.acceptedPaymentMethods.mastercard),
          elo: Boolean(body.acceptedPaymentMethods.elo),
          hipercard: Boolean(body.acceptedPaymentMethods.hipercard),
          amex: Boolean(body.acceptedPaymentMethods.amex),
          boleto: Boolean(body.acceptedPaymentMethods.boleto),
        }
      : currentPaymentMethods;

    const currentSocial = storeState.settings.socialLinks || DEFAULT_SOCIAL_LINKS;
    const sanitizeSocial = (val: unknown, fallback: string): string => {
      if (typeof val !== 'string') return fallback;
      const trimmed = val.trim();
      if (!trimmed) return '';
      return isSafeHttpsUrl(trimmed) ? trimmed : fallback;
    };

    const nextSocialLinks = body.socialLinks
      ? {
          instagramUrl: sanitizeSocial(body.socialLinks.instagramUrl, currentSocial.instagramUrl),
          facebookUrl: sanitizeSocial(body.socialLinks.facebookUrl, currentSocial.facebookUrl),
          youtubeUrl: sanitizeSocial(body.socialLinks.youtubeUrl, currentSocial.youtubeUrl),
        }
      : currentSocial;

    let nextNewsletterWebhook = storeState.settings.newsletterWebhookUrl || '';
    if (typeof body.newsletterWebhookUrl === 'string') {
      const candidateHook = body.newsletterWebhookUrl.trim();
      nextNewsletterWebhook = candidateHook && isSafeHttpsUrl(candidateHook) ? candidateHook : '';
    }

    const nextFaqItems: FaqItem[] =
      Array.isArray(body.faqItems) && body.faqItems.length > 0
        ? body.faqItems
            .filter(
              (f): f is FaqItem =>
                Boolean(f) &&
                typeof f.id === 'string' &&
                typeof f.question === 'string' &&
                typeof f.answer === 'string' &&
                f.question.trim().length > 0 &&
                f.answer.trim().length > 0
            )
            .slice(0, 30)
        : storeState.settings.faqItems || DEFAULT_FAQ_ITEMS;

    storeState.settings = {
      ...storeState.settings,
      whatsappNumber: whatsappDigits,
      whatsappDisplay: formatPhoneDisplay(whatsappDigits),
      defaultDiscountPercent,
      minMarginPercent,
      requireCostApprovalToPublish:
        body.requireCostApprovalToPublish !== undefined
          ? Boolean(body.requireCostApprovalToPublish)
          : storeState.settings.requireCostApprovalToPublish,
      supportHours:
        typeof body.supportHours === 'string' && body.supportHours.trim()
          ? body.supportHours.trim()
          : storeState.settings.supportHours,
      supportCityState:
        typeof body.supportCityState === 'string' && body.supportCityState.trim()
          ? body.supportCityState.trim()
          : storeState.settings.supportCityState,
      acceptedPaymentMethods: nextPaymentMethods,
      socialLinks: nextSocialLinks,
      newsletterWebhookUrl: nextNewsletterWebhook,
      companyLegalInfo:
        typeof body.companyLegalInfo === 'string'
          ? body.companyLegalInfo.trim().slice(0, 300)
          : storeState.settings.companyLegalInfo || '',
      faqItems: nextFaqItems,
    };

    saveState(storeState);
    res.json({ settings: storeState.settings });
  });

  app.post('/api/admin/recalculate-prices', requireAdmin, (req, res) => {
    const discountPercent =
      typeof req.body?.discountPercent === 'number' &&
      req.body.discountPercent >= 0 &&
      req.body.discountPercent <= 90
        ? req.body.discountPercent
        : storeState.settings.defaultDiscountPercent;

    storeState.settings.defaultDiscountPercent = discountPercent;
    storeState.products = storeState.products.map((p) => {
      if (p.referencePrice === null) return p;
      const eligible = p.referencePrice >= PROMO_40_THRESHOLD_BRL;
      return {
        ...p,
        discountPercent: eligible ? discountPercent : 0,
        promoPrice: calculateSuggestedPrice(p.referencePrice, discountPercent),
      };
    });

    saveState(storeState);
    res.json({
      products: storeState.products,
      settings: storeState.settings,
    });
  });

  // SEO: robots.txt & sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL?.trim() || `${req.protocol}://${req.get('host')}`;
    const cleanBase = baseUrl.replace(/\/+$/, '');
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        `Sitemap: ${cleanBase}/sitemap.xml`,
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl =
      process.env.APP_URL?.trim() || `${req.protocol}://${req.get('host')}`;
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const urls: string[] = [`${cleanBase}/`];

    for (const cat of storeState.categories) {
      urls.push(`${cleanBase}/categoria/${encodeURIComponent(cat.slug)}`);
    }
    for (const prod of storeState.products) {
      urls.push(`${cleanBase}/produto/${encodeURIComponent(getCleanProductSlug(prod))}`);
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (loc) => `  <url><loc>${escapeXml(loc)}</loc><changefreq>weekly</changefreq></url>`
      ),
      '</urlset>',
    ].join('\n');

    res.type('application/xml').send(xml);
  });

  // Frontend mounting
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AGROLEITE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
