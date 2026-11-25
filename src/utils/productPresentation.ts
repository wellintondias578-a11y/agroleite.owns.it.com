import type { Product, ProductSpec } from '../types/store';

export interface ProductPresentation {
  specs: ProductSpec[];
  compatibilityBrands: string[];
  voltageInfo: string | null;
  voltageRequiresConfirmation: boolean;
  overviewText: string;
  includedItems: string[];
  notes: string[];
  supportAndWarranty: string[];
}

const KNOWN_COMPATIBILITY_TERMS = [
  'DeLaval',
  'Sulinox',
  'Eurolat',
  'Eurolate',
  'Bosio',
  'Westfalia',
  'GEA',
  'Gimenez',
  'Fockink',
  'Reatta',
  'BVO',
  'Dura',
  'Agroleite',
  '4G',
  'BV300',
  'BV350',
  'BV450',
  'BV600',
  'Carrelo',
  'Balde ao Pé',
  'Canalizada',
];

const ELECTRICAL_CATEGORIES = new Set([
  'Ordenhadeiras Inox',
  'Ordenhadeira Carrelo',
  'Transferidor de Leite e Unidade Final',
]);

export function extractProductPresentation(product: Product): ProductPresentation {
  const fullText = `${product.name}\n${product.description || ''}`;
  const specsMap = new Map<string, string>();

  for (const sp of product.specs || []) {
    if (sp?.label && sp?.value) {
      specsMap.set(sp.label.trim(), sp.value.trim());
    }
  }

  // Extract compatibility brands/models strictly from existing product fields
  const foundTerms: string[] = [];
  if (product.brand) foundTerms.push(product.brand);
  if (product.model) foundTerms.push(product.model);

  for (const term of KNOWN_COMPATIBILITY_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(fullText) && !foundTerms.some((t) => t.toLowerCase() === term.toLowerCase())) {
      foundTerms.push(term);
    }
  }

  // Extract explicit voltage/power info strictly when mentioned in product data
  let voltageInfo: string | null = null;
  let voltageRequiresConfirmation = false;

  if (/110\s*v\s*(?:ou|\/|e)\s*220\s*v|bivolt/i.test(fullText)) {
    voltageInfo = /monof[aá]sic/i.test(fullText)
      ? 'Monofásico · 110V ou 220V'
      : '110V ou 220V (conforme instalação)';
  } else if (/220\s*v/i.test(fullText)) {
    voltageInfo = /trif[aá]sic/i.test(fullText)
      ? 'Trifásico · 220V'
      : /monof[aá]sic/i.test(fullText)
      ? 'Monofásico · 220V'
      : '220V';
  } else if (/110\s*v|127\s*v/i.test(fullText)) {
    voltageInfo = /127\s*v/i.test(fullText) ? '127V (110V)' : '110V';
  } else if (/a\s+gasolina|motor\s+a\s+gasolina/i.test(fullText)) {
    voltageInfo = 'Motor a gasolina (não depende de rede elétrica)';
  } else if (
    ELECTRICAL_CATEGORIES.has(product.category) ||
    /\b(motor|bomba\s+de\s+v[aá]cuo|transferidor|pulsador\s+el[eé]trico|eletrificador)\b/i.test(
      product.name
    )
  ) {
    voltageRequiresConfirmation = true;
  }

  // Parse structured description sections strictly from existing description text
  const rawLines = (product.description || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const overviewLines: string[] = [];
  const includedItems: string[] = [];
  const notes: string[] = [];
  const supportAndWarranty: string[] = [];

  let currentSection: 'overview' | 'items' | 'support' = 'overview';

  for (const line of rawLines) {
    const upper = line.toUpperCase();
    if (
      upper.includes('ITENS QUE COMPÕEM') ||
      upper.includes('ITENS INCLUSOS') ||
      upper === 'UNIDADE DE VÁCUO:' ||
      upper === 'TUBULAÇÃO:' ||
      upper === 'CONJUNTOS DE ORDENHA' ||
      upper === 'CONJUNTOS DE ORDENHA:'
    ) {
      currentSection = 'items';
      if (
        !upper.includes('ITENS QUE COMPÕEM') &&
        !upper.includes('ITENS INCLUSOS')
      ) {
        includedItems.push(line.replace(/:$/, ''));
      }
      continue;
    }

    if (upper === 'SUPORTE TÉCNICO' || upper === 'GARANTIA' || upper.startsWith('GARANTIA DE FÁBRICA')) {
      currentSection = 'support';
      if (upper.startsWith('GARANTIA DE FÁBRICA')) {
        supportAndWarranty.push(line);
      }
      continue;
    }

    if (/^não acompanha/i.test(line)) {
      notes.push(line);
      continue;
    }

    if (currentSection === 'items') {
      includedItems.push(line);
    } else if (currentSection === 'support') {
      supportAndWarranty.push(line);
    } else {
      overviewLines.push(line);
    }
  }

  const overviewText =
    overviewLines.length > 0
      ? overviewLines.join('\n')
      : (product.description || '').trim();

  return {
    specs: Array.from(specsMap.entries()).map(([label, value]) => ({ label, value })),
    compatibilityBrands: foundTerms,
    voltageInfo,
    voltageRequiresConfirmation,
    overviewText,
    includedItems,
    notes,
    supportAndWarranty,
  };
}
