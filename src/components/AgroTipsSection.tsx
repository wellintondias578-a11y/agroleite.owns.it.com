import { useState } from 'react';
import { ArrowRight, BookOpen, X } from 'lucide-react';
import { AGRO_ARTICLES, type AgroArticle } from '../data/storeContent';

interface AgroTipsSectionProps {
  onSelectCategory: (category: string) => void;
}

export function AgroTipsSection({ onSelectCategory }: AgroTipsSectionProps) {
  const [activeArticle, setActiveArticle] = useState<AgroArticle | null>(null);

  return (
    <section
      id="dicas-produtor"
      aria-labelledby="agro-tips-title"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 border-t border-[#E2E8E4]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Conteúdo Técnico e Cuidados no Curral</span>
          </div>
          <h2 id="agro-tips-title" className="font-display text-2xl font-bold text-[#14231A]">
            Dicas e informações para o produtor rural
          </h2>
          <p className="text-sm text-[#4A5D52] mt-0.5">
            Orientações práticas sobre ordenhadeiras, bombas de vácuo, teteiras, limpeza e escolha de equipamentos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {AGRO_ARTICLES.map((article) => (
          <article
            key={article.id}
            className="bg-white rounded-xl border border-[#E2E8E4] overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm transition-all"
          >
            <div>
              <button
                type="button"
                onClick={() => setActiveArticle(article)}
                className="block w-full aspect-[16/10] bg-[#F1F5F2] overflow-hidden cursor-pointer"
              >
                <img
                  src={article.image}
                  alt={article.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#4A5D52]">
                  <span className="font-semibold text-[#166534]">{article.topic}</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="font-display text-sm font-bold text-[#14231A] leading-snug line-clamp-2">
                  <button
                    type="button"
                    onClick={() => setActiveArticle(article)}
                    className="text-left hover:text-[#166534] transition-colors cursor-pointer"
                  >
                    {article.title}
                  </button>
                </h3>
                <p className="text-xs text-[#4A5D52] line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveArticle(article)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] hover:underline cursor-pointer"
              >
                <span>Ler orientações</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectCategory(article.categoryTarget)}
                className="text-[11px] font-medium text-[#4A5D52] hover:text-[#166534] cursor-pointer truncate max-w-[130px]"
              >
                Ver linha →
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={activeArticle.title}
        >
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold text-[#166534] uppercase tracking-wider">
                  {activeArticle.topic} · {activeArticle.readTime}
                </div>
                <h3 className="font-display text-lg font-bold text-[#14231A] mt-0.5">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Fechar artigo"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="aspect-[16/9] rounded-xl overflow-hidden border border-[#E2E8E4] bg-[#F1F5F2]">
                <img
                  src={activeArticle.image}
                  alt={activeArticle.imageAlt}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-sm text-[#14231A] font-medium leading-relaxed">
                {activeArticle.summary}
              </p>

              <div className="space-y-4">
                {activeArticle.sections.map((sec) => (
                  <div key={sec.heading} className="space-y-1.5">
                    <h4 className="font-display text-base font-bold text-[#14231A]">
                      {sec.heading}
                    </h4>
                    <p className="text-sm text-[#4A5D52] leading-relaxed">{sec.body}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E2E8E4] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#4A5D52]">
                  Conteúdo informativo AGROLEITE · Consulte nossa equipe técnica em caso de dúvida específica.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const target = activeArticle.categoryTarget;
                    setActiveArticle(null);
                    onSelectCategory(target);
                  }}
                  className="h-10 px-4 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Explorar {activeArticle.categoryTarget}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
