import { Clock } from 'lucide-react';
import type { Product, StoreSettings } from '../types/store';
import { evaluateProductPrice, formatBRLWithSymbol } from '../utils/pricing';
import { ProductImage } from './ProductImage';

interface RecentlyViewedSectionProps {
  products: Product[];
  settings: StoreSettings;
  onOpenProduct: (product: Product) => void;
}

export function RecentlyViewedSection({
  products,
  settings,
  onOpenProduct,
}: RecentlyViewedSectionProps) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-viewed-title"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 border-t border-[#E2E8E4]"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#166534]" />
          <h2 id="recently-viewed-title" className="font-display text-xl sm:text-2xl font-bold text-[#14231A]">
            Você visualizou recentemente
          </h2>
        </div>
        <span className="text-xs text-[#4A5D52] font-mono-num">
          {products.length} {products.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.slice(0, 6).map((product) => {
          const ev = evaluateProductPrice(product, settings);
          const isEligible40 = ev.eligibleForPromo40 && ev.displayPrice !== null;

          return (
            <button
              key={`recent-${product.id}`}
              type="button"
              onClick={() => onOpenProduct(product)}
              className="group text-left bg-white rounded-xl border border-[#E2E8E4] hover:border-[#166534] hover:shadow-sm transition-all p-3 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="relative aspect-[4/3] w-full bg-[#F1F5F2] rounded-lg overflow-hidden mb-2.5">
                  {isEligible40 && (
                    <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-[#166534] text-white text-[10px] font-bold font-mono-num">
                      40% OFF
                    </span>
                  )}
                  <ProductImage
                    src={product.images[0]}
                    alt={product.name}
                    sku={product.sku}
                    className="w-full h-full object-contain p-2 bg-white transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="text-[11px] font-mono-num text-[#4A5D52]">Cód. {product.sku}</div>
                <div className="text-xs font-semibold text-[#14231A] group-hover:text-[#166534] line-clamp-2 mt-0.5">
                  {product.name}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#F1F5F2] font-mono-num">
                {ev.displayPrice !== null ? (
                  <div>
                    <div className="text-sm font-bold text-[#166534]">
                      {formatBRLWithSymbol(ev.displayPrice)}
                    </div>
                    {isEligible40 && ev.pixPrice !== null && (
                      <div className="text-[10px] text-[#166534]">
                        {formatBRLWithSymbol(ev.pixPrice)} PIX
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-[#4A5D52]">Consulte no WhatsApp</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
