import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import type { CategoryDefinition } from '../types/store';

interface HeaderProps {
  cartCount: number;
  activeView: 'store' | 'admin';
  onNavigateHome: () => void;
  onSelectCategory: (category: string) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  categories: CategoryDefinition[];
}

export function Header({
  cartCount,
  activeView,
  onNavigateHome,
  onSelectCategory,
  onOpenCart,
  onOpenAdmin,
  categories,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCatClick = (catName: string) => {
    setMobileMenuOpen(false);
    onSelectCategory(catName);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E2E8E4]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de categorias"
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 -ml-2 rounded-lg text-[#14231A] hover:bg-[#F1F5F2] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="#inicio"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="font-display text-xl font-bold tracking-tight text-[#166534] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#166534]"
            >
              AGROLEITE
            </a>
          </div>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#4A5D52]"
          >
            <button
              type="button"
              onClick={() => handleCatClick('Ordenhadeiras Inox')}
              className="hover:text-[#166534] transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              Ordenhadeiras
            </button>
            <button
              type="button"
              onClick={() => handleCatClick('Transferidor de Leite e Unidade Final')}
              className="hover:text-[#166534] transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              Transferidores
            </button>
            <button
              type="button"
              onClick={() => handleCatClick('Teteiras')}
              className="hover:text-[#166534] transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              Teteiras
            </button>
            <button
              type="button"
              onClick={() => handleCatClick('Peças e Acessórios')}
              className="hover:text-[#166534] transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              Peças e Acessórios
            </button>
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeView === 'admin'
                  ? 'text-[#166534] font-semibold underline underline-offset-4'
                  : 'hover:text-[#166534]'
              }`}
            >
              Painel Admin
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Abrir carrinho com ${cartCount} itens`}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Carrinho</span>
              <span className="font-mono-num">({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-80 max-w-[85vw] bg-white h-full shadow-xl flex flex-col z-10">
            <div className="px-5 h-16 border-b border-[#E2E8E4] flex items-center justify-between">
              <span className="font-display text-lg font-bold text-[#166534]">
                AGROLEITE
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#F1F5F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateHome();
                }}
                className="w-full text-left px-3 py-3 rounded-lg text-sm font-semibold text-[#14231A] hover:bg-[#F1F5F2]"
              >
                Início · Todos os Produtos
              </button>
              <div className="pt-2 pb-1 px-3 text-xs font-semibold text-[#4A5D52] uppercase tracking-wider">
                Categorias
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCatClick(cat.name)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#14231A] hover:bg-[#F1F5F2]"
                >
                  {cat.name}
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-[#E2E8E4]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full text-left px-3 py-3 rounded-lg text-sm font-semibold text-[#166534] bg-[#F1F5F2] hover:bg-[#E5ECE7]"
                >
                  Painel Administrativo
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
