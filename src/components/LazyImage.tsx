import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductImageUrl } from '@/lib/productImage';

interface LazyImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export const LazyImage = ({ src: rawSrc, alt, className = '' }: LazyImageProps) => {
  const src = getProductImageUrl(rawSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px', // Start loading before image enters viewport
  });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {inView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          No Image
        </div>
      )}
    </div>
  );
};
