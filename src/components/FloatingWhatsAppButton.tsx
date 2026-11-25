import { MessageCircle } from 'lucide-react';
import { buildWhatsAppSupportMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import type { StoreSettings } from '../types/store';

interface FloatingWhatsAppButtonProps {
  settings: StoreSettings;
  hidden?: boolean;
}

export function FloatingWhatsAppButton({ settings, hidden = false }: FloatingWhatsAppButtonProps) {
  if (hidden) return null;

  const href = buildWhatsAppUrl(settings.whatsappNumber, buildWhatsAppSupportMessage());

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Atendimento via WhatsApp ${settings.whatsappDisplay}`}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 inline-flex items-center gap-2.5 h-12 px-4 rounded-full bg-[#128C7E] hover:bg-[#0F766E] text-white shadow-lg border border-white/20 transition-transform hover:-translate-y-0.5 text-sm font-semibold"
    >
      <MessageCircle className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">WhatsApp</span>
    </a>
  );
}
