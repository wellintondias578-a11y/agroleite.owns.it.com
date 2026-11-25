import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { AccountModal } from './components/AccountModal';
import { AdminPanel } from './components/AdminPanel';
import { AgroTipsSection } from './components/AgroTipsSection';
import { CartDrawer } from './components/CartDrawer';
import { CatalogSidebar } from './components/CatalogSidebar';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { FaqSection } from './components/FaqSection';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InfoContentModal, type InfoModalTopic } from './components/InfoContentModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NewsletterSection } from './components/NewsletterSection';
import { OrdersLookupModal } from './components/OrdersLookupModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { RecentlyViewedSection } from './components/RecentlyViewedSection';
import { WhatsAppCheckoutModal } from './components/WhatsAppCheckoutModal';
import { WishlistModal } from './components/WishlistModal';
import { MAIN_CATEGORIES } from './data/categories';
import {
  DEFAULT_ACCEPTED_PAYMENT_METHODS,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_SOCIAL_LINKS,
} from './data/storeContent';
import type {
  CartItem,
  CategoryDefinition,
  CustomerReview,
  OrderRecord,
  Product,
  SortOption,
  StoreSettings,
} from './types/store';
import { evaluateProductPrice } from './utils/pricing';
import { getCleanProductSlug, updateStorefrontSeo } from './utils/seo';
import { DEFAULT_WHATSAPP_DISPLAY, DEFAULT_WHATSAPP_NUMBER } from './utils/whatsapp';

const CART_STORAGE_KEY = 'agroleite_cart_v1';
const RECENT_STORAGE_KEY = 'agroleite_recent_v1';
const WISHLIST_STORAGE_KEY = 'agroleite_wishlist_v1';
const MY_ORDERS_STORAGE_KEY = 'agroleite_my_orders_v1';
const PAGE_SIZE = 24;

const FALLBACK_SETTINGS: StoreSettings = {
  storeName: 'AGROLEITE',
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  whatsappDisplay: DEFAULT_WHATSAPP_DISPLAY,
  defaultDiscountPercent: 40,
  minMarginPercent: 10,
  requireCostApprovalToPublish: false,
  supportHours: 'Seg a Sex · 08h às 18h · Sáb · 08h às 12h',
  supportCityState: 'Atendimento Nacional · Envio para todo o Brasil',
  acceptedPaymentMethods: DEFAULT_ACCEPTED_PAYMENT_METHODS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  faqItems: DEFAULT_FAQ_ITEMS,
};

function loadSavedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          Boolean(item) &&
          typeof item.productId === 'string' &&
          typeof item.name === 'string' &&
          typeof item.unitPrice === 'number' &&
          item.unitPrice > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity >= 1
      )
      .map((item) => ({
        ...item,
        originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : null,
        eligibleForPromo40: Boolean(item.eligibleForPromo40),
      }));
  } catch {
    return [];
  }
}

function loadStringIdList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

function loadSavedOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is OrderRecord => Boolean(o) && typeof o.id === 'string' && Array.isArray(o.items)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>(MAIN_CATEGORIES);
  const [settings, setSettings] = useState<StoreSettings>(FALLBACK_SETTINGS);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>(loadSavedCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [recentIds, setRecentIds] = useState<string[]>(() => loadStringIdList(RECENT_STORAGE_KEY));
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    loadStringIdList(WISHLIST_STORAGE_KEY)
  );
  const [localOrders, setLocalOrders] = useState<OrderRecord[]>(loadSavedOrders);

  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [infoModalTopic, setInfoModalTopic] = useState<InfoModalTopic>(null);

  const catalogSectionRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const fetchStoreData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/store');
      if (!res.ok) throw new Error('Falha ao carregar catálogo');
      const data = (await res.json()) as {
        products: Product[];
        categories: CategoryDefinition[];
        settings: StoreSettings;
        reviews?: CustomerReview[];
      };
      setProducts(data.products);
      setCategories(data.categories);
      setSettings(data.settings);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      setLoadError('Não foi possível carregar o catálogo da loja. Tente atualizar a página.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Keep localStorage cart synchronized with authoritative server prices (prevents stale or stacked discounts on reload)
  useEffect(() => {
    if (products.length === 0) return;
    setCart((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const synced = prev.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;
        const ev = evaluateProductPrice(prod, settings);
        if (ev.displayPrice === null) return item;
        if (
          item.unitPrice !== ev.displayPrice ||
          item.originalPrice !== ev.originalPrice ||
          item.eligibleForPromo40 !== ev.eligibleForPromo40
        ) {
          changed = true;
          return {
            ...item,
            unitPrice: ev.displayPrice,
            originalPrice: ev.originalPrice,
            eligibleForPromo40: ev.eligibleForPromo40,
          };
        }
        return item;
      });
      return changed ? synced : prev;
    });
  }, [products, settings]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentIds));
    } catch {
      // ignore storage quota errors
    }
  }, [recentIds]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MY_ORDERS_STORAGE_KEY, JSON.stringify(localOrders));
    } catch {
      // ignore storage quota errors
    }
  }, [localOrders]);

  // Sync URL path (/produto/:slug, /categoria/:slug) & hash (#produto/:id, #admin)
  useEffect(() => {
    const syncFromUrl = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (hash === '#admin') {
        setActiveView('admin');
        setSelectedProduct(null);
        return;
      }
      if (hash.startsWith('#produto/')) {
        const pid = hash.replace('#produto/', '');
        const found = products.find((p) => p.id === pid);
        if (found) {
          setActiveView('store');
          setSelectedProduct(found);
        }
        return;
      }
      if (pathname.startsWith('/produto/')) {
        const slug = decodeURIComponent(pathname.replace('/produto/', '').replace(/\/+$/, ''));
        const found = products.find(
          (p) => getCleanProductSlug(p) === slug || p.slug === slug || p.id === slug
        );
        if (found) {
          setActiveView('store');
          setSelectedProduct(found);
        }
        return;
      }
      if (pathname.startsWith('/categoria/')) {
        const slug = decodeURIComponent(pathname.replace('/categoria/', '').replace(/\/+$/, ''));
        const cat = categories.find((c) => c.slug === slug);
        if (cat) {
          setActiveView('store');
          setSelectedCategory(cat.name);
          setSelectedSubcategory('');
        }
      }
    };
    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, [products, categories]);

  // Dynamic SEO metadata + Schema.org Product/Store/FAQPage JSON-LD
  useEffect(() => {
    updateStorefrontSeo({
      selectedProduct,
      selectedCategory,
      selectedSubcategory,
      settings,
      faqItems: settings.faqItems || DEFAULT_FAQ_ITEMS,
    });
  }, [selectedProduct, selectedCategory, selectedSubcategory, settings]);

  const scrollToCatalog = () => {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToFaq = () => {
    setActiveView('store');
    setTimeout(() => {
      document
        .getElementById('perguntas-frequentes')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleNavigateHome = () => {
    setActiveView('store');
    setSelectedCategory('Todas');
    setSelectedSubcategory('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyAvailable(false);
    setVisibleCount(PAGE_SIZE);
    setSelectedProduct(null);
    if (window.location.hash || window.location.pathname !== '/') {
      history.replaceState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (category: string, subcategory = '') => {
    setActiveView('store');
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setVisibleCount(PAGE_SIZE);
    setMobileFiltersOpen(false);
    const matchedCat = categories.find((c) => c.name === category);
    if (category === 'Todas') {
      history.replaceState(null, '', '/');
    } else if (matchedCat && !subcategory) {
      history.replaceState(null, '', `/categoria/${matchedCat.slug}`);
    }
    setTimeout(scrollToCatalog, 50);
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setRecentIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 12));
    history.replaceState(null, '', `/produto/${getCleanProductSlug(product)}`);
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    if (window.location.hash.startsWith('#produto/') || window.location.pathname.startsWith('/produto/')) {
      history.replaceState(null, '', '/');
    }
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev]
    );
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    const ev = evaluateProductPrice(product, settings);
    if (ev.displayPrice === null || !product.available) return;
    const safeQty = Math.max(1, Math.min(999, Math.floor(quantity)));
    const unitPrice = ev.displayPrice;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                unitPrice,
                originalPrice: ev.originalPrice,
                eligibleForPromo40: ev.eligibleForPromo40,
                quantity: Math.min(999, i.quantity + safeQty),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          image: product.images[0] || null,
          unitPrice,
          originalPrice: ev.originalPrice,
          eligibleForPromo40: ev.eligibleForPromo40,
          quantity: safeQty,
          category: product.category,
        },
      ];
    });
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(999, newQty) } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleMobileSearchFocus = () => {
    setActiveView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 220);
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.category === 'Peças e Acessórios') {
        counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  const featuredMachines = useMemo(() => {
    return products
      .filter(
        (p) =>
          p.category !== 'Peças e Acessórios' &&
          p.category !== 'Teteiras' &&
          p.promoPrice !== null
      )
      .slice(0, 4);
  }, [products]);

  const recentlyViewedProducts = useMemo(() => {
    if (recentIds.length === 0 || products.length === 0) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return recentIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }, [recentIds, products]);

  const wishlistProducts = useMemo(() => {
    if (wishlistIds.length === 0 || products.length === 0) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return wishlistIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }, [wishlistIds, products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minVal = minPrice !== '' ? Number(minPrice) : null;
    const maxVal = maxPrice !== '' ? Number(maxPrice) : null;

    const list = products.filter((p) => {
      if (selectedCategory !== 'Todas' && p.category !== selectedCategory) return false;
      if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
      if (onlyAvailable && !p.available) return false;

      const ev = evaluateProductPrice(p, settings);
      const price = ev.displayPrice;

      if (minVal !== null && Number.isFinite(minVal)) {
        if (price === null || price < minVal) return false;
      }
      if (maxVal !== null && Number.isFinite(maxVal)) {
        if (price === null || price > maxVal) return false;
      }

      if (q) {
        const hay = [
          p.name,
          p.sku,
          p.brand || '',
          p.model || '',
          p.category,
          p.subcategory,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => {
        const pa = evaluateProductPrice(a, settings).displayPrice ?? Number.MAX_SAFE_INTEGER;
        const pb = evaluateProductPrice(b, settings).displayPrice ?? Number.MAX_SAFE_INTEGER;
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => {
        const pa = evaluateProductPrice(a, settings).displayPrice ?? -1;
        const pb = evaluateProductPrice(b, settings).displayPrice ?? -1;
        return pb - pa;
      });
    } else if (sortBy === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      // Relevance: featured equipment first, then available items with price
      sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.available !== b.available) return a.available ? -1 : 1;
        return 0;
      });
    }

    return sorted;
  }, [
    products,
    settings,
    selectedCategory,
    selectedSubcategory,
    onlyAvailable,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isDefaultHome =
    activeView === 'store' &&
    selectedCategory === 'Todas' &&
    !selectedSubcategory &&
    !searchQuery.trim() &&
    !minPrice &&
    !maxPrice &&
    !onlyAvailable;

  const hasOpenOverlay =
    cartOpen ||
    checkoutOpen ||
    mobileFiltersOpen ||
    Boolean(selectedProduct) ||
    ordersModalOpen ||
    wishlistModalOpen ||
    accountModalOpen ||
    infoModalTopic !== null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#14231A] pb-16 lg:pb-0">
      <Header
        cartCount={cartCount}
        activeView={activeView}
        onNavigateHome={handleNavigateHome}
        onSelectCategory={(cat) => handleSelectCategory(cat)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAdmin={() => {
          setActiveView('admin');
          setSelectedProduct(null);
          history.replaceState(null, '', '#admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        categories={categories}
      />

      {/* Search Bar Strip directly below header on Store view */}
      {activeView === 'store' && (
        <div className="bg-[#F1F5F2] border-b border-[#E2E8E4]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#4A5D52] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Pesquisar ordenhadeira, teteira, marca, modelo ou código..."
                aria-label="Pesquisar produtos"
                className="w-full h-11 pl-10 pr-10 rounded-lg border border-[#E2E8E4] bg-white text-sm text-[#14231A] placeholder:text-[#4A5D52] focus:outline-none focus:border-[#166534]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar pesquisa"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-md text-[#4A5D52] hover:bg-[#F1F5F2] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => handleSelectCategory(e.target.value)}
                aria-label="Selecionar categoria"
                className="h-11 px-3 rounded-lg border border-[#E2E8E4] bg-white text-xs sm:text-sm font-medium text-[#14231A] focus:outline-none focus:border-[#166534] max-w-[200px]"
              >
                <option value="Todas">Todas as Categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar produtos"
                className="h-11 px-3 rounded-lg border border-[#E2E8E4] bg-white text-xs sm:text-sm font-medium text-[#14231A] focus:outline-none focus:border-[#166534]"
              >
                <option value="relevance">Relevância</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="name_asc">Ordem Alfabética</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'admin' ? (
          <AdminPanel
            onBackToStore={handleNavigateHome}
            onStoreDataChanged={fetchStoreData}
          />
        ) : (
          <>
            {isDefaultHome && (
              <HeroSection
                settings={settings}
                totalProducts={products.length}
                onExploreCatalog={scrollToCatalog}
                onSelectCategory={(cat) => handleSelectCategory(cat)}
              />
            )}

            {/* Featured Machines Row on Default Home */}
            {isDefaultHome && featuredMachines.length > 0 && (
              <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-10 pb-2">
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#14231A]">
                      Ordenhadeiras em Destaque
                    </h2>
                    <p className="text-sm text-[#4A5D52] mt-0.5">
                      Nossa equipe está pronta para ajudar você · Conte com nossa equipe para encontrar o equipamento ideal
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('Ordenhadeiras Inox')}
                    className="text-xs sm:text-sm font-semibold text-[#166534] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Ver todas →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {featuredMachines.map((product) => (
                    <ProductCard
                      key={`feat-${product.id}`}
                      product={product}
                      settings={settings}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onOpenDetail={handleOpenProduct}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Main Catalog Browser */}
            <section
              ref={catalogSectionRef}
              id="catalogo"
              className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2E8E4]">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#14231A]">
                    {selectedSubcategory
                      ? selectedSubcategory
                      : selectedCategory === 'Todas'
                      ? 'Catálogo Completo AGROLEITE'
                      : selectedCategory}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A5D52] mt-0.5 font-mono-num">
                    {filteredProducts.length}{' '}
                    {filteredProducts.length === 1
                      ? 'produto encontrado'
                      : 'produtos encontrados'}
                    {searchQuery.trim() ? ` para "${searchQuery.trim()}"` : ''}
                    {' · Faça seu pedido de maneira simples e receba atendimento pelo WhatsApp.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#E2E8E4] bg-white text-xs font-semibold text-[#14231A]"
                >
                  <Filter className="w-4 h-4 text-[#166534]" />
                  <span>Categorias e Filtros</span>
                </button>
              </div>

              {loadError ? (
                <div className="p-8 rounded-xl border border-red-200 bg-red-50 text-center space-y-3">
                  <p className="text-sm font-medium text-red-800">{loadError}</p>
                  <button
                    type="button"
                    onClick={fetchStoreData}
                    className="px-4 py-2 rounded-lg bg-[#166534] text-white text-xs font-semibold cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="hidden lg:block lg:col-span-3 h-96 rounded-xl bg-white border border-[#E2E8E4] animate-pulse" />
                  <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-80 rounded-xl bg-white border border-[#E2E8E4] animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Desktop Sidebar */}
                  <div className="hidden lg:block lg:col-span-3">
                    <CatalogSidebar
                      categories={categories}
                      selectedCategory={selectedCategory}
                      selectedSubcategory={selectedSubcategory}
                      categoryCounts={categoryCounts}
                      subcategoryCounts={subcategoryCounts}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      onlyAvailable={onlyAvailable}
                      onSelectCategory={handleSelectCategory}
                      onChangePriceRange={(min, max) => {
                        setMinPrice(min);
                        setMaxPrice(max);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      onToggleAvailable={(val) => {
                        setOnlyAvailable(val);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      onResetFilters={handleNavigateHome}
                    />
                  </div>

                  {/* Product Grid */}
                  <div className="lg:col-span-9 space-y-8">
                    {visibleProducts.length === 0 ? (
                      <div className="bg-white rounded-xl border border-[#E2E8E4] p-10 text-center space-y-3">
                        <div className="font-display text-lg font-bold text-[#14231A]">
                          Nenhum produto encontrado
                        </div>
                        <p className="text-sm text-[#4A5D52] max-w-md mx-auto">
                          {selectedCategory === 'Ordenhadeira Inox a Gasolina'
                            ? 'Esta categoria está em atualização de estoque. Consulte nossos modelos Carrelo Gasolina e 4G Gasolina ou fale conosco pelo WhatsApp.'
                            : 'Não encontramos itens com os filtros informados. Tente limpar a pesquisa ou selecionar outra categoria.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleNavigateHome}
                          className="mt-2 px-5 py-2.5 rounded-lg bg-[#166534] hover:bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
                        >
                          Limpar Filtros e Ver Tudo
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                          {visibleProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              settings={settings}
                              isWishlisted={wishlistIds.includes(product.id)}
                              onToggleWishlist={handleToggleWishlist}
                              onOpenDetail={handleOpenProduct}
                              onAddToCart={handleAddToCart}
                            />
                          ))}
                        </div>

                        {visibleCount < filteredProducts.length && (
                          <div className="flex flex-col items-center gap-2 pt-2">
                            <div className="text-xs text-[#4A5D52] font-mono-num">
                              Exibindo {visibleProducts.length} de {filteredProducts.length} produtos
                            </div>
                            <button
                              type="button"
                              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                              className="h-11 px-6 rounded-lg border border-[#166534] bg-white hover:bg-[#166534] text-[#166534] hover:text-white text-sm font-semibold transition-colors cursor-pointer"
                            >
                              Carregar Mais Produtos
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Recently Viewed Products */}
            <RecentlyViewedSection
              products={recentlyViewedProducts}
              settings={settings}
              onOpenProduct={handleOpenProduct}
            />

            {/* Informative Agro Content & Tips */}
            <AgroTipsSection onSelectCategory={(cat) => handleSelectCategory(cat)} />

            {/* Verified Customer Reviews Carousel */}
            <CustomerReviewsSection reviews={reviews} />

            {/* Expandable FAQ Section */}
            <FaqSection items={settings.faqItems || DEFAULT_FAQ_ITEMS} />

            {/* Email Offers Registration */}
            <NewsletterSection settings={settings} />
          </>
        )}
      </main>

      <Footer
        settings={settings}
        categories={categories}
        onSelectCategory={(cat) => handleSelectCategory(cat)}
        onNavigateHome={handleNavigateHome}
        onOpenAdmin={() => {
          setActiveView('admin');
          setSelectedProduct(null);
          history.replaceState(null, '', '#admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrders={() => setOrdersModalOpen(true)}
        onScrollToFaq={scrollToFaq}
        onOpenInfoModal={(topic) => setInfoModalTopic(topic)}
      />

      <FloatingWhatsAppButton settings={settings} hidden={hasOpenOverlay} />

      <MobileBottomNav
        wishlistCount={wishlistProducts.length}
        onContact={() => setInfoModalTopic('fale-conosco')}
        onAccount={() => setAccountModalOpen(true)}
        onOrders={() => setOrdersModalOpen(true)}
        onWishlist={() => setWishlistModalOpen(true)}
        onSearch={handleMobileSearchFocus}
      />

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-80 max-w-[85vw] bg-[#F8FAF8] h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-bold text-[#14231A]">
                Filtros e Categorias
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fechar filtros"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg bg-white border border-[#E2E8E4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CatalogSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              categoryCounts={categoryCounts}
              subcategoryCounts={subcategoryCounts}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onlyAvailable={onlyAvailable}
              onSelectCategory={handleSelectCategory}
              onChangePriceRange={(min, max) => {
                setMinPrice(min);
                setMaxPrice(max);
                setVisibleCount(PAGE_SIZE);
              }}
              onToggleAvailable={(val) => {
                setOnlyAvailable(val);
                setVisibleCount(PAGE_SIZE);
              }}
              onResetFilters={() => {
                setMobileFiltersOpen(false);
                handleNavigateHome();
              }}
            />
          </div>
        </div>
      )}

      <ProductDetailModal
        product={selectedProduct}
        allProducts={products}
        settings={settings}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onClose={handleCloseProduct}
        onSelectProduct={handleOpenProduct}
        onSelectCategory={handleSelectCategory}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <WhatsAppCheckoutModal
        open={checkoutOpen}
        items={cart}
        settings={settings}
        onClose={() => setCheckoutOpen(false)}
        onOrderRecorded={(order) => {
          setLocalOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)].slice(0, 30));
        }}
        onOrderCompleted={(shouldClear) => {
          if (shouldClear) {
            setCart([]);
            setCheckoutOpen(false);
          }
        }}
      />

      <OrdersLookupModal
        open={ordersModalOpen}
        localOrders={localOrders}
        settings={settings}
        onClose={() => setOrdersModalOpen(false)}
      />

      <WishlistModal
        open={wishlistModalOpen}
        products={wishlistProducts}
        settings={settings}
        onClose={() => setWishlistModalOpen(false)}
        onOpenProduct={handleOpenProduct}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <AccountModal
        open={accountModalOpen}
        settings={settings}
        ordersCount={localOrders.length}
        wishlistCount={wishlistProducts.length}
        onClose={() => setAccountModalOpen(false)}
        onOpenOrders={() => setOrdersModalOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        onOpenAdmin={() => {
          setActiveView('admin');
          setSelectedProduct(null);
          history.replaceState(null, '', '#admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <InfoContentModal
        topic={infoModalTopic}
        settings={settings}
        onClose={() => setInfoModalTopic(null)}
      />
    </div>
  );
}
