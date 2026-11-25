import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  MessageCircle,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  CartItem,
  CustomerCheckoutData,
  OrderRecord,
  PaymentMethod,
  StoreSettings,
} from '../types/store';
import { calculateCartTotals, formatBRLWithSymbol } from '../utils/pricing';
import {
  formatCEP,
  formatCPF,
  formatPhoneBR,
  isValidCEP,
  isValidCPF,
} from '../utils/validators';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  formatPaymentMethodLabel,
} from '../utils/whatsapp';

interface WhatsAppCheckoutModalProps {
  open: boolean;
  items: CartItem[];
  settings: StoreSettings;
  onClose: () => void;
  onOrderCompleted: (clearCart: boolean) => void;
  onOrderRecorded?: (order: OrderRecord) => void;
}

export function WhatsAppCheckoutModal({
  open,
  items,
  settings,
  onClose,
  onOrderCompleted,
  onOrderRecorded,
}: WhatsAppCheckoutModalProps) {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [cityState, setCityState] = useState('');
  const [addressOrNotes, setAddressOrNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [preparedOrder, setPreparedOrder] = useState<{
    orderId: string;
    message: string;
    whatsappUrl: string;
    customer: CustomerCheckoutData;
    finalTotal: number;
    totalSavings: number;
    itemCount: number;
  } | null>(null);

  if (!open) return null;

  const summary = calculateCartTotals(items, paymentMethod);

  const validateBuyerFields = (): string | null => {
    if (items.length === 0) {
      return 'Seu carrinho está vazio. Adicione produtos antes de finalizar.';
    }
    if (name.trim().length < 3) {
      return 'Informe o nome completo do comprador.';
    }
    if (!isValidCPF(cpf)) {
      return 'Informe um CPF válido (11 dígitos).';
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return 'Informe um telefone de contato válido com DDD.';
    }
    if (!isValidCEP(cep)) {
      return 'Informe um CEP válido com 8 dígitos.';
    }
    if (cityState.trim().length < 3) {
      return 'Informe sua cidade e estado (ex: Uberaba / MG).';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateBuyerFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    const customer: CustomerCheckoutData = {
      name: name.trim(),
      cpf: cpf.trim(),
      phone: phone.trim(),
      cep: cep.trim(),
      cityState: cityState.trim(),
      addressOrNotes: addressOrNotes.trim(),
      paymentMethod,
    };

    setSubmitting(true);
    let orderId = `PED-${Date.now().toString(36).toUpperCase()}`;
    let recordedOrder: OrderRecord | null = null;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        setError(errData.error || 'Não foi possível registrar o pedido.');
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { order?: OrderRecord };
      if (data.order?.id) {
        orderId = data.order.id;
        recordedOrder = data.order;
        if (onOrderRecorded) onOrderRecorded(data.order);
      }
    } catch {
      // Fallback gracefully to local WhatsApp message generation if offline
    } finally {
      setSubmitting(false);
    }

    const message = buildWhatsAppOrderMessage(customer, items, summary.finalTotal, {
      orderId,
      paymentStatus: recordedOrder?.paymentStatus || 'AWAITING_WHATSAPP',
    });
    const whatsappUrl =
      recordedOrder?.whatsappUrl || buildWhatsAppUrl(settings.whatsappNumber, message);

    setPreparedOrder({
      orderId,
      message,
      whatsappUrl,
      customer,
      finalTotal: recordedOrder?.total ?? summary.finalTotal,
      totalSavings: recordedOrder?.totalSavings ?? summary.totalSavingsApplied,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
    });
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard denial
    }
  };

  const handleResetAndClose = () => {
    setPreparedOrder(null);
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar Pedido AGROLEITE"
    >
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#14231A]">
              {preparedOrder ? 'Pedido Pronto para Envio' : 'Finalizar Pedido'}
            </h2>
            <p className="text-xs text-[#4A5D52]">
              WhatsApp oficial AGROLEITE: {settings.whatsappDisplay}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Fechar checkout"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!preparedOrder ? (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-800"
                >
                  {error}
                </div>
              )}

              {/* 1. Buyer Identification */}
              <div className="rounded-xl border border-[#E2E8E4] bg-white p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14231A] uppercase tracking-wide">
                  <UserCheck className="w-4 h-4 text-[#166534]" />
                  <span>1. Dados do Comprador</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-name" className="block text-xs font-semibold text-[#14231A] mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-cpf" className="block text-xs font-semibold text-[#14231A] mb-1.5">
                      CPF *
                    </label>
                    <input
                      id="checkout-cpf"
                      type="text"
                      inputMode="numeric"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm font-mono-num focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-semibold text-[#14231A] mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                      placeholder="(11) 99999-9999"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm font-mono-num focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Details */}
              <div className="rounded-xl border border-[#E2E8E4] bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#14231A] uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-[#166534]" />
                    <span>2. Dados de Entrega</span>
                  </div>
                  <span className="text-[11px] text-[#4A5D52] inline-flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#166534]" />
                    Frete calculado pelo CEP no atendimento
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="checkout-cep" className="block text-xs font-semibold text-[#14231A] mb-1.5">
                      CEP *
                    </label>
                    <input
                      id="checkout-cep"
                      type="text"
                      inputMode="numeric"
                      required
                      value={cep}
                      onChange={(e) => setCep(formatCEP(e.target.value))}
                      placeholder="00000-000"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm font-mono-num focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-city" className="block text-xs font-semibold text-[#14231A] mb-1.5">
                      Cidade e Estado *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      value={cityState}
                      onChange={(e) => setCityState(e.target.value)}
                      placeholder="Ex: Castro / PR"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-notes" className="block text-xs font-semibold text-[#14231A] mb-1.5">
                      Endereço completo, voltagem (110V/220V) ou observação de entrega (opcional)
                    </label>
                    <textarea
                      id="checkout-notes"
                      rows={2}
                      value={addressOrNotes}
                      onChange={(e) => setAddressOrNotes(e.target.value)}
                      placeholder="Informe endereço completo, número, ponto de referência, voltagem desejada (110V/220V) ou observações"
                      className="w-full p-3.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-[#14231A]">
                  Forma de Pagamento
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      paymentMethod === 'pix'
                        ? 'border-[#166534] bg-[#F1F5F2]'
                        : 'border-[#E2E8E4] bg-white hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={paymentMethod === 'pix'}
                      onChange={() => setPaymentMethod('pix')}
                      className="mt-0.5 accent-[#166534]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-[#14231A]">
                        PIX (+5% em elegíveis)
                      </div>
                      <div className="text-[#4A5D52] mt-0.5">
                        {summary.pixDiscountPotential > 0
                          ? `Economia extra de ${formatBRLWithSymbol(summary.pixDiscountPotential)} nos itens ≥ R$ 1.000`
                          : '5% extra válido em itens ≥ R$ 1.000,00'}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-[#166534] bg-[#F1F5F2]'
                        : 'border-[#E2E8E4] bg-white hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="mt-0.5 accent-[#166534]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-[#14231A] inline-flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-[#166534]" />
                        Cartão de crédito
                      </div>
                      <div className="text-[#4A5D52] mt-0.5">
                        Condições e parcelamento combinados via WhatsApp
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      paymentMethod === 'debit_card'
                        ? 'border-[#166534] bg-[#F1F5F2]'
                        : 'border-[#E2E8E4] bg-white hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="debit_card"
                      checked={paymentMethod === 'debit_card'}
                      onChange={() => setPaymentMethod('debit_card')}
                      className="mt-0.5 accent-[#166534]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-[#14231A] inline-flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-[#166534]" />
                        Cartão de débito
                      </div>
                      <div className="text-[#4A5D52] mt-0.5">
                        Pagamento no débito combinado via WhatsApp
                      </div>
                    </div>
                  </label>
                </div>

                <label
                  className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-center gap-2.5 ${
                    paymentMethod === 'standard'
                      ? 'border-[#166534] bg-[#F1F5F2]'
                      : 'border-[#E2E8E4] bg-white hover:bg-[#F8FAF8]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="standard"
                    checked={paymentMethod === 'standard'}
                    onChange={() => setPaymentMethod('standard')}
                    className="accent-[#166534]"
                  />
                  <div className="text-xs text-[#4A5D52]">
                    <span className="font-semibold text-[#14231A]">
                      Outras condições no WhatsApp:
                    </span>{' '}
                    boleto ou transferência combinados diretamente no atendimento
                  </div>
                </label>
              </div>

              {/* Order Summary */}
              <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] p-4 space-y-3">
                <div className="text-xs font-bold text-[#14231A] uppercase tracking-wide">
                  Resumo do Pedido ({items.length} {items.length === 1 ? 'item' : 'itens'})
                </div>
                <ul className="divide-y divide-[#E2E8E4] text-xs">
                  {items.map((item) => (
                    <li key={item.productId} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#14231A] truncate">{item.name}</div>
                        <div className="text-[#4A5D52] font-mono-num">
                          {item.quantity}x {formatBRLWithSymbol(item.unitPrice)}
                          {item.eligibleForPromo40 ? ' · Elegível 40% OFF + PIX 5%' : ' · Preço original'}
                        </div>
                      </div>
                      <div className="font-bold text-[#14231A] font-mono-num shrink-0">
                        {formatBRLWithSymbol(item.unitPrice * item.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-[#E2E8E4] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#4A5D52]">
                    <span>Subtotal dos produtos</span>
                    <span className="font-mono-num">{formatBRLWithSymbol(summary.subtotal)}</span>
                  </div>
                  {summary.promo40Savings > 0 && (
                    <div className="flex items-center justify-between text-[#166534]">
                      <span>Economia já aplicada (40% OFF itens ≥ R$ 1.000)</span>
                      <span className="font-mono-num font-semibold">
                        {formatBRLWithSymbol(summary.promo40Savings)}
                      </span>
                    </div>
                  )}
                  {summary.pixDiscountApplied > 0 && (
                    <div className="flex items-center justify-between text-[#166534]">
                      <span>Desconto adicional PIX (5% sobre itens elegíveis)</span>
                      <span className="font-mono-num font-semibold">
                        - {formatBRLWithSymbol(summary.pixDiscountApplied)}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-[#E2E8E4] flex items-center justify-between text-sm font-bold text-[#14231A]">
                    <span>TOTAL DOS PRODUTOS</span>
                    <span className="text-lg text-[#166534] font-mono-num">
                      {formatBRLWithSymbol(summary.finalTotal)}
                    </span>
                  </div>
                  {summary.totalSavingsApplied > 0 && (
                    <div className="text-xs font-semibold text-[#166534] font-mono-num">
                      Economia total nesta compra: {formatBRLWithSymbol(summary.totalSavingsApplied)}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-[#4A5D52]">
                Seu pedido será conferido pela nossa equipe antes da confirmação. Transparência nos preços e nas condições de pagamento.
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="w-full h-12 rounded-lg bg-[#128C7E] hover:bg-[#0F766E] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {submitting ? 'Registrando pedido...' : 'Gerar Pedido para WhatsApp'}
                </span>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-[#166534]/25 bg-[#F1F5F2] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold text-[#14231A]">
                    Pedido <span className="font-mono-num">{preparedOrder.orderId}</span> pronto para envio!
                  </div>
                  <p className="text-xs text-[#4A5D52] mt-1 leading-relaxed">
                    Confira seus dados e clique em <strong>ABRIR WHATSAPP E ENVIAR PEDIDO</strong>. Nossa equipe irá verificar disponibilidade, calcular o frete pelo seu CEP e orientar a etapa final com você.
                  </p>
                </div>
              </div>

              {/* Clear Delivery & Totals Confirmation Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[#E2E8E4] bg-white p-3.5 space-y-1">
                  <div className="font-bold text-[#14231A] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Comprador e Entrega</span>
                  </div>
                  <div className="text-[#14231A] font-medium">{preparedOrder.customer.name}</div>
                  <div className="text-[#4A5D52] font-mono-num">
                    CPF {preparedOrder.customer.cpf} · Tel {preparedOrder.customer.phone}
                  </div>
                  <div className="text-[#4A5D52] font-mono-num">
                    CEP {preparedOrder.customer.cep} · {preparedOrder.customer.cityState}
                  </div>
                  {preparedOrder.customer.addressOrNotes && (
                    <div className="text-[#4A5D52] pt-1 border-t border-[#F1F5F2]">
                      Obs.: {preparedOrder.customer.addressOrNotes}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] p-3.5 space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-[#14231A]">Resumo Financeiro</div>
                    <div className="text-[#4A5D52]">
                      {preparedOrder.itemCount} {preparedOrder.itemCount === 1 ? 'unidade' : 'unidades'} ·{' '}
                      {formatPaymentMethodLabel(preparedOrder.customer.paymentMethod)}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8E4]">
                    <div className="text-[11px] text-[#4A5D52]">Total dos produtos</div>
                    <div className="text-xl font-bold text-[#166534] font-mono-num">
                      {formatBRLWithSymbol(preparedOrder.finalTotal)}
                    </div>
                    {preparedOrder.totalSavings > 0 && (
                      <div className="text-[11px] font-semibold text-[#166534] font-mono-num">
                        Economia aplicada: {formatBRLWithSymbol(preparedOrder.totalSavings)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#14231A]">
                    Prévia da mensagem enviada ao WhatsApp ({settings.whatsappDisplay})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(preparedOrder.message)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copiada!' : 'Copiar texto'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] text-xs text-[#14231A] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                  {preparedOrder.message}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={preparedOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOrderCompleted(false)}
                  className="flex-1 h-12 px-5 rounded-lg bg-[#128C7E] hover:bg-[#0F766E] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>ABRIR WHATSAPP E ENVIAR PEDIDO</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onOrderCompleted(true);
                    setPreparedOrder(null);
                  }}
                  className="h-12 px-4 rounded-lg border border-[#E2E8E4] bg-white hover:bg-[#F1F5F2] text-xs font-semibold text-[#14231A] cursor-pointer"
                >
                  Concluir e Limpar Carrinho
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
