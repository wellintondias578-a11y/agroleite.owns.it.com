import { ArrowRight, MessageCircle } from 'lucide-react';
import { buildWhatsAppSupportMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import type { StoreSettings } from '../types/store';

interface HeroSectionProps {
  settings: StoreSettings;
  totalProducts: number;
  onExploreCatalog: () => void;
  onSelectCategory: (category: string) => void;
}

export function HeroSection({
  settings,
  totalProducts,
  onExploreCatalog,
  onSelectCategory,
}: HeroSectionProps) {
  const whatsappSupportHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSupportMessage()
  );

  return (
    <section className="bg-white border-b border-[#E2E8E4]">
      {/* Hero Split */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-[#4A5D52]">
              <span>Equipamentos para Pecuária Leiteira</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">{totalProducts} itens catalogados</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#14231A] leading-[1.12] [text-wrap:balance]">
              Ordenhadeiras e peças de reposição com preço competitivo
            </h1>

            <p className="text-base text-[#4A5D52] leading-relaxed max-w-xl">
              Linha completa de ordenhadeiras inox, modelos a gasolina, transferidores de leite,
              teteiras, coletores e pulsadores. Monte seu carrinho e finalize seu pedido
              diretamente pelo WhatsApp com atendimento técnico.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={whatsappSupportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] hover:bg-[#F1F5F2] text-[#14231A] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 text-[#166534]" />
                <span>Atendimento WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Hero Photography */}
          <div className="lg:col-span-6">
            <div className="relative w-full h-64 sm:h-80 lg:h-full min-h-[300px] rounded-xl overflow-hidden border border-[#E2E8E4] bg-[#F1F5F2]">
              <img
                src="/src/assets/images/hero_agroleite_dairy_1795562327189.jpg"
                alt="Sala de ordenha moderna com ordenhadeiras e tarros em aço inox"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 text-white">
                <p className="text-xs font-medium text-white/85">
                  Atendimento para todo o Brasil · {settings.whatsappDisplay}
                </p>
                <p className="font-display text-lg font-semibold mt-0.5">
                  Sistemas completos e reposição imediata para sua propriedade
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Visual Category Spotlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-[#E2E8E4]">
          <button
            type="button"
            onClick={() => onSelectCategory('Ordenhadeiras Inox')}
            className="group text-left rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] hover:bg-white hover:shadow-sm transition-all overflow-hidden flex items-center gap-4 p-3 cursor-pointer"
          >
            <img
              src="/src/assets/images/showcase_ordenhadeira_inox_1795562327222.jpg"
              alt="Ordenhadeiras Inox"
              loading="lazy"
              decoding="async"
              className="w-24 h-20 object-cover rounded-lg shrink-0 bg-white"
            />
            <div className="min-w-0">
              <div className="text-xs text-[#4A5D52]">Linha Elétrica</div>
              <div className="font-display text-base font-semibold text-[#14231A] group-hover:text-[#166534] transition-colors">
                Ordenhadeiras Inox
              </div>
              <div className="text-xs text-[#166534] font-medium mt-1">Ver modelos →</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategory('Ordenhadeira Carrelo Gasolina')}
            className="group text-left rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] hover:bg-white hover:shadow-sm transition-all overflow-hidden flex items-center gap-4 p-3 cursor-pointer"
          >
            <img
              src="/src/assets/images/showcase_ordenhadeira_gasolina_1795562328422.jpg"
              alt="Ordenhadeiras a Gasolina"
              loading="lazy"
              decoding="async"
              className="w-24 h-20 object-cover rounded-lg shrink-0 bg-white"
            />
            <div className="min-w-0">
              <div className="text-xs text-[#4A5D52]">Autonomia no Curral</div>
              <div className="font-display text-base font-semibold text-[#14231A] group-hover:text-[#166534] transition-colors">
                Modelos a Gasolina
              </div>
              <div className="text-xs text-[#166534] font-medium mt-1">Ver modelos →</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategory('Peças e Acessórios')}
            className="group text-left rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] hover:bg-white hover:shadow-sm transition-all overflow-hidden flex items-center gap-4 p-3 cursor-pointer"
          >
            <img
              src="/src/assets/images/showcase_pecas_reposicao_1795562327003.jpg"
              alt="Peças, Teteiras e Coletores"
              loading="lazy"
              decoding="async"
              className="w-24 h-20 object-cover rounded-lg shrink-0 bg-white"
            />
            <div className="min-w-0">
              <div className="text-xs text-[#4A5D52]">Reposição Completa</div>
              <div className="font-display text-base font-semibold text-[#14231A] group-hover:text-[#166534] transition-colors">
                Peças, Teteiras e Coletores
              </div>
              <div className="text-xs text-[#166534] font-medium mt-1">Ver catálogo →</div>
            </div>
          </button>
        </div>

        {/* Commercial Trust Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E2E8E4]">
          <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] px-4 py-3">
            <div className="text-xs font-bold text-[#14231A]">Atendimento técnico pelo WhatsApp</div>
            <p className="text-xs text-[#4A5D52] mt-0.5 leading-relaxed">
              Tire dúvidas sobre compatibilidade, peças e voltagem diretamente com nossa equipe antes de comprar.
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] px-4 py-3">
            <div className="text-xs font-bold text-[#14231A]">Compra acompanhada pela equipe</div>
            <p className="text-xs text-[#4A5D52] mt-0.5 leading-relaxed">
              Cada pedido é conferido individualmente antes da confirmação final e do pagamento.
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] px-4 py-3">
            <div className="text-xs font-bold text-[#14231A]">Entregas e preços transparentes</div>
            <p className="text-xs text-[#4A5D52] mt-0.5 leading-relaxed">
              Envio para todo o Brasil com cálculo de frete pelo CEP e condições claras informadas no atendimento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
