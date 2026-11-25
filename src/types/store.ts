export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  brand: string | null;
  model: string | null;
  description: string;
  specs: ProductSpec[];
  images: string[];
  referencePrice: number | null;
  referenceListPrice: number | null;
  discountPercent: number;
  promoPrice: number | null;
  costPrice: number | null;
  costConfirmed: boolean;
  priceApproved: boolean;
  available: boolean;
  priceOnRequest: boolean;
  featured: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  isMain: boolean;
  parentCategory?: string;
  subcategories?: string[];
  description?: string;
}

export interface AcceptedPaymentMethods {
  pix: boolean;
  visa: boolean;
  mastercard: boolean;
  elo: boolean;
  hipercard: boolean;
  amex: boolean;
  boleto: boolean;
}

export interface SocialLinks {
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  defaultDiscountPercent: number;
  minMarginPercent: number;
  requireCostApprovalToPublish: boolean;
  supportHours: string;
  supportCityState: string;
  acceptedPaymentMethods?: AcceptedPaymentMethods;
  socialLinks?: SocialLinks;
  newsletterWebhookUrl?: string;
  newsletterIntegrationConfigured?: boolean;
  companyLegalInfo?: string;
  faqItems?: FaqItem[];
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  image: string | null;
  unitPrice: number;
  originalPrice: number | null;
  eligibleForPromo40: boolean;
  quantity: number;
  category: string;
}

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'standard';

export type PaymentStatus =
  | 'AWAITING_WHATSAPP'
  | 'AGUARDANDO PAGAMENTO'
  | 'PAGO'
  | 'PAGAMENTO NÃO APROVADO';

export interface PaymentTransactionInfo {
  provider: 'mercadopago';
  environment: 'sandbox' | 'production';
  providerPaymentId: string;
  paymentTypeId: string;
  paymentMethodId: string;
  installments: number;
  cardLastFourDigits?: string;
  providerStatus: string;
  providerStatusDetail: string;
  statusMessagePt: string;
  transactionAmount: number;
  updatedAt: string;
}

export interface CustomerCheckoutData {
  name: string;
  cpf: string;
  phone: string;
  cep: string;
  cityState: string;
  addressOrNotes: string;
  email?: string;
  paymentMethod: PaymentMethod;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  customer: CustomerCheckoutData;
  items: CartItem[];
  subtotal: number;
  pixDiscount: number;
  promo40Savings: number;
  totalSavings: number;
  total: number;
  whatsappUrl: string;
  paymentStatus?: PaymentStatus;
  paymentTransaction?: PaymentTransactionInfo | null;
}

export interface CustomerReview {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  authorizeName: boolean;
  cityState: string;
  authorizeLocation: boolean;
  productName?: string;
  createdAt: string;
  approved: boolean;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  customerName: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
  approved: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  consentAccepted: boolean;
  createdAt: string;
  integrationSent: boolean;
}

export interface PriceEvaluation {
  displayPrice: number | null;
  originalPrice: number | null;
  eligibleForPromo40: boolean;
  pixPrice: number | null;
  pixSavings: number;
  isConsultOnly: boolean;
  isBlockedByMargin: boolean;
  isPendingStrictApproval: boolean;
  marginPercent: number | null;
  minAllowedPrice: number | null;
  statusLabel: string;
}

export interface AdminAuthStatus {
  mode: 'env' | 'claimed' | 'unclaimed';
  hasConfiguredSecret: boolean;
  claimed: boolean;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc';
