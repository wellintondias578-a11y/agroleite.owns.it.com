import { Heart, MessageCircle, PackageCheck, ShieldCheck, User, X } from 'lucide-react';
import type { StoreSettings } from '../types/store';
import { buildWhatsAppSupportMessage, buildWhatsAppUrl } from '../utils/whatsapp';

interface AccountModalProps {
  open: boolean;
  settings: StoreSettings;
  ordersCount: number;
  wishlistCount: number;
  onClose: () => void;
  onOpenOrders: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
}

export function AccountModal({
  open,
  settings,
  ordersCount,
  wishlistCount,
  onClose,
  onOpenOrders,
  onOpenWishlist,
  onOpenAdmin,
}: AccountModalProps) {
  if (!open) return null;

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSupportMessage()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Minha Conta e Acesso Rápido"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-[#E2E8E4] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#166534]" />
            <h2 className="font-display text-lg font-bold text-[#14231A]">Área do Cliente</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar área do cliente"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-[#4A5D52] leading-relaxed">
            Na AGROLEITE você compra sem precisar criar senha nem cadastro prévio: seus pedidos são
            gerados no carrinho e finalizados diretamente pelo WhatsApp oficial.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrders();
              }}
              className="w-full p-3.5 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] hover:border-[#166534] flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <PackageCheck className="w-4 h-4 text-[#166534]" />
                <div>
                  <div className="font-semibold text-[#14231A]">Meus Pedidos</div>
                  <div className="text-[#4A5D52]">Consultar solicitações enviadas</div>
                </div>
              </div>
              <span className="font-mono-num font-bold text-[#166534]">{ordersCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWishlist();
              }}
              className="w-full p-3.5 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] hover:border-[#166534] flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-[#166534]" />
                <div>
                  <div className="font-semibold text-[#14231A]">Lista de Desejos</div>
                  <div className="text-[#4A5D52]">Equipamentos e peças salvos</div>
                </div>
              </div>
              <span className="font-mono-num font-bold text-[#166534]">{wishlistCount}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3.5 rounded-xl border border-[#E2E8E4] bg-[#F8FAF8] hover:border-[#128C7E] flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                <div>
                  <div className="font-semibold text-[#14231A]">Atendimento pelo WhatsApp</div>
                  <div className="text-[#4A5D52]">{settings.whatsappDisplay}</div>
                </div>
              </div>
              <span className="text-[#128C7E] font-semibold">Abrir</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="w-full p-3.5 rounded-xl border border-[#E2E8E4] bg-white hover:bg-[#F8FAF8] flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#4A5D52]" />
                <div>
                  <div className="font-semibold text-[#14231A]">Painel Administrativo</div>
                  <div className="text-[#4A5D52]">Acesso restrito para gestão da loja</div>
                </div>
              </div>
              <span className="text-[#4A5D52] font-semibold">Entrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
