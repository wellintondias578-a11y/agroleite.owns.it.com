import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import type { Product, StoreSettings } from '../types/store';
import { evaluateProductPrice, formatBRLWithSymbol } from '../utils/pricing';
import { ProductImage } from './ProductImage';

interface WishlistModalProps {
  open: boolean;
  products: Product[];
  settings: StoreSettings;
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
  onRemoveWishlist: (productId: string) => void;
  onAddToCart: (product: Product, qty: number) => void;
}

export function WishlistModal({
  open,
  products,
  settings,
  onClose,
  onOpenProduct,
  onRemoveWishlist,
  onAddToCart,
}: WishlistModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Lista de desejos"
    >
      <div className="bg-white w-full max-w-xl max-h-[88vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#166534]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#14231A]">Lista de Desejos</h2>
              <p className="text-xs text-[#4A5D52] font-mono-num">
                {products.length} {products.length === 1 ? 'produto salvo' : 'produtos salvos'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar lista de desejos"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {products.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-xs text-[#4A5D52]">
              <Heart className="w-8 h-8 text-[#CBD5CE] mx-auto" />
              <div className="font-display text-sm font-bold text-[#14231A]">
                Sua lista de desejos está vazia
              </div>
              <p className="max-w-xs mx-auto">
                Toque no ícone de coração nos produtos para salvar os equipamentos e peças de seu interesse.
              </p>
            </div>
          ) : (
            products.map((product) => {
              const ev = evaluateProductPrice(product, settings);
              return (
                <div
                  key={`wish-${product.id}`}
                  className="p-3 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] flex items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProduct(product);
                    }}
                    className="w-16 h-16 rounded-lg bg-white border border-[#E2E8E4] overflow-hidden shrink-0 cursor-pointer"
                  >
                    <ProductImage
                      src={product.images[0]}
                      alt={product.name}
                      sku={product.sku}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenProduct(product);
                      }}
                      className="text-left text-xs font-semibold text-[#14231A] hover:text-[#166534] line-clamp-2 cursor-pointer"
                    >
                      {product.name}
                    </button>
                    <div className="mt-1 font-mono-num text-sm font-bold text-[#166534]">
                      {ev.displayPrice !== null
                        ? formatBRLWithSymbol(ev.displayPrice)
                        : 'Consulte no WhatsApp'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.displayPrice !== null && product.available && (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product, 1)}
                        aria-label={`Adicionar ${product.name} ao carrinho`}
                        className="h-9 px-3 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Adicionar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveWishlist(product.id)}
                      aria-label={`Remover ${product.name} dos desejos`}
                      className="w-9 h-9 rounded-lg border border-[#E2E8E4] bg-white hover:bg-red-50 text-red-700 inline-flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
