import { useState, type FormEvent } from 'react';
import { ExternalLink, Info, MessageCircle, PackageCheck, Search, X } from 'lucide-react';
import type {
  OrderRecord,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionInfo,
  StoreSettings,
} from '../types/store';
import { formatBRLWithSymbol } from '../utils/pricing';
import { formatCPF, formatPhoneBR, isValidCPF } from '../utils/validators';
import { buildWhatsAppSupportMessage, buildWhatsAppUrl } from '../utils/whatsapp';

interface OrdersLookupModalProps {
  open: boolean;
  localOrders: OrderRecord[];
  settings: StoreSettings;
  onClose: () => void;
}

interface LookupOrderSummary {
  id: string;
  createdAt: string;
  customerName: string;
  cityState: string;
  cep: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentTransaction?: PaymentTransactionInfo | null;
  subtotal: number;
  pixDiscount: number;
  total: number;
  items: OrderRecord['items'];
  whatsappUrl: string;
  stageLabel: string;
}

export function OrdersLookupModal({
  open,
  localOrders,
  settings,
  onClose,
}: OrdersLookupModalProps) {
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [foundOrders, setFoundOrders] = useState<LookupOrderSummary[]>([]);

  if (!open) return null;

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidCPF(cpf)) {
      setError('Informe um CPF válido (11 dígitos) para consultar pedidos registrados.');
      return;
    }
    if (!orderId.trim() && phone.replace(/\D/g, '').length < 10) {
      setError('Informe o número de telefone usado no pedido ou o código do pedido.');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf,
          phone,
          orderId: orderId.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; orders?: LookupOrderSummary[] };
      if (!res.ok) {
        setError(data.error || 'Não foi possível consultar pedidos.');
        return;
      }
      setFoundOrders(Array.isArray(data.orders) ? data.orders : []);
      setSearchedOnce(true);
    } catch {
      setError('Erro de conexão ao consultar pedidos no servidor.');
    } finally {
      setSearching(false);
    }
  };

  const whatsappSupportUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSupportMessage()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Meus pedidos"
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#166534]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#14231A]">Meus pedidos</h2>
              <p className="text-xs text-[#4A5D52]">
                Consulta exclusiva de solicitações reais registradas na loja
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Meus pedidos"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Honest notice about WhatsApp-only workflow */}
          <div className="p-3.5 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] flex items-start gap-2.5 text-[#4A5D52]">
            <Info className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-[#14231A]">Atendimento via WhatsApp:</strong> os pedidos da
              AGROLEITE são conferidos pela nossa equipe no WhatsApp oficial ({settings.whatsappDisplay}).
              A loja ainda não possui integração automática com transportadoras ou gateways de
              pagamento para rastreio automático em tempo real; confirmações de frete, pagamento e
              envio são tratadas diretamente com o atendente.
            </div>
          </div>

          {/* Lookup Form */}
          <form onSubmit={handleLookup} className="space-y-3 rounded-xl border border-[#E2E8E4] p-4">
            <div className="font-display text-sm font-bold text-[#14231A]">
              Consultar pedido registrado no servidor
            </div>

            {error && (
              <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-800 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="lookup-cpf" className="block font-semibold text-[#14231A] mb-1">
                  CPF usado no pedido *
                </label>
                <input
                  id="lookup-cpf"
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                />
              </div>

              <div>
                <label htmlFor="lookup-phone" className="block font-semibold text-[#14231A] mb-1">
                  Telefone com DDD
                </label>
                <input
                  id="lookup-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                />
              </div>

              <div>
                <label htmlFor="lookup-code" className="block font-semibold text-[#14231A] mb-1">
                  Código do pedido (opcional)
                </label>
                <input
                  id="lookup-code"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ex: PED-..."
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] font-mono-num"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="h-10 px-4 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{searching ? 'Consultando...' : 'Consultar Pedido'}</span>
            </button>
          </form>

          {/* Search Results */}
          {searchedOnce && (
            <div className="space-y-3">
              <div className="font-display text-sm font-bold text-[#14231A]">
                Resultado da consulta ({foundOrders.length})
              </div>
              {foundOrders.length === 0 ? (
                <div className="p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] text-[#4A5D52]">
                  Nenhum pedido registrado foi encontrado para os dados informados.
                </div>
              ) : (
                foundOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-[#E2E8E4] bg-white space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono-num font-bold text-[#14231A]">{ord.id}</span>
                        <span className="text-[#4A5D52] ml-2">
                          {new Date(ord.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          ord.paymentStatus === 'PAGO'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : ord.paymentStatus === 'PAGAMENTO NÃO APROVADO'
                            ? 'bg-red-50 text-red-800'
                            : ord.paymentStatus === 'AGUARDANDO PAGAMENTO'
                            ? 'bg-amber-50 text-amber-900'
                            : 'bg-[#F1F5F2] text-[#166534]'
                        }`}
                      >
                        {ord.stageLabel}
                      </span>
                    </div>
                    <div className="text-[#4A5D52]">
                      {ord.customerName} · {ord.cityState} · CEP {ord.cep}
                    </div>
                    {ord.paymentTransaction?.providerPaymentId && (
                      <div className="text-[11px] text-[#4A5D52]">
                        Mercado Pago #{ord.paymentTransaction.providerPaymentId}
                        {ord.paymentTransaction.paymentMethodId
                          ? ` · ${ord.paymentTransaction.paymentMethodId.toUpperCase()}`
                          : ''}
                        {ord.paymentTransaction.cardLastFourDigits
                          ? ` (final ${ord.paymentTransaction.cardLastFourDigits})`
                          : ''}
                        {' · '}
                        {ord.paymentTransaction.statusMessagePt}
                      </div>
                    )}
                    <ul className="divide-y divide-[#F1F5F2]">
                      {ord.items.map((it) => (
                        <li key={it.productId} className="py-1 flex justify-between gap-2">
                          <span className="truncate">
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-mono-num font-semibold shrink-0">
                            {formatBRLWithSymbol(it.unitPrice * it.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-[#F1F5F2] flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-num font-bold text-sm text-[#166534]">
                        Total produtos: {formatBRLWithSymbol(ord.total)}
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={ord.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#128C7E] font-semibold hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Retomar conversa no WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Browser-local recent orders */}
          <div className="space-y-3">
            <div className="font-display text-sm font-bold text-[#14231A]">
              Pedidos realizados neste navegador ({localOrders.length})
            </div>
            {localOrders.length === 0 ? (
              <div className="p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] text-[#4A5D52] space-y-2">
                <p>Você ainda não enviou pedidos a partir deste navegador.</p>
                <a
                  href={whatsappSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#128C7E] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Acompanhar pedido anterior diretamente no WhatsApp</span>
                </a>
              </div>
            ) : (
              localOrders.map((ord) => (
                <div
                  key={`local-${ord.id}`}
                  className="p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num font-bold text-[#14231A]">{ord.id}</span>
                    <span className="text-[#4A5D52]">
                      {new Date(ord.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-[#4A5D52]">
                    {ord.items.length} item(ns) · Total:{' '}
                    <strong className="font-mono-num text-[#166534]">
                      {formatBRLWithSymbol(ord.total)}
                    </strong>
                  </div>
                  <a
                    href={ord.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#128C7E] hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Abrir resumo no WhatsApp</span>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
