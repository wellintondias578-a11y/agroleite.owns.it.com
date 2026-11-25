import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  HelpCircle,
  Layers,
  MessageCircle,
  MessageSquare,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import type { Product, ProductQuestion, StoreSettings } from '../types/store';
import { evaluateProductPrice, formatBRLWithSymbol } from '../utils/pricing';
import { extractProductPresentation } from '../utils/productPresentation';
import { getCleanProductSlug } from '../utils/seo';
import {
  buildWhatsAppProductMessage,
  buildWhatsAppShareProductUrl,
  buildWhatsAppSpecialistHelpMessage,
  buildWhatsAppUrl,
} from '../utils/whatsapp';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts: Product[];
  settings: StoreSettings;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: string, subcategory?: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  allProducts,
  settings,
  isWishlisted = false,
  onToggleWishlist,
  onClose,
  onSelectProduct,
  onSelectCategory,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [qCustomerName, setQCustomerName] = useState('');
  const [qText, setQText] = useState('');
  const [qSubmitting, setQSubmitting] = useState(false);
  const [qError, setQError] = useState('');
  const [qSuccess, setQSuccess] = useState('');

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    setAdded(false);
    setCopiedLink(false);
    setQError('');
    setQSuccess('');
    setQText('');

    if (!product?.id) {
      setQuestions([]);
      return;
    }

    let cancelled = false;
    setLoadingQuestions(true);
    fetch(`/api/product-questions/${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((data: { questions?: ProductQuestion[] }) => {
        if (!cancelled && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  const presentation = useMemo(
    () => (product ? extractProductPresentation(product) : null),
    [product]
  );

  if (!product || !presentation) return null;

  const evaluation = evaluateProductPrice(product, settings);
  const displayPrice = evaluation.displayPrice;
  const isEligible40 = evaluation.eligibleForPromo40 && displayPrice !== null;
  const activeImage = product.images[selectedImageIdx] || product.images[0] || null;
  const totalImages = product.images.length;

  const related = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.subcategory === product.subcategory || p.category === product.category)
    )
    .slice(0, 4);

  const whatsappBuyHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppProductMessage(product, quantity, displayPrice, evaluation.pixPrice)
  );

  const specialistHelpHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSpecialistHelpMessage(product)
  );

  const productShareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/produto/${getCleanProductSlug(product)}`
      : `/produto/${getCleanProductSlug(product)}`;

  const whatsappShareHref = buildWhatsAppShareProductUrl(
    product,
    displayPrice,
    evaluation.pixPrice,
    productShareLink
  );

  const handleAdd = () => {
    if (displayPrice === null || !product.available) return;
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleCopyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(productShareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  const handleAskQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setQError('');
    setQSuccess('');

    if (qCustomerName.trim().length < 2) {
      setQError('Informe seu nome para enviar sua dúvida.');
      return;
    }
    if (qText.trim().length < 8) {
      setQError('Escreva sua pergunta com pelo menos 8 caracteres.');
      return;
    }

    setQSubmitting(true);
    try {
      const res = await fetch('/api/product-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: qCustomerName.trim(),
          question: qText.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setQError(data.error || 'Não foi possível enviar sua pergunta.');
        return;
      }
      setQSuccess(
        data.message ||
          'Pergunta enviada para análise da nossa equipe! Ela será exibida após aprovação e resposta.'
      );
      setQText('');
    } catch {
      setQError('Erro de conexão ao enviar sua pergunta.');
    } finally {
      setQSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl border border-[#E2E8E4] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-[#E2E8E4] flex items-center justify-between gap-4 bg-[#F8FAF8]">
          <nav className="flex items-center gap-1.5 text-xs text-[#4A5D52] overflow-x-auto whitespace-nowrap">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCategory(product.category);
              }}
              className="hover:text-[#166534] font-medium cursor-pointer"
            >
              {product.category}
            </button>
            {product.subcategory && product.subcategory !== product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectCategory(product.category, product.subcategory);
                  }}
                  className="hover:text-[#166534] font-medium cursor-pointer"
                >
                  {product.subcategory}
                </button>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do produto"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] hover:text-[#14231A] shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Gallery Left */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-[4/3] w-full rounded-xl border border-[#E2E8E4] bg-white overflow-hidden">
                <ProductImage
                  src={activeImage}
                  alt={`${product.name} — ${product.category} AGROLEITE`}
                  sku={product.sku}
                  priority
                  className="w-full h-full object-contain p-4"
                />
                {totalImages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImageIdx((idx) => (idx - 1 + totalImages) % totalImages)
                      }
                      aria-label="Foto anterior"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-[#E2E8E4] shadow-sm inline-flex items-center justify-center text-[#14231A] hover:border-[#166534] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIdx((idx) => (idx + 1) % totalImages)}
                      aria-label="Próxima foto"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-[#E2E8E4] shadow-sm inline-flex items-center justify-center text-[#14231A] hover:border-[#166534] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-[#14231A]/75 text-white text-[11px] font-mono-num">
                      Foto {selectedImageIdx + 1} de {totalImages}
                    </span>
                  </>
                )}
              </div>

              {totalImages > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      aria-label={`Selecionar foto ${idx + 1}`}
                      className={`w-16 h-16 rounded-lg border overflow-hidden bg-white shrink-0 cursor-pointer transition-all ${
                        idx === selectedImageIdx
                          ? 'border-[#166534] ring-2 ring-[#166534]/20'
                          : 'border-[#E2E8E4] hover:border-[#4A5D52]'
                      }`}
                    >
                      <ProductImage
                        src={img}
                        alt={`${product.name} foto ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Delivery & Specialist Support Assurance */}
              <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] p-4 space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#14231A]">
                      Compra acompanhada pela equipe AGROLEITE
                    </div>
                    <p className="text-[#4A5D52] mt-0.5">
                      Conferimos modelo, compatibilidade de encaixe e voltagem antes da confirmação do pedido.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pt-2 border-t border-[#E2E8E4]">
                  <Truck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#14231A]">
                      Entrega para todo o Brasil via CEP
                    </div>
                    <p className="text-[#4A5D52] mt-0.5">
                      Modalidade de envio e valor exato do frete informados com transparência pelo WhatsApp ({settings.whatsappDisplay}).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contiguous Purchase Module Right */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center flex-wrap gap-2 text-xs text-[#4A5D52]">
                  <span className="font-mono-num">Cód. {product.sku}</span>
                  {product.brand && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Marca: {product.brand}</span>
                    </>
                  )}
                  {product.model && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Modelo: {product.model}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className={product.available ? 'text-[#166534] font-semibold' : 'text-amber-700 font-semibold'}>
                    {product.available ? 'Disponível para cotação/pedido' : 'Disponibilidade sob consulta'}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14231A] leading-tight">
                  {product.name}
                </h2>

                {/* Price block */}
                <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E2E8E4]">
                  {displayPrice !== null ? (
                    <div className="space-y-1.5">
                      {isEligible40 && (
                        <div className="inline-block px-2 py-0.5 rounded bg-[#166534] text-white text-[11px] font-bold tracking-wide font-mono-num">
                          40% OFF
                        </div>
                      )}
                      {isEligible40 && evaluation.originalPrice && evaluation.originalPrice > displayPrice && (
                        <div className="text-xs text-[#4A5D52] font-mono-num">
                          De{' '}
                          <span className="line-through">
                            {formatBRLWithSymbol(evaluation.originalPrice)}
                          </span>{' '}
                          · Economia de{' '}
                          {formatBRLWithSymbol(evaluation.originalPrice - displayPrice)}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-[#166534] font-mono-num">
                        {isEligible40 ? `Por ${formatBRLWithSymbol(displayPrice)}` : formatBRLWithSymbol(displayPrice)}
                      </div>
                      {isEligible40 && evaluation.pixPrice !== null && (
                        <div className="text-xs font-semibold text-[#166534] font-mono-num">
                          No PIX: {formatBRLWithSymbol(evaluation.pixPrice)} (5% de desconto adicional · economia extra de {formatBRLWithSymbol(evaluation.pixSavings)})
                        </div>
                      )}
                      <div className="text-xs text-[#4A5D52]">
                        Tire suas dúvidas antes de finalizar seu pedido. Transparência nos preços e nas condições de pagamento.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xl font-bold text-[#14231A]">
                        Consulte o preço pelo WhatsApp
                      </div>
                      <div className="text-xs text-[#4A5D52]">
                        Este item depende de confirmação comercial com nossa equipe.
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity & CTAs */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#14231A]">Quantidade:</span>
                    <div className="inline-flex items-center border border-[#E2E8E4] rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Diminuir quantidade"
                        className="w-10 h-10 inline-flex items-center justify-center text-[#4A5D52] hover:text-[#14231A] cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setQuantity(Number.isFinite(v) && v >= 1 ? Math.min(999, v) : 1);
                        }}
                        aria-label="Quantidade"
                        className="w-12 h-10 text-center text-sm font-semibold font-mono-num focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                        aria-label="Aumentar quantidade"
                        className="w-10 h-10 inline-flex items-center justify-center text-[#4A5D52] hover:text-[#14231A] cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {displayPrice !== null && product.available && (
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="flex-1 h-12 px-5 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{added ? 'ADICIONADO AO CARRINHO' : 'ADICIONAR AO CARRINHO'}</span>
                      </button>
                    )}

                    <a
                      href={whatsappBuyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 px-5 rounded-lg bg-[#128C7E] hover:bg-[#0F766E] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>COMPRAR PELO WHATSAPP</span>
                    </a>
                  </div>

                  {/* Specialist Help + Share + Wishlist Action Strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={specialistHelpHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3.5 rounded-lg border border-[#128C7E]/40 bg-[#F1F5F2] hover:bg-[#E5ECE7] text-[#14231A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#128C7E]" />
                      <span>Precisa de ajuda para escolher?</span>
                    </a>

                    <a
                      href={whatsappShareHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 rounded-lg border border-[#E2E8E4] bg-white hover:bg-[#F8FAF8] text-xs font-semibold text-[#14231A] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#166534]" />
                      <span>Compartilhar no WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyProductLink}
                      className="h-9 px-3 rounded-lg border border-[#E2E8E4] bg-white hover:bg-[#F8FAF8] text-xs font-semibold text-[#4A5D52] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#166534]" />
                          <span>Link copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar link</span>
                        </>
                      )}
                    </button>

                    {onToggleWishlist && (
                      <button
                        type="button"
                        onClick={() => onToggleWishlist(product.id)}
                        className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                          isWishlisted
                            ? 'border-[#166534] bg-[#F1F5F2] text-[#166534]'
                            : 'border-[#E2E8E4] bg-white hover:bg-[#F8FAF8] text-[#4A5D52]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                        <span>{isWishlisted ? 'Nos Desejos' : 'Salvar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Structured Compatibility, Voltage & Technical Specs */}
              <div className="border-t border-[#E2E8E4] pt-4 space-y-3">
                {(presentation.compatibilityBrands.length > 0 ||
                  presentation.voltageInfo ||
                  presentation.voltageRequiresConfirmation) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {presentation.compatibilityBrands.length > 0 && (
                      <div className="bg-[#F8FAF8] px-3.5 py-2.5 rounded-lg border border-[#E2E8E4]">
                        <div className="flex items-center gap-1.5 text-[#4A5D52]">
                          <Layers className="w-3.5 h-3.5 text-[#166534]" />
                          <span>Modelos / Compatibilidade</span>
                        </div>
                        <div className="font-semibold text-[#14231A] mt-1">
                          {presentation.compatibilityBrands.join(' · ')}
                        </div>
                      </div>
                    )}

                    {(presentation.voltageInfo || presentation.voltageRequiresConfirmation) && (
                      <div className="bg-[#F8FAF8] px-3.5 py-2.5 rounded-lg border border-[#E2E8E4]">
                        <div className="flex items-center gap-1.5 text-[#4A5D52]">
                          <Zap className="w-3.5 h-3.5 text-[#166534]" />
                          <span>Voltagem / Alimentação</span>
                        </div>
                        <div className="font-semibold text-[#14231A] mt-1">
                          {presentation.voltageInfo ||
                            'Confirmar voltagem (110V/220V) no atendimento via WhatsApp'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {presentation.specs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#14231A] mb-2">
                      Características Técnicas
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {presentation.specs.map((sp) => (
                        <div
                          key={sp.label}
                          className="bg-[#F8FAF8] px-3 py-2 rounded-lg border border-[#E2E8E4]"
                        >
                          <dt className="text-[#4A5D52]">{sp.label}</dt>
                          <dd className="font-semibold text-[#14231A] mt-0.5">{sp.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Organized Description */}
          <div className="border-t border-[#E2E8E4] pt-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#14231A] mb-2.5">
                Descrição e Detalhes do Produto
              </h3>
              <div className="text-sm text-[#4A5D52] leading-relaxed whitespace-pre-line max-w-4xl">
                {presentation.overviewText}
              </div>
            </div>

            {presentation.includedItems.length > 0 && (
              <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] p-4 sm:p-5">
                <h4 className="font-display text-sm font-bold text-[#14231A] mb-3">
                  Itens e Componentes Informados
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm text-[#4A5D52]">
                  {presentation.includedItems.map((itemLine, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#166534] font-bold mt-0.5">•</span>
                      <span>{itemLine}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {presentation.notes.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 space-y-1">
                <div className="font-semibold">Observações do produto</div>
                {presentation.notes.map((note, idx) => (
                  <p key={idx}>{note}</p>
                ))}
              </div>
            )}

            {presentation.supportAndWarranty.length > 0 && (
              <div className="rounded-xl border border-[#E2E8E4] bg-white p-4 text-xs text-[#4A5D52] space-y-1.5 leading-relaxed">
                <div className="font-semibold text-[#14231A]">
                  Informações técnicas e garantia do fabricante
                </div>
                {presentation.supportAndWarranty.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            )}
          </div>

          {/* Customer Questions about this Product */}
          <div className="border-t border-[#E2E8E4] pt-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Perguntas sobre este produto</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#14231A] mt-0.5">
                Dúvidas e Respostas Verificadas
              </h3>
              <p className="text-xs text-[#4A5D52] mt-0.5">
                Perguntas enviadas pelos clientes passam por análise administrativa e somente são
                exibidas após verificação e resposta oficial da equipe AGROLEITE.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Approved Q&A list */}
              <div className="lg:col-span-7 space-y-3">
                {loadingQuestions ? (
                  <div className="text-xs text-[#4A5D52]">Carregando perguntas...</div>
                ) : questions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] text-xs text-[#4A5D52]">
                    Ainda não há perguntas respondidas e publicadas para este produto. Envie sua
                    dúvida ao lado ou clique em &quot;Precisa de ajuda para escolher?&quot;.
                  </div>
                ) : (
                  questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 text-[#4A5D52]">
                        <span className="font-semibold text-[#14231A]">{q.customerName}</span>
                        <span className="font-mono-num">
                          {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="font-medium text-[#14231A]">P: {q.question}</div>
                      {q.answer && (
                        <div className="pt-2 border-t border-[#E2E8E4] text-[#166534]">
                          <strong>Equipe AGROLEITE:</strong> {q.answer}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Ask a Question Form */}
              <form
                onSubmit={handleAskQuestion}
                className="lg:col-span-5 p-4 rounded-xl border border-[#E2E8E4] bg-white space-y-3 text-xs"
              >
                <div className="font-semibold text-[#14231A]">Enviar pergunta sobre este item</div>
                {qError && (
                  <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-800">
                    {qError}
                  </div>
                )}
                {qSuccess && (
                  <div className="p-2.5 rounded-lg border border-[#166534]/30 bg-[#F1F5F2] text-[#166534]">
                    {qSuccess}
                  </div>
                )}
                <div>
                  <label htmlFor="pdp-q-name" className="block font-semibold text-[#14231A] mb-1">
                    Seu nome *
                  </label>
                  <input
                    id="pdp-q-name"
                    type="text"
                    required
                    value={qCustomerName}
                    onChange={(e) => setQCustomerName(e.target.value)}
                    placeholder="Ex: Marcos Oliveira"
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] focus:outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label htmlFor="pdp-q-text" className="block font-semibold text-[#14231A] mb-1">
                    Sua dúvida sobre {product.name} *
                  </label>
                  <textarea
                    id="pdp-q-text"
                    rows={3}
                    required
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Ex: Qual a voltagem ou medida de encaixe?"
                    className="w-full p-2.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] focus:outline-none focus:border-[#166534]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={qSubmitting}
                  className="w-full h-9 rounded-lg bg-[#166534] hover:bg-[#15803D] disabled:opacity-50 text-white font-semibold cursor-pointer"
                >
                  {qSubmitting ? 'Enviando...' : 'Enviar Pergunta para Análise'}
                </button>
              </form>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="border-t border-[#E2E8E4] pt-6">
              <h3 className="font-display text-lg font-semibold text-[#14231A] mb-4">
                Produtos Relacionados
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((rel) => {
                  const relEval = evaluateProductPrice(rel, settings);
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectProduct(rel)}
                      className="text-left rounded-xl border border-[#E2E8E4] bg-white hover:border-[#166534] p-3 transition-colors cursor-pointer flex flex-col justify-between"
                    >
                      <div className="aspect-[4/3] w-full bg-[#F1F5F2] rounded-lg overflow-hidden mb-2">
                        <ProductImage
                          src={rel.images[0]}
                          alt={`${rel.name} — ${rel.category} AGROLEITE`}
                          sku={rel.sku}
                          className="w-full h-full object-contain p-2 bg-white"
                        />
                      </div>
                      <div className="text-xs font-semibold text-[#14231A] line-clamp-2">
                        {rel.name}
                      </div>
                      <div className="mt-1.5 text-sm font-bold text-[#166534] font-mono-num">
                        {relEval.displayPrice !== null
                          ? formatBRLWithSymbol(relEval.displayPrice)
                          : 'Consulte no WhatsApp'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
