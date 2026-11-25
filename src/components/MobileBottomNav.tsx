import { Heart, MessageCircle, PackageCheck, Search, User } from 'lucide-react';

interface MobileBottomNavProps {
  wishlistCount: number;
  onContact: () => void;
  onAccount: () => void;
  onOrders: () => void;
  onWishlist: () => void;
  onSearch: () => void;
}

export function MobileBottomNav({
  wishlistCount,
  onContact,
  onAccount,
  onOrders,
  onWishlist,
  onSearch,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Atalhos rápidos mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#E2E8E4] shadow-[0_-4px_16px_rgba(20,35,26,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        <button
          type="button"
          onClick={onContact}
          className="flex flex-col items-center justify-center gap-1 text-[#4A5D52] hover:text-[#166534] active:bg-[#F1F5F2] transition-colors cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-none">Contato</span>
        </button>

        <button
          type="button"
          onClick={onAccount}
          className="flex flex-col items-center justify-center gap-1 text-[#4A5D52] hover:text-[#166534] active:bg-[#F1F5F2] transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-none">Conta</span>
        </button>

        <button
          type="button"
          onClick={onOrders}
          className="flex flex-col items-center justify-center gap-1 text-[#4A5D52] hover:text-[#166534] active:bg-[#F1F5F2] transition-colors cursor-pointer"
        >
          <PackageCheck className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-none">Pedidos</span>
        </button>

        <button
          type="button"
          onClick={onWishlist}
          className="relative flex flex-col items-center justify-center gap-1 text-[#4A5D52] hover:text-[#166534] active:bg-[#F1F5F2] transition-colors cursor-pointer"
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#166534] text-white text-[9px] font-bold font-mono-num inline-flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">Desejos</span>
        </button>

        <button
          type="button"
          onClick={onSearch}
          className="flex flex-col items-center justify-center gap-1 text-[#4A5D52] hover:text-[#166534] active:bg-[#F1F5F2] transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-none">Buscar</span>
        </button>
      </div>
    </nav>
  );
}
