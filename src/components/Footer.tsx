import { useState } from 'react';
import {
  ChevronDown,
  Facebook,
  Instagram,
  Lock,
  MessageCircle,
  ShieldCheck,
  Youtube,
} from 'lucide-react';
import { DEFAULT_ACCEPTED_PAYMENT_METHODS, DEFAULT_SOCIAL_LINKS } from '../data/storeContent';
import type { CategoryDefinition, StoreSettings } from '../types/store';
import { buildWhatsAppSupportMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import type { InfoModalTopic } from './InfoContentModal';

interface FooterProps {
  settings: StoreSettings;
  categories: CategoryDefinition[];
  onSelectCategory: (category: string) => void;
  onNavigateHome: () => void;
  onOpenAdmin: () => void;
  onOpenOrders: () => void;
  onScrollToFaq: () => void;
  onOpenInfoModal: (topic: Exclude<InfoModalTopic, null>) => void;
}

type FooterGroupKey = 'sobre' | 'atendimento' | 'institucional' | 'social';

export function Footer({
  settings,
  onNavigateHome,
  onOpenAdmin,
  onOpenOrders,
  onScrollToFaq,
  onOpenInfoModal,
}: FooterProps) {
  const [openMobileGroup, setOpenMobileGroup] = useState<FooterGroupKey | null>('sobre');

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSupportMessage()
  );

  const paymentMethods = settings.acceptedPaymentMethods || DEFAULT_ACCEPTED_PAYMENT_METHODS;
  const socialLinks = settings.socialLinks || DEFAULT_SOCIAL_LINKS;
  const currentYear = new Date().getFullYear();
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const toggleGroup = (key: FooterGroupKey) => {
    setOpenMobileGroup((curr) => (curr === key ? null : key));
  };

  const enabledPayments: Array<{ key: string; label: string; badgeClass: string }> = [];
  if (paymentMethods.pix) {
    enabledPayments.push({
      key: 'pix',
      label: 'PIX',
      badgeClass: 'bg-[#128C7E]/25 border-[#128C7E] text-white',
    });
  }
  if (paymentMethods.visa) {
    enabledPayments.push({
      key: 'visa',
      label: 'VISA',
      badgeClass: 'bg-white/10 border-white/25 text-white',
    });
  }
  if (paymentMethods.mastercard) {
    enabledPayments.push({
      key: 'mastercard',
      label: 'MASTERCARD',
      badgeClass: 'bg-white/10 border-white/25 text-white',
    });
  }
  if (paymentMethods.elo) {
    enabledPayments.push({
      key: 'elo',
      label: 'ELO',
      badgeClass: 'bg-white/10 border-white/25 text-white',
    });
  }
  if (paymentMethods.hipercard) {
    enabledPayments.push({
      key: 'hipercard',
      label: 'HIPERCARD',
      badgeClass: 'bg-white/10 border-white/25 text-white',
    });
  }
  if (paymentMethods.amex) {
    enabledPayments.push({
      key: 'amex',
      label: 'AMEX',
      badgeClass: 'bg-white/10 border-white/25 text-white',
    });
  }
  if (paymentMethods.boleto) {
    enabledPayments.push({
      key: 'boleto',
      label: 'BOLETO',
      badgeClass: 'bg-white/10 border-white/25 text-white',
    });
  }

  return (
    <footer className="bg-[#14231A] text-white mt-12 border-t border-[#22382B]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Top Brand & Columns (Expandable Accordions on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="font-display text-xl font-bold tracking-tight text-white cursor-pointer"
            >
              AGROLEITE
            </button>
            <p className="text-xs text-white/75 leading-relaxed">
              Loja agropecuária especializada em ordenhadeiras, sistemas de transferência de leite,
              teteiras e peças de reposição para pecuária leiteira.
            </p>
            <div className="text-xs text-white/80 space-y-0.5">
              <div>{settings.supportCityState}</div>
              <div>{settings.supportHours}</div>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              Conte com nossa equipe para encontrar o equipamento ideal. Tire suas dúvidas antes de finalizar seu pedido:
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#128C7E] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp {settings.whatsappDisplay}</span>
            </a>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* SOBRE NÓS */}
            <div className="border-b border-white/10 pb-3 lg:border-0 lg:pb-0">
              <button
                type="button"
                onClick={() => toggleGroup('sobre')}
                aria-expanded={openMobileGroup === 'sobre'}
                className="w-full flex items-center justify-between lg:cursor-default text-left"
              >
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  SOBRE NÓS
                </h3>
                <ChevronDown
                  className={`w-4 h-4 lg:hidden transition-transform ${
                    openMobileGroup === 'sobre' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <ul
                className={`mt-3 space-y-2 text-xs text-white/75 ${
                  openMobileGroup === 'sobre' ? 'block' : 'hidden lg:block'
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenInfoModal('sobre-agroleite')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Conheça a AGROLEITE
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenInfoModal('nossa-loja')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Nossa loja
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Nossos produtos
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer pt-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Painel Administrativo</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* ATENDIMENTO */}
            <div className="border-b border-white/10 pb-3 lg:border-0 lg:pb-0">
              <button
                type="button"
                onClick={() => toggleGroup('atendimento')}
                aria-expanded={openMobileGroup === 'atendimento'}
                className="w-full flex items-center justify-between lg:cursor-default text-left"
              >
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  ATENDIMENTO
                </h3>
                <ChevronDown
                  className={`w-4 h-4 lg:hidden transition-transform ${
                    openMobileGroup === 'atendimento' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <ul
                className={`mt-3 space-y-2 text-xs text-white/75 ${
                  openMobileGroup === 'atendimento' ? 'block' : 'hidden lg:block'
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenInfoModal('fale-conosco')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Fale conosco
                  </button>
                </li>
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Atendimento pelo WhatsApp
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onScrollToFaq}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Dúvidas frequentes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenOrders}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Informações sobre pedidos
                  </button>
                </li>
              </ul>
            </div>

            {/* INSTITUCIONAL */}
            <div className="border-b border-white/10 pb-3 lg:border-0 lg:pb-0">
              <button
                type="button"
                onClick={() => toggleGroup('institucional')}
                aria-expanded={openMobileGroup === 'institucional'}
                className="w-full flex items-center justify-between lg:cursor-default text-left"
              >
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  INSTITUCIONAL
                </h3>
                <ChevronDown
                  className={`w-4 h-4 lg:hidden transition-transform ${
                    openMobileGroup === 'institucional' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <ul
                className={`mt-3 space-y-2 text-xs text-white/75 ${
                  openMobileGroup === 'institucional' ? 'block' : 'hidden lg:block'
                }`}
              >
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenInfoModal('privacidade')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Política de privacidade
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenInfoModal('trocas-devolucoes')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Política de trocas e devoluções
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenInfoModal('termos-uso')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Termos de uso
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onScrollToFaq}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Perguntas frequentes
                  </button>
                </li>
              </ul>
            </div>

            {/* REDES SOCIAIS */}
            <div className="border-b border-white/10 pb-3 lg:border-0 lg:pb-0">
              <button
                type="button"
                onClick={() => toggleGroup('social')}
                aria-expanded={openMobileGroup === 'social'}
                className="w-full flex items-center justify-between lg:cursor-default text-left"
              >
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  REDES SOCIAIS
                </h3>
                <ChevronDown
                  className={`w-4 h-4 lg:hidden transition-transform ${
                    openMobileGroup === 'social' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <ul
                className={`mt-3 space-y-2.5 text-xs text-white/75 ${
                  openMobileGroup === 'social' ? 'block' : 'hidden lg:block'
                }`}
              >
                <li>
                  {socialLinks.instagramUrl ? (
                    <a
                      href={socialLinks.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Instagram</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-white/50">
                      <Instagram className="w-4 h-4" />
                      <span>Instagram (em configuração)</span>
                    </span>
                  )}
                </li>
                <li>
                  {socialLinks.facebookUrl ? (
                    <a
                      href={socialLinks.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-white/50">
                      <Facebook className="w-4 h-4" />
                      <span>Facebook (em configuração)</span>
                    </span>
                  )}
                </li>
                <li>
                  {socialLinks.youtubeUrl ? (
                    <a
                      href={socialLinks.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>YouTube</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-white/50">
                      <Youtube className="w-4 h-4" />
                      <span>YouTube (em configuração)</span>
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Methods & Trust/Security Strip */}
        <div className="pt-8 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-2.5">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">
              FORMAS DE PAGAMENTO HABILITADAS
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {enabledPayments.map((pm) => (
                <span
                  key={pm.key}
                  className={`px-3 py-1.5 rounded-md border text-[11px] font-bold font-mono-num tracking-wide ${pm.badgeClass}`}
                >
                  {pm.label}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-white/60">
              PIX com 5% adicional nos itens elegíveis (≥ R$ 1.000,00). Demais formas de pagamento
              habilitadas são confirmadas com nossa equipe durante o atendimento pelo WhatsApp.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">
              SEGURANÇA E TRANSPARÊNCIA
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-white/80">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Lock className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span>
                  {isHttps
                    ? 'Navegação segura HTTPS ativa'
                    : 'Navegação protegida (HTTPS recomendado em produção)'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span>Proteção das informações</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span>Atendimento ao comprador</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span>Transparência nas condições de compra</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/65 text-center sm:text-left">
          <span>
            © {currentYear} AGROLEITE — Equipamentos, peças e soluções para a produção leiteira.
            {settings.companyLegalInfo ? ` · ${settings.companyLegalInfo}` : ''}
          </span>
          <span>
            Transparência nos preços e nas condições de pagamento · Faça seu pedido de maneira simples e receba atendimento pelo WhatsApp.
          </span>
        </div>
      </div>
    </footer>
  );
}
