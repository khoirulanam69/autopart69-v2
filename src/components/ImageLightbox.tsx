import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductImageUrl } from '@/lib/productImage';

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export function ImageLightbox({ open, onOpenChange, imageUrl, alt = 'Product image' }: ImageLightboxProps) {
  const resolvedImageUrl = getProductImageUrl(imageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none overflow-hidden">
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Image container */}
          <div 
            className="flex items-center justify-center w-full"
            onClick={() => onOpenChange(false)}
          >
            {resolvedImageUrl && (
              <img
                src={resolvedImageUrl}
                alt={alt}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
