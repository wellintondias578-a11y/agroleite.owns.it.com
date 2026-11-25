import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_ACCEPTED_PAYMENT_METHODS,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_SOCIAL_LINKS,
} from '../data/storeContent';
import type {
  AcceptedPaymentMethods,
  AdminAuthStatus,
  CategoryDefinition,
  CustomerReview,
  FaqItem,
  NewsletterSubscriber,
  OrderRecord,
  Product,
  ProductQuestion,
  SocialLinks,
  StoreSettings,
} from '../types/store';
import {
  calculateSuggestedPrice,
  evaluateProductPrice,
  formatBRLWithSymbol,
} from '../utils/pricing';

interface AdminPanelProps {
  onBackToStore: () => void;
  onStoreDataChanged: () => void;
}

type AdminTab =
  | 'products'
  | 'categories'
  | 'settings'
  | 'orders'
  | 'reviews'
  | 'questions'
  | 'newsletter';
type ProductFilterMode = 'all' | 'blocked' | 'unconfirmed_cost' | 'approved' | 'consult';

export function AdminPanel({ onBackToStore, onStoreDataChanged }: AdminPanelProps) {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [productQuestions, setProductQuestions] = useState<ProductQuestion[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>({});
  const [loadingState, setLoadingState] = useState(false);
  const [notice, setNotice] = useState<string>('');

  // Product filters & editing
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<ProductFilterMode>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('Peças e Acessórios');

  // Settings form
  const [whatsappInput, setWhatsappInput] = useState('');
  const [discountInput, setDiscountInput] = useState('40');
  const [minMarginInput, setMinMarginInput] = useState('10');
  const [strictApproval, setStrictApproval] = useState(false);
  const [supportHoursInput, setSupportHoursInput] = useState('');
  const [supportCityInput, setSupportCityInput] = useState('');
  const [paymentMethodsInput, setPaymentMethodsInput] = useState<AcceptedPaymentMethods>(
    DEFAULT_ACCEPTED_PAYMENT_METHODS
  );
  const [socialLinksInput, setSocialLinksInput] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  const [companyLegalInput, setCompanyLegalInput] = useState('');
  const [newsletterWebhookInput, setNewsletterWebhookInput] = useState('');
  const [faqItemsInput, setFaqItemsInput] = useState<FaqItem[]>(DEFAULT_FAQ_ITEMS);

  useEffect(() => {
    fetch('/api/admin/auth-status')
      .then((r) => r.json())
      .then((data: AdminAuthStatus) => setAuthStatus(data))
      .catch(() => setAuthError('Não foi possível verificar o status de autenticação.'));
  }, []);

  const loadAdminData = async (bearerToken: string) => {
    setLoadingState(true);
    try {
      const res = await fetch('/api/admin/state', {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (res.status === 401) {
        setToken(null);
        setAuthError('Sessão expirada. Faça login novamente.');
        return;
      }
      const data = (await res.json()) as {
        products: Product[];
        categories: CategoryDefinition[];
        settings: StoreSettings;
        orders: OrderRecord[];
        reviews?: CustomerReview[];
        productQuestions?: ProductQuestion[];
        newsletterSubscribers?: NewsletterSubscriber[];
      };
      setProducts(data.products);
      setCategories(data.categories);
      setSettings(data.settings);
      setOrders(data.orders);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      const loadedQuestions = Array.isArray(data.productQuestions) ? data.productQuestions : [];
      setProductQuestions(loadedQuestions);
      const drafts: Record<string, string> = {};
      for (const q of loadedQuestions) {
        drafts[q.id] = q.answer || '';
      }
      setQuestionDrafts(drafts);
      setSubscribers(Array.isArray(data.newsletterSubscribers) ? data.newsletterSubscribers : []);

      setWhatsappInput(data.settings.whatsappNumber);
      setDiscountInput(String(data.settings.defaultDiscountPercent));
      setMinMarginInput(String(data.settings.minMarginPercent));
      setStrictApproval(data.settings.requireCostApprovalToPublish);
      setSupportHoursInput(data.settings.supportHours);
      setSupportCityInput(data.settings.supportCityState);
      setPaymentMethodsInput(
        data.settings.acceptedPaymentMethods || DEFAULT_ACCEPTED_PAYMENT_METHODS
      );
      setSocialLinksInput(data.settings.socialLinks || DEFAULT_SOCIAL_LINKS);
      setCompanyLegalInput(data.settings.companyLegalInfo || '');
      setNewsletterWebhookInput(data.settings.newsletterWebhookUrl || '');
      setFaqItemsInput(
        Array.isArray(data.settings.faqItems) && data.settings.faqItems.length > 0
          ? data.settings.faqItems
          : DEFAULT_FAQ_ITEMS
      );
    } catch {
      setNotice('Erro ao carregar dados administrativos.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleClaim = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (passwordInput.trim().length < 8) {
      setAuthError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('As senhas digitadas não conferem.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Falha ao configurar a senha administrativa.');
        return;
      }
      setToken(data.token);
      setPasswordInput('');
      setConfirmPasswordInput('');
      setAuthStatus({ mode: 'claimed', hasConfiguredSecret: false, claimed: true });
      await loadAdminData(data.token);
    } catch {
      setAuthError('Erro de conexão ao salvar senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Senha inválida.');
        return;
      }
      setToken(data.token);
      setPasswordInput('');
      await loadAdminData(data.token);
    } catch {
      setAuthError('Erro de conexão ao autenticar.');
    } finally {
      setAuthLoading(false);
    }
  };

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !token) return;
    setSavingProduct(true);
    try {
      const url = isCreatingNew
        ? '/api/admin/products'
        : `/api/admin/products/${editingProduct.id}`;
      const method = isCreatingNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingProduct),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        flashNotice(err.error || 'Erro ao salvar produto.');
        return;
      }
      setEditingProduct(null);
      setIsCreatingNew(false);
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice('Produto salvo e atualizado na loja.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice('Produto removido do catálogo.');
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        whatsappNumber: whatsappInput,
        defaultDiscountPercent: Number(discountInput),
        minMarginPercent: Number(minMarginInput),
        requireCostApprovalToPublish: strictApproval,
        supportHours: supportHoursInput,
        supportCityState: supportCityInput,
        acceptedPaymentMethods: paymentMethodsInput,
        socialLinks: socialLinksInput,
        companyLegalInfo: companyLegalInput,
        newsletterWebhookUrl: newsletterWebhookInput,
        faqItems: faqItemsInput,
      }),
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice('Configurações da loja atualizadas.');
    }
  };

  const handleToggleReviewApproval = async (reviewId: string, approved: boolean) => {
    if (!token) return;
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ approved }),
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice(approved ? 'Avaliação aprovada e publicada.' : 'Avaliação ocultada da loja.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice('Avaliação excluída.');
    }
  };

  const handleSaveQuestionAnswer = async (questionId: string, approved: boolean) => {
    if (!token) return;
    const answer = (questionDrafts[questionId] || '').trim();
    if (approved && !answer) {
      flashNotice('Escreva uma resposta oficial antes de aprovar e publicar a dúvida.');
      return;
    }
    const res = await fetch(`/api/admin/product-questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answer, approved }),
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice(approved ? 'Resposta salva e publicada no produto.' : 'Dúvida atualizada.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/product-questions/${questionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice('Pergunta removida.');
    }
  };

  const handleExportNewsletterCsv = () => {
    const header = 'ID,Email,Consentimento,Data,EnviadoIntegracao\n';
    const rows = subscribers
      .map(
        (s) =>
          `"${s.id}","${s.email}",${s.consentAccepted ? 'Sim' : 'Nao'},"${s.createdAt}",${
            s.integrationSent ? 'Sim' : 'Nao'
          }`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails-ofertas-agroleite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecalculateAll = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/recalculate-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ discountPercent: Number(discountInput) }),
    });
    if (res.ok) {
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice(`Preços recalculados com ${discountInput}% de desconto sobre a referência.`);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !newCatName.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newCatName.trim(),
        parentCategory: newCatParent,
      }),
    });
    if (res.ok) {
      setNewCatName('');
      await loadAdminData(token);
      onStoreDataChanged();
      flashNotice('Categoria adicionada.');
    }
  };

  const handleExportOrdersCsv = () => {
    const header =
      'Pedido,Data,Cliente,CPF,Telefone,CEP,Cidade/Estado,Pagamento,SituacaoPagamento,TransacaoID,Subtotal,DescontoPIX,Total,Itens,Observacoes\n';
    const rows = orders
      .map((o) => {
        const itensText = o.items
          .map((i) => `${i.quantity}x ${i.name} (${i.sku})`)
          .join(' | ')
          .replace(/"/g, '""');
        const obs = (o.customer.addressOrNotes || '').replace(/"/g, '""');
        const payLabel =
          o.customer.paymentMethod === 'pix'
            ? 'PIX'
            : o.customer.paymentMethod === 'credit_card'
            ? 'Cartão de crédito'
            : o.customer.paymentMethod === 'debit_card'
            ? 'Cartão de débito'
            : 'A combinar';
        const statusLabel = o.paymentStatus || 'AWAITING_WHATSAPP';
        const txId = o.paymentTransaction?.providerPaymentId || '';
        return `"${o.id}","${o.createdAt}","${o.customer.name}","${o.customer.cpf || ''}","${o.customer.phone}","${o.customer.cep || ''}","${o.customer.cityState}","${payLabel}","${statusLabel}","${txId}",${(o.subtotal ?? o.total).toFixed(2)},${(o.pixDiscount ?? 0).toFixed(2)},${o.total.toFixed(2)},"${itensText}","${obs}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-agroleite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    if (!settings) return { total: 0, blocked: 0, unconfirmedCost: 0, consult: 0, approved: 0 };
    let blocked = 0;
    let unconfirmedCost = 0;
    let consult = 0;
    let approved = 0;
    for (const p of products) {
      const ev = evaluateProductPrice(p, settings);
      if (ev.isBlockedByMargin) blocked++;
      if (!p.costConfirmed) unconfirmedCost++;
      if (p.priceOnRequest) consult++;
      if (p.priceApproved) approved++;
    }
    return { total: products.length, blocked, unconfirmedCost, consult, approved };
  }, [products, settings]);

  const filteredProducts = useMemo(() => {
    if (!settings) return [];
    const q = searchTerm.trim().toLowerCase();
    return products
      .filter((p) => {
        if (q) {
          const match =
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.subcategory.toLowerCase().includes(q);
          if (!match) return false;
        }
        const ev = evaluateProductPrice(p, settings);
        if (filterMode === 'blocked') return ev.isBlockedByMargin;
        if (filterMode === 'unconfirmed_cost') return !p.costConfirmed;
        if (filterMode === 'approved') return p.priceApproved;
        if (filterMode === 'consult') return p.priceOnRequest;
        return true;
      })
      .slice(0, 100);
  }, [products, settings, searchTerm, filterMode]);

  // Auth Gate Screen
  if (!token) {
    const isUnclaimed = authStatus?.mode === 'unclaimed';
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8E4] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-[#166534] font-semibold text-sm">
              <Lock className="w-4 h-4" />
              <span>Painel Administrativo AGROLEITE</span>
            </div>
            <button
              type="button"
              onClick={onBackToStore}
              className="text-xs font-medium text-[#4A5D52] hover:text-[#14231A] inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à loja</span>
            </button>
          </div>

          {isUnclaimed ? (
            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <h1 className="font-display text-xl font-bold text-[#14231A]">
                  Configuração Inicial do Administrador
                </h1>
                <p className="text-xs text-[#4A5D52] mt-1 leading-relaxed">
                  Nenhuma variável <code className="font-mono-num">ADMIN_PASSCODE</code> foi
                  definida no servidor. Crie agora a senha administrativa inicial (armazenada com
                  hash seguro no servidor).
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {authError}
                </div>
              )}

              <div>
                <label htmlFor="claim-pass" className="block text-xs font-semibold text-[#14231A] mb-1">
                  Nova senha (mínimo 8 caracteres)
                </label>
                <input
                  id="claim-pass"
                  type="password"
                  required
                  minLength={8}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534]"
                />
              </div>

              <div>
                <label htmlFor="claim-pass-confirm" className="block text-xs font-semibold text-[#14231A] mb-1">
                  Confirmar senha
                </label>
                <input
                  id="claim-pass-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold cursor-pointer"
              >
                {authLoading ? 'Salvando...' : 'Definir Senha e Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="font-display text-xl font-bold text-[#14231A]">
                  Acesso Restrito
                </h1>
                <p className="text-xs text-[#4A5D52] mt-1">
                  Informe a senha de administrador para gerenciar catálogo, custos, margens e
                  configurações de WhatsApp.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {authError}
                </div>
              )}

              <div>
                <label htmlFor="admin-pass" className="block text-xs font-semibold text-[#14231A] mb-1">
                  Senha administrativa
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold cursor-pointer"
              >
                {authLoading ? 'Autenticando...' : 'Entrar no Painel'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Admin Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2E8E4]">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#14231A]">
            Gestão Comercial AGROLEITE
          </h1>
          <p className="text-xs text-[#4A5D52] mt-0.5">
            Controle de preços, custos, margem mínima, catálogo e pedidos registrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToStore}
            className="h-10 px-4 rounded-lg border border-[#E2E8E4] bg-white hover:bg-[#F1F5F2] text-xs font-semibold text-[#14231A] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Loja</span>
          </button>
          <button
            type="button"
            onClick={() => setToken(null)}
            className="h-10 px-4 rounded-lg border border-[#E2E8E4] bg-white hover:bg-red-50 text-xs font-semibold text-red-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#F1F5F2] border border-[#166534]/30 text-sm font-medium text-[#166534] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8E4] p-4">
          <div className="text-xs text-[#4A5D52]">Produtos no Catálogo</div>
          <div className="text-2xl font-bold text-[#14231A] font-mono-num mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8E4] p-4">
          <div className="text-xs text-[#4A5D52]">Aguardando Custo Confirmado</div>
          <div className="text-2xl font-bold text-amber-700 font-mono-num mt-1">
            {stats.unconfirmedCost}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8E4] p-4">
          <div className="text-xs text-[#4A5D52]">Bloqueados por Margem/Custo</div>
          <div className="text-2xl font-bold text-red-700 font-mono-num mt-1">
            {stats.blocked}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8E4] p-4">
          <div className="text-xs text-[#4A5D52]">Pedidos Registrados</div>
          <div className="text-2xl font-bold text-[#166534] font-mono-num mt-1">
            {orders.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8E4] pb-3">
        {(
          [
            ['products', 'Produtos & Preços'],
            ['categories', 'Categorias'],
            ['reviews', `Avaliações (${reviews.filter((r) => !r.approved).length} pend.)`],
            ['questions', `Dúvidas (${productQuestions.filter((q) => !q.approved).length} pend.)`],
            ['newsletter', `E-mails (${subscribers.length})`],
            ['settings', 'Configurações, Rodapé & FAQ'],
            ['orders', 'Pedidos & Pendências'],
          ] as Array<[AdminTab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === id
                ? 'bg-[#166534] text-white'
                : 'bg-white border border-[#E2E8E4] text-[#4A5D52] hover:text-[#14231A]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadingState ? (
        <div className="py-12 text-center text-sm text-[#4A5D52]">Carregando dados...</div>
      ) : (
        <>
          {/* TAB 1: PRODUCTS */}
          {tab === 'products' && settings && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#4A5D52] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, código ou categoria..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8E4] bg-white text-sm focus:outline-none focus:border-[#166534]"
                    />
                  </div>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value as ProductFilterMode)}
                    aria-label="Filtrar status de preço"
                    className="h-10 px-3 rounded-lg border border-[#E2E8E4] bg-white text-xs font-medium focus:outline-none focus:border-[#166534]"
                  >
                    <option value="all">Todos ({products.length})</option>
                    <option value="blocked">Bloqueados por margem ({stats.blocked})</option>
                    <option value="unconfirmed_cost">Sem custo confirmado ({stats.unconfirmedCost})</option>
                    <option value="approved">Aprovados ({stats.approved})</option>
                    <option value="consult">Sob consulta ({stats.consult})</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(true);
                    setEditingProduct({
                      id: '',
                      sku: '',
                      name: '',
                      slug: '',
                      category: 'Ordenhadeiras Inox',
                      subcategory: 'Ordenhadeiras Inox',
                      brand: '',
                      model: '',
                      description: '',
                      specs: [],
                      images: [],
                      referencePrice: null,
                      referenceListPrice: null,
                      discountPercent: settings.defaultDiscountPercent,
                      promoPrice: null,
                      costPrice: null,
                      costConfirmed: false,
                      priceApproved: false,
                      available: true,
                      priceOnRequest: false,
                      featured: false,
                    });
                  }}
                  className="h-10 px-4 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Produto</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8E4] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF8] border-b border-[#E2E8E4] text-[#4A5D52]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Código / Produto</th>
                      <th className="py-3 px-3 font-semibold">Categoria</th>
                      <th className="py-3 px-3 font-semibold text-right">Ref.</th>
                      <th className="py-3 px-3 font-semibold text-right">Custo</th>
                      <th className="py-3 px-3 font-semibold text-right">Promo (-%)</th>
                      <th className="py-3 px-3 font-semibold">Status Publicação</th>
                      <th className="py-3 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F2]">
                    {filteredProducts.map((p) => {
                      const ev = evaluateProductPrice(p, settings);
                      return (
                        <tr key={p.id} className="hover:bg-[#F8FAF8]">
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-[#14231A] truncate">{p.name}</div>
                            <div className="font-mono-num text-[11px] text-[#4A5D52]">
                              Cód. {p.sku} · {p.available ? 'Disponível' : 'Indisponível'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[#4A5D52]">
                            <div>{p.category}</div>
                            <div className="text-[11px] opacity-80">{p.subcategory}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num">
                            {p.referencePrice !== null ? formatBRLWithSymbol(p.referencePrice) : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num">
                            {p.costPrice !== null ? formatBRLWithSymbol(p.costPrice) : 'Não inf.'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num font-bold text-[#166534]">
                            {p.promoPrice !== null ? formatBRLWithSymbol(p.promoPrice) : 'Sob consulta'}
                          </td>
                          <td className="py-3 px-3">
                            {ev.isBlockedByMargin ? (
                              <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Bloqueado (Margem)</span>
                              </span>
                            ) : ev.isPendingStrictApproval ? (
                              <span className="text-amber-700 font-medium">Pendente aprovação</span>
                            ) : p.priceOnRequest ? (
                              <span className="text-[#4A5D52]">Sob consulta</span>
                            ) : p.priceApproved ? (
                              <span className="text-[#166534] font-semibold">Aprovado</span>
                            ) : (
                              <span className="text-[#4A5D52]">Sugestão (-{p.discountPercent}%)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNew(false);
                                setEditingProduct({ ...p });
                              }}
                              className="px-2.5 py-1.5 rounded-md border border-[#E2E8E4] hover:border-[#166534] text-[#14231A] font-semibold cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              aria-label={`Remover ${p.name}`}
                              className="p-1.5 rounded-md text-red-700 hover:bg-red-50 cursor-pointer inline-flex align-middle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-[#4A5D52]">
                Exibindo até 100 itens por consulta. Utilize a busca para localizar qualquer um dos {products.length} produtos.
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {tab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form
                onSubmit={handleAddCategory}
                className="bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-4 h-fit"
              >
                <h2 className="font-display text-base font-bold text-[#14231A]">
                  Nova Categoria ou Subcategoria
                </h2>
                <div>
                  <label htmlFor="new-cat-name" className="block text-xs font-semibold mb-1">
                    Nome
                  </label>
                  <input
                    id="new-cat-name"
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Válvulas de Drenagem"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-cat-parent" className="block text-xs font-semibold mb-1">
                    Inserir em
                  </label>
                  <select
                    id="new-cat-parent"
                    value={newCatParent}
                    onChange={(e) => setNewCatParent(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm"
                  >
                    <option value="Peças e Acessórios">Subcategoria de Peças e Acessórios</option>
                    <option value="">Categoria Principal</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
                >
                  Adicionar Categoria
                </button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-[#14231A]">
                  Estrutura de Categorias Ativa
                </h2>
                <div className="space-y-4">
                  {categories.map((c) => {
                    const count = products.filter((p) => p.category === c.name).length;
                    return (
                      <div key={c.id} className="pb-3 border-b border-[#F1F5F2] last:border-0">
                        <div className="flex items-center justify-between text-sm font-semibold text-[#14231A]">
                          <span>{c.name}</span>
                          <span className="font-mono-num text-xs text-[#4A5D52]">
                            {count} produtos
                          </span>
                        </div>
                        {c.subcategories && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#4A5D52]">
                            {c.subcategories.map((sub) => {
                              const subCount = products.filter(
                                (p) => p.subcategory === sub
                              ).length;
                              return (
                                <span key={sub}>
                                  {sub} (<span className="font-mono-num">{subCount}</span>)
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & PRICING RULES */}
          {tab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-xl border border-[#E2E8E4] p-6 max-w-2xl space-y-5"
            >
              <h2 className="font-display text-lg font-bold text-[#14231A]">
                Configurações da Loja e Travas de Margem
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cfg-wa" className="block text-xs font-semibold mb-1">
                    WhatsApp Oficial (somente dígitos, com 55)
                  </label>
                  <input
                    id="cfg-wa"
                    type="text"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label htmlFor="cfg-discount" className="block text-xs font-semibold mb-1">
                    Desconto padrão sobre referência (%)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="cfg-discount"
                      type="number"
                      min={0}
                      max={90}
                      step={0.5}
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm font-mono-num"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculateAll}
                      title="Recalcular todos os preços sugeridos"
                      className="px-3 h-10 rounded-lg border border-[#E2E8E4] bg-white hover:bg-[#F1F5F2] text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Aplicar a Todos</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="cfg-margin" className="block text-xs font-semibold mb-1">
                    Margem mínima sobre custo (%)
                  </label>
                  <input
                    id="cfg-margin"
                    type="number"
                    min={0}
                    max={200}
                    value={minMarginInput}
                    onChange={(e) => setMinMarginInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label htmlFor="cfg-hours" className="block text-xs font-semibold mb-1">
                    Horário de atendimento
                  </label>
                  <input
                    id="cfg-hours"
                    type="text"
                    value={supportHoursInput}
                    onChange={(e) => setSupportHoursInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cfg-city" className="block text-xs font-semibold mb-1">
                    Texto de cobertura / atendimento
                  </label>
                  <input
                    id="cfg-city"
                    type="text"
                    value={supportCityInput}
                    onChange={(e) => setSupportCityInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={strictApproval}
                  onChange={(e) => setStrictApproval(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#166534]"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#14231A]">
                    Modo Estrito: exigir custo confirmado e aprovação manual para publicar preços
                  </div>
                  <div className="text-[#4A5D52] mt-0.5">
                    Quando ativado, produtos sem custo informado e aprovação explícita exibem
                    &quot;Consulte o preço pelo WhatsApp&quot; na loja pública.
                  </div>
                </div>
              </label>

              <div className="pt-4 border-t border-[#E2E8E4] space-y-4">
                <h3 className="font-display text-sm font-bold text-[#14231A]">
                  Formas de Pagamento Exibidas no Rodapé
                </h3>
                <p className="text-xs text-[#4A5D52]">
                  Marque apenas as bandeiras e modalidades efetivamente habilitadas pela loja.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {(
                    [
                      ['pix', 'PIX'],
                      ['visa', 'Visa'],
                      ['mastercard', 'Mastercard'],
                      ['elo', 'Elo'],
                      ['hipercard', 'Hipercard'],
                      ['amex', 'American Express'],
                      ['boleto', 'Boleto'],
                    ] as Array<[keyof AcceptedPaymentMethods, string]>
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={paymentMethodsInput[key]}
                        onChange={(e) =>
                          setPaymentMethodsInput({
                            ...paymentMethodsInput,
                            [key]: e.target.checked,
                          })
                        }
                        className="accent-[#166534]"
                      />
                      <span className="font-medium text-[#14231A]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8E4] space-y-3">
                <h3 className="font-display text-sm font-bold text-[#14231A]">
                  Redes Sociais Oficiais (HTTPS) e Dados Empresariais
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="cfg-ig" className="block text-xs font-semibold mb-1">
                      Instagram (URL https://)
                    </label>
                    <input
                      id="cfg-ig"
                      type="url"
                      value={socialLinksInput.instagramUrl}
                      onChange={(e) =>
                        setSocialLinksInput({ ...socialLinksInput, instagramUrl: e.target.value })
                      }
                      placeholder="https://instagram.com/..."
                      className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="cfg-fb" className="block text-xs font-semibold mb-1">
                      Facebook (URL https://)
                    </label>
                    <input
                      id="cfg-fb"
                      type="url"
                      value={socialLinksInput.facebookUrl}
                      onChange={(e) =>
                        setSocialLinksInput({ ...socialLinksInput, facebookUrl: e.target.value })
                      }
                      placeholder="https://facebook.com/..."
                      className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="cfg-yt" className="block text-xs font-semibold mb-1">
                      YouTube (URL https://)
                    </label>
                    <input
                      id="cfg-yt"
                      type="url"
                      value={socialLinksInput.youtubeUrl}
                      onChange={(e) =>
                        setSocialLinksInput({ ...socialLinksInput, youtubeUrl: e.target.value })
                      }
                      placeholder="https://youtube.com/..."
                      className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cfg-legal" className="block text-xs font-semibold mb-1">
                    Dados empresariais confirmados no rodapé (opcional: Razão Social / CNPJ / Cidade)
                  </label>
                  <input
                    id="cfg-legal"
                    type="text"
                    value={companyLegalInput}
                    onChange={(e) => setCompanyLegalInput(e.target.value)}
                    placeholder="Ex: CNPJ 00.000.000/0001-00 (preencher apenas quando confirmado)"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="cfg-hook" className="block text-xs font-semibold mb-1">
                    Webhook / Integração Externa de E-mails (HTTPS, opcional)
                  </label>
                  <input
                    id="cfg-hook"
                    type="url"
                    value={newsletterWebhookInput}
                    onChange={(e) => setNewsletterWebhookInput(e.target.value)}
                    placeholder="https://... (deixe vazio enquanto não houver integração ativa)"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8E4] space-y-3">
                <h3 className="font-display text-sm font-bold text-[#14231A]">
                  Perguntas Frequentes Editáveis (FAQ)
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {faqItemsInput.map((faq, idx) => (
                    <div
                      key={faq.id}
                      className="p-3 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] space-y-2 text-xs"
                    >
                      <div className="font-semibold text-[#166534]">{faq.topic}</div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...faqItemsInput];
                          next[idx] = { ...faq, question: e.target.value };
                          setFaqItemsInput(next);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8E4] bg-white font-semibold"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...faqItemsInput];
                          next[idx] = { ...faq, answer: e.target.value };
                          setFaqItemsInput(next);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#E2E8E4] bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="h-11 px-6 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </form>
          )}

          {/* TAB: REVIEWS MODERATION */}
          {tab === 'reviews' && (
            <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#14231A]">
                  Moderação de Avaliações de Clientes ({reviews.length})
                </h2>
                <p className="text-xs text-[#4A5D52] mt-0.5">
                  Apenas avaliações aprovadas aqui aparecem na seção &quot;Quem já comprou e recomenda&quot;.
                </p>
              </div>
              {reviews.length === 0 ? (
                <p className="text-xs text-[#4A5D52]">Nenhuma avaliação enviada ainda.</p>
              ) : (
                <div className="divide-y divide-[#F1F5F2] text-xs">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#14231A]">
                            {rev.rating}★ · {rev.authorName}
                          </span>
                          {rev.cityState && <span className="text-[#4A5D52]">({rev.cityState})</span>}
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              rev.approved
                                ? 'bg-[#F1F5F2] text-[#166534]'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {rev.approved ? 'Publicada' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-[#14231A]">“{rev.comment}”</p>
                        <div className="text-[11px] text-[#4A5D52]">
                          Autoriza nome: {rev.authorizeName ? 'Sim' : 'Não'} · Autoriza cidade:{' '}
                          {rev.authorizeLocation ? 'Sim' : 'Não'} ·{' '}
                          {new Date(rev.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReviewApproval(rev.id, !rev.approved)}
                          className="h-9 px-3 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white font-semibold cursor-pointer"
                        >
                          {rev.approved ? 'Ocultar' : 'Aprovar e Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          aria-label="Excluir avaliação"
                          className="h-9 px-2.5 rounded-lg border border-[#E2E8E4] text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PRODUCT QUESTIONS MODERATION */}
          {tab === 'questions' && (
            <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#14231A]">
                  Perguntas sobre Produtos ({productQuestions.length})
                </h2>
                <p className="text-xs text-[#4A5D52] mt-0.5">
                  Responda e aprove cada dúvida antes de exibi-la na página do produto.
                </p>
              </div>
              {productQuestions.length === 0 ? (
                <p className="text-xs text-[#4A5D52]">Nenhuma dúvida enviada ainda.</p>
              ) : (
                <div className="space-y-4 text-xs">
                  {productQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#14231A]">{q.productName}</span>{' '}
                          <span className="font-mono-num text-[#4A5D52]">[{q.productSku}]</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            q.approved
                              ? 'bg-[#F1F5F2] text-[#166534]'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {q.approved ? 'Publicada' : 'Aguardando aprovação'}
                        </span>
                      </div>
                      <div>
                        <strong>Cliente ({q.customerName}):</strong> {q.question}
                      </div>
                      <textarea
                        rows={2}
                        value={questionDrafts[q.id] ?? ''}
                        onChange={(e) =>
                          setQuestionDrafts({ ...questionDrafts, [q.id]: e.target.value })
                        }
                        placeholder="Escreva a resposta oficial verificada..."
                        className="w-full p-2.5 rounded-lg border border-[#E2E8E4] bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveQuestionAnswer(q.id, true)}
                          className="h-9 px-3 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white font-semibold cursor-pointer"
                        >
                          Salvar e Publicar Resposta
                        </button>
                        {q.approved && (
                          <button
                            type="button"
                            onClick={() => handleSaveQuestionAnswer(q.id, false)}
                            className="h-9 px-3 rounded-lg border border-[#E2E8E4] bg-white font-semibold cursor-pointer"
                          >
                            Ocultar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          aria-label="Excluir pergunta"
                          className="h-9 px-2.5 rounded-lg border border-[#E2E8E4] bg-white text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: NEWSLETTER SUBSCRIBERS */}
          {tab === 'newsletter' && (
            <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-[#14231A]">
                    Cadastros de E-mail para Ofertas ({subscribers.length})
                  </h2>
                  <p className="text-xs text-[#4A5D52] mt-0.5">
                    Lista real de e-mails com consentimento confirmado na loja.
                  </p>
                </div>
                {subscribers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportNewsletterCsv}
                    className="h-9 px-3.5 rounded-lg border border-[#E2E8E4] hover:border-[#166534] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                )}
              </div>
              {subscribers.length === 0 ? (
                <p className="text-xs text-[#4A5D52]">Nenhum e-mail cadastrado ainda.</p>
              ) : (
                <div className="divide-y divide-[#F1F5F2] text-xs">
                  {subscribers.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-[#14231A]">{s.email}</span>
                        <span className="text-[#4A5D52] ml-2">
                          · {new Date(s.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[#166534]">
                        {s.integrationSent ? 'Enviado à integração' : 'Salvo na loja'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS & PENDENCIES */}
          {tab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-[#14231A]">
                    Pedidos Iniciados pelo WhatsApp ({orders.length})
                  </h2>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportOrdersCsv}
                      className="h-9 px-3.5 rounded-lg border border-[#E2E8E4] hover:border-[#166534] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span>
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-[#4A5D52]">
                    Nenhum pedido registrado ainda nesta sessão/servidor.
                  </p>
                ) : (
                  <div className="divide-y divide-[#F1F5F2] text-xs">
                    {orders.map((o) => {
                      const methodLabel =
                        o.customer.paymentMethod === 'pix'
                          ? 'PIX'
                          : o.customer.paymentMethod === 'credit_card'
                          ? 'Cartão de crédito'
                          : o.customer.paymentMethod === 'debit_card'
                          ? 'Cartão de débito'
                          : 'A combinar';
                      return (
                        <div
                          key={o.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-[#14231A]">
                              <span>
                                {o.id} · {o.customer.name} ({o.customer.cityState})
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#F1F5F2] text-[#166534] text-[11px]">
                                {methodLabel}
                              </span>
                              {o.paymentStatus && o.paymentStatus !== 'AWAITING_WHATSAPP' && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    o.paymentStatus === 'PAGO'
                                      ? 'bg-[#DCFCE7] text-[#166534]'
                                      : o.paymentStatus === 'PAGAMENTO NÃO APROVADO'
                                      ? 'bg-red-50 text-red-800'
                                      : 'bg-amber-50 text-amber-900'
                                  }`}
                                >
                                  {o.paymentStatus}
                                </span>
                              )}
                            </div>
                            <div className="text-[#4A5D52]">
                              {o.customer.cpf ? `CPF: ${o.customer.cpf} · ` : ''}
                              Tel: {o.customer.phone}
                              {o.customer.cep ? ` · CEP: ${o.customer.cep}` : ''} · {o.items.length}{' '}
                              item(ns) · {new Date(o.createdAt).toLocaleString('pt-BR')}
                              {o.paymentTransaction?.providerPaymentId
                                ? ` · MP #${o.paymentTransaction.providerPaymentId}`
                                : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono-num font-bold text-[#166534] text-sm">
                              {formatBRLWithSymbol(o.total)}
                            </div>
                            {o.pixDiscount > 0 && (
                              <div className="text-[11px] font-mono-num text-[#4A5D52]">
                                Desc. PIX: -{formatBRLWithSymbol(o.pixDiscount)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 space-y-3">
                <h2 className="font-display text-base font-bold text-[#14231A]">
                  Pendências de Preço e Catálogo da Referência
                </h2>
                <p className="text-xs text-[#4A5D52]">
                  Itens abaixo estavam sem preço público ou indisponíveis na referência no momento
                  da importação. Nenhum valor foi inventado; eles exibem &quot;Consulte o preço pelo
                  WhatsApp&quot; até que você informe custo e preço promocional.
                </p>
                <ul className="divide-y divide-[#F1F5F2] text-xs">
                  {products
                    .filter((p) => p.priceOnRequest)
                    .map((p) => (
                      <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                        <span>
                          <span className="font-mono-num text-[#4A5D52]">[{p.sku}]</span>{' '}
                          <span className="font-medium text-[#14231A]">{p.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNew(false);
                            setEditingProduct({ ...p });
                          }}
                          className="text-[#166534] font-semibold hover:underline shrink-0 cursor-pointer"
                        >
                          Definir preço
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* PRODUCT EDIT MODAL */}
      {editingProduct && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#14231A]">
                {isCreatingNew ? 'Novo Produto' : `Editar Produto · Cód. ${editingProduct.sku}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-xs font-semibold text-[#4A5D52] hover:text-[#14231A] cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Nome do produto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Categoria *</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Subcategoria</label>
                  <input
                    type="text"
                    value={editingProduct.subcategory}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, subcategory: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Marca</label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, brand: e.target.value || null })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Preço de referência (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={editingProduct.referencePrice ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      const effectiveDiscount =
                        val !== null && val >= 1000 ? editingProduct.discountPercent || settings.defaultDiscountPercent : 0;
                      setEditingProduct({
                        ...editingProduct,
                        referencePrice: val,
                        discountPercent: effectiveDiscount,
                        promoPrice: calculateSuggestedPrice(val, effectiveDiscount),
                      });
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Desconto (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={90}
                    value={editingProduct.discountPercent}
                    onChange={(e) => {
                      const d = Number(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        discountPercent: d,
                        promoPrice: calculateSuggestedPrice(editingProduct.referencePrice, d),
                      });
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Custo de aquisição (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Informe o custo"
                    value={editingProduct.costPrice ?? ''}
                    onChange={(e) => {
                      const c = e.target.value ? Number(e.target.value) : null;
                      setEditingProduct({
                        ...editingProduct,
                        costPrice: c,
                        costConfirmed: c !== null && c > 0,
                      });
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Preço promocional final (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={editingProduct.promoPrice ?? ''}
                    onChange={(e) => {
                      const p = e.target.value ? Number(e.target.value) : null;
                      setEditingProduct({
                        ...editingProduct,
                        promoPrice: p,
                        priceOnRequest: p === null,
                      });
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num font-bold text-[#166534]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">URL da imagem principal</label>
                  <input
                    type="url"
                    value={editingProduct.images[0] || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        images: e.target.value ? [e.target.value] : [],
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Descrição técnica</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8]"
                  />
                </div>
              </div>

              {/* Live Margin Evaluation */}
              {(() => {
                const liveEval = evaluateProductPrice(editingProduct, settings);
                return (
                  <div
                    className={`p-3.5 rounded-xl border ${
                      liveEval.isBlockedByMargin
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-[#F8FAF8] border-[#E2E8E4] text-[#14231A]'
                    }`}
                  >
                    <div className="font-semibold">
                      Diagnóstico de Margem ({settings.minMarginPercent}% mínima): {liveEval.statusLabel}
                    </div>
                    {liveEval.marginPercent !== null && (
                      <div className="mt-1 font-mono-num">
                        Margem estimada: {liveEval.marginPercent.toFixed(1)}% · Piso permitido:{' '}
                        {liveEval.minAllowedPrice !== null
                          ? formatBRLWithSymbol(liveEval.minAllowedPrice)
                          : '—'}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.available}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, available: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#166534]"
                  />
                  <span>Disponível em estoque</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.priceApproved}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, priceApproved: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#166534]"
                  />
                  <span>Preço aprovado para publicação</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8E4] bg-[#F8FAF8] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="h-10 px-4 rounded-lg border border-[#E2E8E4] bg-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="h-10 px-5 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
              >
                {savingProduct ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
