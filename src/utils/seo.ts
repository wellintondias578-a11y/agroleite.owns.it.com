import type { FaqItem, Product, StoreSettings } from '../types/store';
import { evaluateProductPrice } from './pricing';

const BASE_TITLE = 'AGROLEITE — Ordenhadeiras, Peças e Equipamentos Leiteiros';
const BASE_DESCRIPTION =
  'Loja agropecuária especializada em ordenhadeiras inox, a gasolina, transferidores de leite, teteiras e peças de reposição com pedido pelo WhatsApp.';

function setMetaContent(selector: string, content: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.setAttribute('content', content);
  }
}

function setLinkHref(rel: string, href: string): void {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, payload: Record<string, unknown> | null): void {
  const existing = document.getElementById(id);
  if (!payload) {
    if (existing) existing.remove();
    return;
  }
  const script = existing || document.createElement('script');
  script.id = id;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(payload);
  if (!existing) {
    document.head.appendChild(script);
  }
}

export function getCleanProductSlug(product: Pick<Product, 'id' | 'slug'>): string {
  const raw = (product.slug || product.id || '').trim();
  const cleaned = raw
    .replace(/^\/+/, '')
    .replace(/^produto\//i, '')
    .replace(/\.html$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || product.id;
}

export function updateStorefrontSeo(params: {
  selectedProduct: Product | null;
  selectedCategory: string;
  selectedSubcategory: string;
  settings: StoreSettings;
  faqItems: FaqItem[];
}): void {
  const { selectedProduct, selectedCategory, selectedSubcategory, settings, faqItems } = params;
  const origin = window.location.origin;
  const currentUrl = `${origin}${window.location.pathname}${window.location.hash}`;

  let title = BASE_TITLE;
  let description = BASE_DESCRIPTION;

  if (selectedProduct) {
    title = `${selectedProduct.name} | AGROLEITE`;
    description = `${selectedProduct.name} (Cód. ${selectedProduct.sku}) na categoria ${selectedProduct.category}. Compre ou solicite atendimento pelo WhatsApp na AGROLEITE.`;
  } else if (selectedSubcategory) {
    title = `${selectedSubcategory} — Peças e Acessórios | AGROLEITE`;
    description = `Confira ${selectedSubcategory} na AGROLEITE. Equipamentos e peças para produção leiteira com atendimento pelo WhatsApp.`;
  } else if (selectedCategory && selectedCategory !== 'Todas') {
    title = `${selectedCategory} | AGROLEITE`;
    description = `Linha completa de ${selectedCategory} na AGROLEITE. Equipamentos agropecuários e atendimento técnico pelo WhatsApp.`;
  }

  document.title = title;
  setMetaContent('meta[name="description"]', description.slice(0, 160));
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description.slice(0, 160));
  setMetaContent('meta[property="og:url"]', currentUrl);
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', description.slice(0, 160));
  setLinkHref('canonical', `${origin}${window.location.pathname}`);

  // Store Organization + FAQ structured data
  upsertJsonLd('agroleite-store-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings.storeName || 'AGROLEITE',
    description: BASE_DESCRIPTION,
    url: origin,
    telephone: settings.whatsappDisplay,
  });

  if (faqItems.length > 0) {
    upsertJsonLd('agroleite-faq-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.slice(0, 10).map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  // Active Product JSON-LD
  if (selectedProduct) {
    const ev = evaluateProductPrice(selectedProduct, settings);
    const productCleanUrl = `${origin}/produto/${getCleanProductSlug(selectedProduct)}`;
    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      category: selectedProduct.category,
      description: selectedProduct.description || selectedProduct.name,
      url: productCleanUrl,
    };
    if (selectedProduct.brand) {
      productSchema.brand = {
        '@type': 'Brand',
        name: selectedProduct.brand,
      };
    }
    if (selectedProduct.images[0]) {
      productSchema.image = selectedProduct.images;
    }
    if (ev.displayPrice !== null) {
      productSchema.offers = {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: ev.displayPrice.toFixed(2),
        availability: selectedProduct.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: productCleanUrl,
      };
    }
    upsertJsonLd('agroleite-product-jsonld', productSchema);
  } else {
    upsertJsonLd('agroleite-product-jsonld', null);
  }
}
