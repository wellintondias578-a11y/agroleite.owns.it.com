import { useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, MessageSquarePlus, Star, X } from 'lucide-react';
import type { CustomerReview } from '../types/store';

interface CustomerReviewsSectionProps {
  reviews: CustomerReview[];
}

export function CustomerReviewsSection({ reviews }: CustomerReviewsSectionProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorizeName, setAuthorizeName] = useState(true);
  const [cityState, setCityState] = useState('');
  const [authorizeLocation, setAuthorizeLocation] = useState(true);
  const [productName, setProductName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const total = reviews.length;
  const maxStart = Math.max(0, total - 1);
  const safeIndex = Math.min(carouselIndex, maxStart);

  const handlePrev = () => {
    setCarouselIndex((i) => (i <= 0 ? maxStart : i - 1));
  };

  const handleNext = () => {
    setCarouselIndex((i) => (i >= maxStart ? 0 : i + 1));
  };

  const visibleReviews =
    total <= 3
      ? reviews
      : [
          reviews[safeIndex % total],
          reviews[(safeIndex + 1) % total],
          reviews[(safeIndex + 2) % total],
        ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (comment.trim().length < 10) {
      setFormError('Escreva um comentário com pelo menos 10 caracteres sobre sua experiência.');
      return;
    }
    if (authorizeName && authorName.trim().length < 2) {
      setFormError('Informe seu nome ou desmarque a autorização de exibição do nome.');
      return;
    }
    if (authorizeLocation && cityState.trim().length < 3) {
      setFormError('Informe sua cidade/estado ou desmarque a autorização de exibição da localização.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          authorName: authorName.trim(),
          authorizeName,
          cityState: cityState.trim(),
          authorizeLocation,
          productName: productName.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setFormError(data.error || 'Não foi possível enviar sua avaliação.');
        return;
      }
      setFormSuccess(
        data.message ||
          'Avaliação enviada para análise administrativa. Obrigado por compartilhar!'
      );
      setComment('');
      setProductName('');
    } catch {
      setFormError('Erro de conexão ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="avaliacoes"
      aria-labelledby="reviews-section-title"
      className="bg-white border-t border-[#E2E8E4]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2
              id="reviews-section-title"
              className="font-display text-2xl font-bold text-[#14231A]"
            >
              Quem já comprou e recomenda
            </h2>
            <p className="text-sm text-[#4A5D52] mt-0.5">
              Avaliações reais enviadas por clientes e verificadas pela equipe AGROLEITE antes da publicação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {total > 1 && (
              <div className="inline-flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Avaliação anterior"
                  className="w-10 h-10 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] hover:bg-[#F1F5F2] inline-flex items-center justify-center text-[#14231A] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Próxima avaliação"
                  className="w-10 h-10 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] hover:bg-[#F1F5F2] inline-flex items-center justify-center text-[#14231A] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setFormError('');
                setFormSuccess('');
                setModalOpen(true);
              }}
              className="h-10 px-4 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Enviar minha avaliação</span>
            </button>
          </div>
        </div>

        {total === 0 ? (
          <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] p-8 text-center space-y-3">
            <div className="inline-flex items-center gap-1 text-[#D97706]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <h3 className="font-display text-base font-bold text-[#14231A]">
              Ainda não há avaliações publicadas
            </h3>
            <p className="text-xs sm:text-sm text-[#4A5D52] max-w-lg mx-auto leading-relaxed">
              Comprou na AGROLEITE? Compartilhe sua experiência real com nossos equipamentos, peças
              e atendimento pelo WhatsApp. Todas as avaliações passam por aprovação administrativa
              antes de aparecerem aqui.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-1 h-10 px-5 rounded-lg border border-[#166534] text-[#166534] hover:bg-[#166534] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Compartilhar minha experiência
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {visibleReviews.map((rev, idx) => (
              <article
                key={`${rev.id}-${idx}`}
                className={`rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] p-5 flex flex-col justify-between gap-4 ${
                  idx > 0 ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="inline-flex items-center gap-0.5 text-[#D97706]"
                      aria-label={`Avaliação ${rev.rating} de 5 estrelas`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating ? 'fill-current' : 'text-[#CBD5CE]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#4A5D52] font-mono-num">
                      {new Date(rev.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-sm text-[#14231A] leading-relaxed">“{rev.comment}”</p>
                </div>

                <div className="pt-3 border-t border-[#E2E8E4] text-xs">
                  <div className="font-semibold text-[#14231A]">
                    {rev.authorizeName ? rev.authorName : 'Cliente AGROLEITE'}
                  </div>
                  {rev.authorizeLocation && rev.cityState && (
                    <div className="text-[#4A5D52] mt-0.5">{rev.cityState}</div>
                  )}
                  {rev.productName && (
                    <div className="text-[11px] text-[#166534] mt-1 truncate">
                      Item: {rev.productName}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Enviar avaliação de cliente"
        >
          <div className="bg-white w-full max-w-lg max-h-[92vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#14231A]">
                  Enviar Avaliação de Compra
                </h3>
                <p className="text-xs text-[#4A5D52]">
                  Publicação condicionada à aprovação da equipe AGROLEITE
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar janela de avaliação"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg border border-[#166534]/30 bg-[#F1F5F2] text-[#166534] font-medium">
                  {formSuccess}
                </div>
              )}

              <div>
                <span className="block font-semibold text-[#14231A] mb-1.5">
                  Sua nota (1 a 5 estrelas) *
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      aria-label={`${starVal} estrelas`}
                      className="p-1.5 rounded-lg border border-[#E2E8E4] hover:border-[#D97706] cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          starVal <= rating ? 'text-[#D97706] fill-current' : 'text-[#CBD5CE]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-semibold text-[#14231A]">{rating} de 5</span>
                </div>
              </div>

              <div>
                <label htmlFor="rev-comment" className="block font-semibold text-[#14231A] mb-1">
                  Seu comentário sobre o produto ou atendimento *
                </label>
                <textarea
                  id="rev-comment"
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi sua experiência de compra na AGROLEITE..."
                  className="w-full p-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="rev-product" className="block font-semibold text-[#14231A] mb-1">
                  Equipamento ou peça adquirida (opcional)
                </label>
                <input
                  id="rev-product"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Ordenhadeira Inox ou Kit de Teteiras"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rev-name" className="block font-semibold text-[#14231A] mb-1">
                    Seu nome
                  </label>
                  <input
                    id="rev-name"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="rev-city" className="block font-semibold text-[#14231A] mb-1">
                    Cidade / Estado
                  </label>
                  <input
                    id="rev-city"
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="Ex: Patos de Minas / MG"
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorizeName}
                    onChange={(e) => setAuthorizeName(e.target.checked)}
                    className="mt-0.5 accent-[#166534]"
                  />
                  <span className="text-[#4A5D52]">
                    Autorizo exibir meu nome junto à avaliação (se desmarcado, aparecerá como &quot;Cliente AGROLEITE&quot;).
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorizeLocation}
                    onChange={(e) => setAuthorizeLocation(e.target.checked)}
                    className="mt-0.5 accent-[#166534]"
                  />
                  <span className="text-[#4A5D52]">
                    Autorizo exibir minha cidade e estado junto à avaliação.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#166534] hover:bg-[#15803D] disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
              >
                {submitting ? 'Enviando...' : 'Enviar Avaliação para Aprovação'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
