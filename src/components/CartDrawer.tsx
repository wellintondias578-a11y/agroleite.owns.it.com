import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem } from '../types/store';
import { calculateCartTotals, formatBRLWithSymbol } from '../utils/pricing';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const summary = calculateCartTotals(items, 'pix');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8E4]">
        {/* Header */}
        <div className="px-5 h-16 border-b border-[#E2E8E4] flex items-center justify-between bg-[#F8FAF8]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#166534]" />
            <h2 className="font-display text-lg font-bold text-[#14231A]">
              Seu Carrinho ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carrinho"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F1F5F2] flex items-center justify-center text-[#166534]">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="font-display text-base font-semibold text-[#14231A]">
                Seu carrinho está vazio
              </div>
              <p className="text-sm text-[#4A5D52] max-w-xs">
                Adicione ordenhadeiras, teteiras ou peças de reposição para montar seu pedido pelo WhatsApp.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold cursor-pointer"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            items.map((item) => {
              const subtotal = item.unitPrice * item.quantity;
              return (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 rounded-xl border border-[#E2E8E4] bg-white"
                >
                  <div className="w-20 h-20 rounded-lg border border-[#F1F5F2] bg-white overflow-hidden shrink-0">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      sku={item.sku}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#14231A] line-clamp-2">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-mono-num text-[#4A5D52] mt-0.5">
                          Cód. {item.sku} ·{' '}
                          {item.eligibleForPromo40 && item.originalPrice ? (
                            <>
                              <span className="line-through mr-1">
                                {formatBRLWithSymbol(item.originalPrice)}
                              </span>
                              <span className="text-[#166534] font-semibold">
                                {formatBRLWithSymbol(item.unitPrice)}
                              </span>
                              {' · 40% OFF'}
                            </>
                          ) : (
                            <>Unit: {formatBRLWithSymbol(item.unitPrice)}</>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId)}
                        aria-label={`Remover ${item.name}`}
                        className="p-1.5 rounded-md text-[#4A5D52] hover:text-red-700 hover:bg-red-50 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-[#E2E8E4] rounded-lg bg-[#F8FAF8]">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(item.productId, Math.max(1, item.quantity - 1))
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Diminuir quantidade"
                          className="w-8 h-8 inline-flex items-center justify-center text-[#4A5D52] hover:text-[#14231A] disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold font-mono-num">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(item.productId, Math.min(999, item.quantity + 1))
                          }
                          aria-label="Aumentar quantidade"
                          className="w-8 h-8 inline-flex items-center justify-center text-[#4A5D52] hover:text-[#14231A] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-[#4A5D52]">Subtotal do item</div>
                        <div className="text-sm font-bold text-[#166534] font-mono-num">
                          {formatBRLWithSymbol(subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#E2E8E4] bg-[#F8FAF8] space-y-4">
            <div className="rounded-xl border border-[#E2E8E4] bg-white p-3.5 space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-xs text-[#4A5D52]">
                <span>Subtotal dos produtos</span>
                <span className="font-mono-num font-medium text-[#14231A]">
                  {formatBRLWithSymbol(summary.subtotal)}
                </span>
              </div>
              {summary.promo40Savings > 0 && (
                <div className="flex items-center justify-between text-xs text-[#166534]">
                  <span>Economia (40% OFF itens ≥ R$ 1.000)</span>
                  <span className="font-mono-num font-semibold">
                    {formatBRLWithSymbol(summary.promo40Savings)}
                  </span>
                </div>
              )}
              {summary.pixDiscountPotential > 0 && (
                <div className="flex items-center justify-between text-xs text-[#166534]">
                  <span>Desconto adicional PIX (5% em elegíveis)</span>
                  <span className="font-mono-num font-semibold">
                    - {formatBRLWithSymbol(summary.pixDiscountPotential)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-bold text-[#14231A] pt-2 border-t border-[#E2E8E4]">
                <span>
                  {summary.pixDiscountPotential > 0 ? 'Total estimado no PIX' : 'Total dos produtos'}
                </span>
                <span className="text-lg text-[#166534] font-mono-num">
                  {formatBRLWithSymbol(
                    summary.pixDiscountPotential > 0 ? summary.finalTotal : summary.subtotal
                  )}
                </span>
              </div>
              {summary.totalSavingsApplied > 0 && (
                <div className="text-[11px] font-semibold text-[#166534] font-mono-num">
                  Economia total nesta compra no PIX: {formatBRLWithSymbol(summary.totalSavingsApplied)}
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#4A5D52]">
              Pedido conferido pela equipe AGROLEITE antes da confirmação. O valor do frete será calculado pelo seu CEP no WhatsApp.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onCheckout}
                className="w-full h-12 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                FINALIZAR PEDIDO
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-lg border border-[#E2E8E4] bg-white hover:bg-[#F1F5F2] text-[#14231A] text-xs font-semibold transition-colors cursor-pointer"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
