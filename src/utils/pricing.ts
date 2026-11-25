import type {
  CartItem,
  PaymentMethod,
  PriceEvaluation,
  Product,
  StoreSettings,
} from '../types/store';

export const PROMO_40_THRESHOLD_BRL = 1000;
export const PROMO_40_DISCOUNT_PERCENT = 40;
export const PIX_ADDITIONAL_DISCOUNT_PERCENT = 5;

export function roundPriceBRL(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100) / 100;
}

export function calculateSuggestedPrice(
  referencePrice: number | null,
  discountPercent = PROMO_40_DISCOUNT_PERCENT
): number | null {
  if (referencePrice === null || !Number.isFinite(referencePrice) || referencePrice <= 0) {
    return null;
  }
  // Products strictly below R$ 1.000,00 keep exact original price with no promotional discount
  if (referencePrice < PROMO_40_THRESHOLD_BRL) {
    return roundPriceBRL(referencePrice);
  }
  const clampedDiscount = Math.max(0, Math.min(90, discountPercent));
  const raw = referencePrice * (1 - clampedDiscount / 100);
  return roundPriceBRL(raw);
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBRLWithSymbol(value: number): string {
  return `R$ ${formatBRL(value)}`;
}

export function evaluateProductPrice(
  product: Product,
  settings: StoreSettings
): PriceEvaluation {
  const originalPrice =
    product.referencePrice !== null &&
    Number.isFinite(product.referencePrice) &&
    product.referencePrice > 0
      ? roundPriceBRL(product.referencePrice)
      : null;

  const eligibleForPromo40 =
    originalPrice !== null && originalPrice >= PROMO_40_THRESHOLD_BRL;

  let effectivePromo: number | null = null;
  if (originalPrice !== null) {
    if (eligibleForPromo40) {
      const candidate =
        product.promoPrice !== null &&
        Number.isFinite(product.promoPrice) &&
        product.promoPrice > 0
          ? roundPriceBRL(product.promoPrice)
          : calculateSuggestedPrice(originalPrice, PROMO_40_DISCOUNT_PERCENT);
      effectivePromo = candidate;
    } else {
      // Strictly preserve original price for items below R$ 1.000,00
      effectivePromo = originalPrice;
    }
  } else if (
    !product.priceOnRequest &&
    product.promoPrice !== null &&
    Number.isFinite(product.promoPrice) &&
    product.promoPrice > 0
  ) {
    effectivePromo = roundPriceBRL(product.promoPrice);
  }

  if (product.priceOnRequest || effectivePromo === null || effectivePromo <= 0) {
    return {
      displayPrice: null,
      originalPrice,
      eligibleForPromo40: false,
      pixPrice: null,
      pixSavings: 0,
      isConsultOnly: true,
      isBlockedByMargin: false,
      isPendingStrictApproval: false,
      marginPercent: null,
      minAllowedPrice: null,
      statusLabel: 'Consulte o preço pelo WhatsApp',
    };
  }

  let marginPercent: number | null = null;
  let minAllowedPrice: number | null = null;
  let isBlockedByMargin = false;

  if (product.costPrice !== null && Number.isFinite(product.costPrice) && product.costPrice > 0) {
    marginPercent = ((effectivePromo - product.costPrice) / effectivePromo) * 100;
    const minMargin = Math.max(0, settings.minMarginPercent);
    minAllowedPrice = roundPriceBRL(product.costPrice * (1 + minMargin / 100));
    if (effectivePromo < product.costPrice || effectivePromo < minAllowedPrice) {
      isBlockedByMargin = true;
    }
  }

  const isPendingStrictApproval =
    settings.requireCostApprovalToPublish &&
    (!product.costConfirmed || !product.priceApproved);

  if (isBlockedByMargin) {
    return {
      displayPrice: null,
      originalPrice,
      eligibleForPromo40,
      pixPrice: null,
      pixSavings: 0,
      isConsultOnly: true,
      isBlockedByMargin: true,
      isPendingStrictApproval,
      marginPercent,
      minAllowedPrice,
      statusLabel: 'Bloqueado (abaixo do custo / margem mínima)',
    };
  }

  if (isPendingStrictApproval) {
    return {
      displayPrice: null,
      originalPrice,
      eligibleForPromo40,
      pixPrice: null,
      pixSavings: 0,
      isConsultOnly: true,
      isBlockedByMargin: false,
      isPendingStrictApproval: true,
      marginPercent,
      minAllowedPrice,
      statusLabel: 'Aguardando confirmação de custo e aprovação',
    };
  }

  // Additional 5% PIX discount applies ONLY to eligible promo items (>= R$ 1.000,00)
  const pixPrice = eligibleForPromo40
    ? roundPriceBRL(effectivePromo * (1 - PIX_ADDITIONAL_DISCOUNT_PERCENT / 100))
    : null;
  const pixSavings =
    eligibleForPromo40 && pixPrice !== null
      ? roundPriceBRL(effectivePromo - pixPrice)
      : 0;

  return {
    displayPrice: effectivePromo,
    originalPrice,
    eligibleForPromo40,
    pixPrice,
    pixSavings,
    isConsultOnly: false,
    isBlockedByMargin: false,
    isPendingStrictApproval: false,
    marginPercent,
    minAllowedPrice,
    statusLabel: product.priceApproved
      ? 'Publicado e aprovado'
      : eligibleForPromo40
      ? 'Promoção 40% OFF (≥ R$ 1.000)'
      : 'Preço original (< R$ 1.000)',
  };
}

export interface CartTotalsSummary {
  subtotal: number;
  eligibleSubtotal: number;
  ineligibleSubtotal: number;
  promo40Savings: number;
  pixDiscountPotential: number;
  pixDiscountApplied: number;
  totalSavingsApplied: number;
  finalTotal: number;
}

export function calculateCartTotals(
  items: CartItem[],
  paymentMethod: PaymentMethod = 'pix'
): CartTotalsSummary {
  let subtotal = 0;
  let eligibleSubtotal = 0;
  let ineligibleSubtotal = 0;
  let promo40Savings = 0;
  let pixDiscountPotential = 0;

  for (const item of items) {
    const lineTotal = roundPriceBRL(item.unitPrice * item.quantity);
    subtotal += lineTotal;

    const isEligible = Boolean(
      item.eligibleForPromo40 ||
        (item.originalPrice !== null &&
          item.originalPrice !== undefined &&
          item.originalPrice >= PROMO_40_THRESHOLD_BRL)
    );

    if (isEligible) {
      eligibleSubtotal += lineTotal;
      if (item.originalPrice && item.originalPrice > item.unitPrice) {
        promo40Savings += roundPriceBRL((item.originalPrice - item.unitPrice) * item.quantity);
      }
      pixDiscountPotential += roundPriceBRL(
        lineTotal * (PIX_ADDITIONAL_DISCOUNT_PERCENT / 100)
      );
    } else {
      ineligibleSubtotal += lineTotal;
    }
  }

  subtotal = roundPriceBRL(subtotal);
  eligibleSubtotal = roundPriceBRL(eligibleSubtotal);
  ineligibleSubtotal = roundPriceBRL(ineligibleSubtotal);
  promo40Savings = roundPriceBRL(promo40Savings);
  pixDiscountPotential = roundPriceBRL(pixDiscountPotential);

  const pixDiscountApplied = paymentMethod === 'pix' ? pixDiscountPotential : 0;
  const totalSavingsApplied = roundPriceBRL(promo40Savings + pixDiscountApplied);
  const finalTotal = roundPriceBRL(subtotal - pixDiscountApplied);

  return {
    subtotal,
    eligibleSubtotal,
    ineligibleSubtotal,
    promo40Savings,
    pixDiscountPotential,
    pixDiscountApplied,
    totalSavingsApplied,
    finalTotal,
  };
}
