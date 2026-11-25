import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { FaqItem } from '../types/store';

interface FaqSectionProps {
  items: FaqItem[];
}

export function FaqSection({ items }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  if (!items || items.length === 0) return null;

  return (
    <section
      id="perguntas-frequentes"
      aria-labelledby="faq-section-title"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 border-t border-[#E2E8E4]"
    >
      <div className="max-w-3xl mb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] uppercase tracking-wider mb-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tire suas dúvidas</span>
        </div>
        <h2 id="faq-section-title" className="font-display text-2xl font-bold text-[#14231A]">
          Perguntas Frequentes
        </h2>
        <p className="text-sm text-[#4A5D52] mt-0.5">
          Informações claras sobre compra, pagamento, envio pelo WhatsApp, frete, garantias e escolha de equipamentos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#E2E8E4] bg-white overflow-hidden h-fit"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 hover:bg-[#F8FAF8] transition-colors cursor-pointer"
              >
                <div>
                  <span className="block text-[11px] font-semibold text-[#166534]">
                    {item.topic}
                  </span>
                  <span className="font-display text-sm font-bold text-[#14231A]">
                    {item.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#4A5D52] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#4A5D52] leading-relaxed border-t border-[#F1F5F2]">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
