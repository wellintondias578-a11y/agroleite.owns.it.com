import type {
  CartItem,
  CustomerCheckoutData,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionInfo,
  Product,
} from '../types/store';
import { calculateCartTotals, formatBRL } from './pricing';

export const DEFAULT_WHATSAPP_NUMBER = '5511914157359';
export const DEFAULT_WHATSAPP_DISPLAY = '+55 11 91415-7359';

export function sanitizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanNumber = sanitizeWhatsAppNumber(phoneNumber);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'pix':
      return 'PIX (5% de desconto adicional nos itens elegíveis >= R$ 1.000,00)';
    case 'credit_card':
      return 'Cartão de crédito (condições a combinar no WhatsApp)';
    case 'debit_card':
      return 'Cartão de débito (condições a combinar no WhatsApp)';
    default:
      return 'A combinar no atendimento (Boleto / Transferência / Outros)';
  }
}

export function formatPaymentStatusLabel(status?: PaymentStatus): string {
  if (!status || status === 'AWAITING_WHATSAPP') {
    return 'Aguardando confirmação no WhatsApp';
  }
  return status;
}

export function buildWhatsAppOrderMessage(
  customer: CustomerCheckoutData,
  items: CartItem[],
  _total?: number,
  meta?: {
    orderId?: string;
    paymentStatus?: PaymentStatus;
    paymentTransaction?: PaymentTransactionInfo | null;
  }
): string {
  const summary = calculateCartTotals(items, customer.paymentMethod || 'pix');

  const itemBlocks = items
    .map((item) => {
      const subtotal = item.unitPrice * item.quantity;
      const lines = [
        `${item.name} (Cód: ${item.sku})`,
        `Quantidade: ${item.quantity}`,
        `Valor unitário: R$ ${formatBRL(item.unitPrice)}${
          item.eligibleForPromo40 ? ' (40% OFF aplicado)' : ''
        }`,
        `Subtotal: R$ ${formatBRL(subtotal)}`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');

  const observations = customer.addressOrNotes.trim() || 'Sem observações adicionais.';
  const paymentLabel = formatPaymentMethodLabel(customer.paymentMethod || 'pix');
  const statusLabel = formatPaymentStatusLabel(meta?.paymentStatus);

  const discountLines: string[] = [
    `SUBTOTAL DOS PRODUTOS: R$ ${formatBRL(summary.subtotal)}`,
  ];

  if (summary.promo40Savings > 0) {
    discountLines.push(
      `Economia já aplicada (40% OFF itens >= R$ 1.000): R$ ${formatBRL(summary.promo40Savings)}`
    );
  }
  if (summary.pixDiscountApplied > 0) {
    discountLines.push(
      `Desconto adicional PIX (5% nos itens elegíveis): - R$ ${formatBRL(summary.pixDiscountApplied)}`
    );
  }
  discountLines.push(`TOTAL DOS PRODUTOS: R$ ${formatBRL(summary.finalTotal)}`);
  if (summary.totalSavingsApplied > 0) {
    discountLines.push(
      `ECONOMIA TOTAL DO CLIENTE: R$ ${formatBRL(summary.totalSavingsApplied)}`
    );
  }

  const headerLines = ['Olá! Gostaria de realizar um pedido pela loja AGROLEITE.'];
  if (meta?.orderId) {
    headerLines.push(`Identificador do Pedido: ${meta.orderId}`);
  }

  const customerLines = [
    'DADOS DO CLIENTE E ENTREGA:',
    '',
    `Nome: ${customer.name.trim()}`,
    `CPF: ${customer.cpf.trim()}`,
    `Telefone / WhatsApp: ${customer.phone.trim()}`,
    `CEP para frete: ${customer.cep.trim()}`,
    `Cidade/Estado: ${customer.cityState.trim()}`,
    `Endereço / Voltagem / Observações: ${observations}`,
    `Forma de Pagamento: ${paymentLabel}`,
    `Situação do Pedido: ${statusLabel}`,
  ];

  if (meta?.paymentTransaction?.providerPaymentId) {
    const tx = meta.paymentTransaction;
    const brandPart = tx.paymentMethodId ? ` · Bandeira: ${tx.paymentMethodId.toUpperCase()}` : '';
    const last4Part = tx.cardLastFourDigits ? ` (final ${tx.cardLastFourDigits})` : '';
    const instPart = tx.installments > 1 ? ` · ${tx.installments}x` : ' · À vista';
    customerLines.push(
      `Transação Mercado Pago: #${tx.providerPaymentId}${brandPart}${last4Part}${instPart}`
    );
  }

  return [
    ...headerLines,
    '',
    ...customerLines,
    '',
    'ITENS DO PEDIDO:',
    '',
    itemBlocks,
    '',
    '--------------------------------',
    '',
    ...discountLines,
    '',
    'Aguardo a conferência de disponibilidade, cálculo do frete pelo CEP e orientações para pagamento.',
  ].join('\n');
}

export function buildWhatsAppProductMessage(
  product: Product,
  quantity: number,
  displayPrice: number | null,
  pixPrice: number | null = null
): string {
  const modelMeta: string[] = [];
  if (product.brand) modelMeta.push(`Marca: ${product.brand}`);
  if (product.model) modelMeta.push(`Modelo: ${product.model}`);

  if (displayPrice === null) {
    return [
      'Olá! Gostaria de consultar o preço e a disponibilidade pela loja AGROLEITE.',
      '',
      `Produto: ${product.name}`,
      `Código: ${product.sku}`,
      ...(modelMeta.length > 0 ? [modelMeta.join(' · ')] : []),
      `Quantidade desejada: ${quantity}`,
      '',
      'Aguardo atendimento técnico!',
    ].join('\n');
  }

  const subtotal = displayPrice * quantity;
  const lines = [
    'Olá! Tenho interesse neste produto da loja AGROLEITE:',
    '',
    `Produto: ${product.name}`,
    `Código: ${product.sku}`,
    ...(modelMeta.length > 0 ? [modelMeta.join(' · ')] : []),
    `Quantidade: ${quantity}`,
    `Valor unitário: R$ ${formatBRL(displayPrice)}`,
    `Subtotal: R$ ${formatBRL(subtotal)}`,
  ];

  if (pixPrice !== null && pixPrice < displayPrice) {
    lines.push(
      `Valor no PIX (+5% adicional em item elegível): R$ ${formatBRL(pixPrice * quantity)}`
    );
  }

  lines.push(
    '',
    'Gostaria de confirmar a disponibilidade, compatibilidade/voltagem, valor do frete e envio.'
  );

  return lines.join('\n');
}

export function buildWhatsAppSpecialistHelpMessage(product: Product): string {
  return `Olá! Estou analisando o item "${product.name}" (Cód. ${product.sku}) na AGROLEITE e gostaria de orientação da equipe sobre modelo, compatibilidade ou voltagem.`;
}

export function buildWhatsAppShareProductUrl(
  product: Product,
  displayPrice: number | null,
  pixPrice: number | null,
  productUrl: string
): string {
  const lines = [
    `Confira na AGROLEITE: ${product.name} (Cód. ${product.sku})`,
    `Categoria: ${product.category}${
      product.subcategory && product.subcategory !== product.category
        ? ` · ${product.subcategory}`
        : ''
    }`,
  ];

  if (displayPrice !== null) {
    lines.push(`Preço atual: R$ ${formatBRL(displayPrice)}`);
    if (pixPrice !== null && pixPrice < displayPrice) {
      lines.push(`No PIX (+5% adicional): R$ ${formatBRL(pixPrice)}`);
    }
  } else {
    lines.push('Preço sob consulta pelo WhatsApp');
  }

  lines.push(`Veja os detalhes: ${productUrl}`);

  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildWhatsAppSupportMessage(): string {
  return 'Olá! Gostaria de atendimento técnico sobre equipamentos e peças da loja AGROLEITE.';
}
