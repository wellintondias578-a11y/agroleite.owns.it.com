import { useState } from 'react';
import { Heart, HelpCircle, MessageCircle, Minus, Plus, Share2, ShoppingCart } from 'lucide-react';
import type { Product, StoreSettings } from '../types/store';
import { evaluateProductPrice, formatBRLWithSymbol } from '../utils/pricing';
import { getCleanProductSlug } from '../utils/seo';
import {
  buildWhatsAppProductMessage,
  buildWhatsAppShareProductUrl,
  buildWhatsAppSpecialistHelpMessage,
  buildWhatsAppUrl,
} from '../utils/whatsapp';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  settings: StoreSettings;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductCard({
  product,
  settings,
  isWishlisted = false,
  onToggleWishlist,
  onOpenDetail,
  onAddToCart,
}: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const evaluation = evaluateProductPrice(product, settings);
  const displayPrice = evaluation.displayPrice;
  const isEligible40 = evaluation.eligibleForPromo40 && displayPrice !== null;

  const handleAdd = () => {
    if (displayPrice === null || !product.available) return;
    onAddToCart(product, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1200);
  };

  const whatsappDirectUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppProductMessage(product, qty, displayPrice, evaluation.pixPrice)
  );

  const specialistHelpUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSpecialistHelpMessage(product)
  );

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/produto/${getCleanProductSlug(product)}`
      : `/produto/${getCleanProductSlug(product)}`;
  const shareUrl = buildWhatsAppShareProductUrl(
    product,
    displayPrice,
    evaluation.pixPrice,
    productUrl
  );

  return (
    <article className="group bg-white rounded-xl border border-[#E2E8E4] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden">
      {/* Image Area */}
      <div className="relative aspect-[4/3] w-full bg-[#F1F5F2] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="w-full h-full cursor-pointer block"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          {isEligible40 && (
            <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded bg-[#166534] text-white text-[11px] font-bold tracking-wide font-mono-num">
              40% OFF
            </span>
          )}
          <ProductImage
            src={product.images[0]}
            alt={`${product.name} — ${product.category} AGROLEITE`}
            sku={product.sku}
            className="w-full h-full object-contain p-3 bg-white transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </button>

        {/* Compact Top-Right Utility Icons (Wishlist & Share) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={
                isWishlisted
                  ? `Remover ${product.name} dos desejos`
                  : `Salvar ${product.name} nos desejos`
              }
              title={isWishlisted ? 'Remover dos desejos' : 'Salvar nos desejos'}
              className={`w-8 h-8 rounded-lg border shadow-xs inline-flex items-center justify-center transition-colors cursor-pointer ${
                isWishlisted
                  ? 'bg-[#166534] border-[#166534] text-white'
                  : 'bg-white/95 border-[#E2E8E4] text-[#4A5D52] hover:text-[#166534]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          )}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartilhar ${product.name} pelo WhatsApp`}
            title="Compartilhar pelo WhatsApp"
            className="w-8 h-8 rounded-lg bg-white/95 border border-[#E2E8E4] shadow-xs text-[#4A5D52] hover:text-[#128C7E] inline-flex items-center justify-center transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Clean unboxed metadata */}
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-[#4A5D52]">
            <span className="font-mono-num">Cód. {product.sku}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[140px]">{product.subcategory}</span>
            <span aria-hidden="true">·</span>
            <span className={product.available ? 'text-[#166534] font-medium' : 'text-amber-700 font-medium'}>
              {product.available ? 'Disponível' : 'Sob encomenda'}
            </span>
          </div>

          <h3 className="mt-1.5 min-h-[40px]">
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="text-left font-display text-[15px] font-semibold text-[#14231A] hover:text-[#166534] transition-colors line-clamp-2 leading-snug cursor-pointer"
            >
              {product.name}
            </button>
          </h3>

          {(product.brand || product.model) && (
            <div className="mt-1 text-xs text-[#4A5D52] truncate">
              {product.brand ? `Marca: ${product.brand}` : ''}
              {product.brand && product.model ? ' · ' : ''}
              {product.model ? `Modelo: ${product.model}` : ''}
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="pt-3 border-t border-[#F1F5F2] space-y-3">
          {displayPrice !== null ? (
            <div>
              {isEligible40 && evaluation.originalPrice && evaluation.originalPrice > displayPrice && (
                <div className="text-xs text-[#4A5D52] font-mono-num">
                  De <span className="line-through">{formatBRLWithSymbol(evaluation.originalPrice)}</span>
                </div>
              )}
              <div className="text-xl font-bold text-[#166534] font-mono-num">
                {isEligible40 ? `Por ${formatBRLWithSymbol(displayPrice)}` : formatBRLWithSymbol(displayPrice)}
              </div>
              {isEligible40 && evaluation.pixPrice !== null && (
                <div className="text-[11px] text-[#166534] font-medium font-mono-num mt-0.5">
                  {formatBRLWithSymbol(evaluation.pixPrice)} no PIX (+5% OFF)
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-[#14231A]">
                Consulte o preço pelo WhatsApp
              </div>
              <div className="text-xs text-[#4A5D52]">
                Cotação rápida com nossa equipe técnica
              </div>
            </div>
          )}

          {displayPrice !== null && product.available ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center border border-[#E2E8E4] rounded-lg bg-[#F8FAF8] shrink-0">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="w-8 h-9 inline-flex items-center justify-center text-[#4A5D52] hover:text-[#14231A] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-semibold font-mono-num">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(999, q + 1))}
                  aria-label="Aumentar quantidade"
                  className="w-8 h-9 inline-flex items-center justify-center text-[#4A5D52] hover:text-[#14231A] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  addedFeedback
                    ? 'bg-[#14231A] text-white'
                    : 'bg-[#166534] hover:bg-[#15803D] text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>{addedFeedback ? 'Adicionado!' : 'Adicionar'}</span>
              </button>
            </div>
          ) : (
            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-9 px-3 rounded-lg border border-[#166534] text-[#166534] hover:bg-[#166534] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Consultar no WhatsApp</span>
            </a>
          )}

          <a
            href={specialistHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4A5D52] hover:text-[#128C7E] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Precisa de ajuda para escolher?</span>
          </a>
        </div>
      </div>
    </article>
  );
}
