import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryDefinition } from '../types/store';

interface CatalogSidebarProps {
  categories: CategoryDefinition[];
  selectedCategory: string;
  selectedSubcategory: string;
  categoryCounts: Record<string, number>;
  subcategoryCounts: Record<string, number>;
  minPrice: string;
  maxPrice: string;
  onlyAvailable: boolean;
  onSelectCategory: (category: string, subcategory?: string) => void;
  onChangePriceRange: (min: string, max: string) => void;
  onToggleAvailable: (val: boolean) => void;
  onResetFilters: () => void;
}

export function CatalogSidebar({
  categories,
  selectedCategory,
  selectedSubcategory,
  categoryCounts,
  subcategoryCounts,
  minPrice,
  maxPrice,
  onlyAvailable,
  onSelectCategory,
  onChangePriceRange,
  onToggleAvailable,
  onResetFilters,
}: CatalogSidebarProps) {
  const [partsExpanded, setPartsExpanded] = useState(
    selectedCategory === 'Peças e Acessórios' || Boolean(selectedSubcategory)
  );

  const pecasCat = categories.find((c) => c.name === 'Peças e Acessórios');
  const subcategories = pecasCat?.subcategories || [];

  return (
    <aside className="space-y-6">
      {/* Categories Tree */}
      <div className="bg-white rounded-xl border border-[#E2E8E4] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold text-[#14231A]">
            Categorias
          </h2>
          {(selectedCategory !== 'Todas' || selectedSubcategory) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-medium text-[#166534] hover:underline cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        <ul className="space-y-1 text-sm">
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('Todas')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                selectedCategory === 'Todas'
                  ? 'bg-[#166534] text-white font-semibold'
                  : 'text-[#14231A] hover:bg-[#F1F5F2]'
              }`}
            >
              <span>Todos os Produtos</span>
              <span className="text-xs font-mono-num opacity-80">
                {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
              </span>
            </button>
          </li>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name && !selectedSubcategory;
            const isParts = cat.name === 'Peças e Acessórios';
            const count = categoryCounts[cat.name] || 0;

            return (
              <li key={cat.id}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name);
                      if (isParts) setPartsExpanded(true);
                    }}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#166534] text-white font-semibold'
                        : selectedCategory === cat.name
                        ? 'bg-[#F1F5F2] text-[#166534] font-semibold'
                        : 'text-[#14231A] hover:bg-[#F1F5F2]'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="text-xs font-mono-num opacity-75 shrink-0">
                      {count}
                    </span>
                  </button>
                  {isParts && (
                    <button
                      type="button"
                      onClick={() => setPartsExpanded((v) => !v)}
                      aria-label="Expandir subcategorias de Peças e Acessórios"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#F1F5F2] shrink-0 cursor-pointer"
                    >
                      {partsExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {isParts && partsExpanded && (
                  <ul className="mt-1 ml-3 pl-3 border-l border-[#E2E8E4] space-y-0.5 max-h-80 overflow-y-auto">
                    {subcategories.map((sub) => {
                      const subCount = subcategoryCounts[sub] || 0;
                      const isSubActive =
                        selectedCategory === 'Peças e Acessórios' &&
                        selectedSubcategory === sub;
                      return (
                        <li key={sub}>
                          <button
                            type="button"
                            onClick={() => onSelectCategory('Peças e Acessórios', sub)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer ${
                              isSubActive
                                ? 'bg-[#166534] text-white font-semibold'
                                : 'text-[#4A5D52] hover:bg-[#F1F5F2] hover:text-[#14231A]'
                            }`}
                          >
                            <span className="truncate pr-2">{sub}</span>
                            <span className="font-mono-num opacity-75 shrink-0">
                              {subCount}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price & Availability Filter */}
      <div className="bg-white rounded-xl border border-[#E2E8E4] p-4 space-y-4">
        <h2 className="font-display text-sm font-bold text-[#14231A]">
          Faixa de Preço (R$)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-min-price" className="block text-[11px] text-[#4A5D52] mb-1">
              Mínimo
            </label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              placeholder="0"
              value={minPrice}
              onChange={(e) => onChangePriceRange(e.target.value, maxPrice)}
              className="w-full h-9 px-2.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs font-mono-num focus:outline-none focus:border-[#166534]"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="block text-[11px] text-[#4A5D52] mb-1">
              Máximo
            </label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              placeholder="15000"
              value={maxPrice}
              onChange={(e) => onChangePriceRange(minPrice, e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-xs font-mono-num focus:outline-none focus:border-[#166534]"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 pt-2 border-t border-[#F1F5F2] text-xs text-[#14231A] cursor-pointer">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => onToggleAvailable(e.target.checked)}
            className="w-4 h-4 accent-[#166534] rounded"
          />
          <span>Somente itens disponíveis</span>
        </label>
      </div>
    </aside>
  );
}
