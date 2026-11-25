import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  sku?: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  sku,
  className = '',
  priority = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F1F5F2] to-[#E5ECE7] text-[#4A5D52] p-4 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-9 h-9 text-[#166534]/50 mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#14231A]/80 line-clamp-2 max-w-[180px]">
          {alt}
        </span>
        {sku && (
          <span className="mt-1 text-[11px] font-mono-num text-[#4A5D52]">
            Cód. {sku}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
