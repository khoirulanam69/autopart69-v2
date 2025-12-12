import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Share2, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode?: string | null;
}

interface BarcodeShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(price);
};

export const BarcodeShareDialog = ({ open, onOpenChange, product }: BarcodeShareDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && product) {
      setIsGenerating(true);
      setBarcodeDataUrl('');
      
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          import('jsbarcode').then((JsBarcode) => {
            try {
              JsBarcode.default(canvasRef.current, product.barcode || product.id, {
                format: "CODE128",
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 14,
                margin: 10
              });
              const dataUrl = canvasRef.current?.toDataURL('image/png') || '';
              console.log('Barcode generated:', dataUrl ? 'success' : 'empty');
              setBarcodeDataUrl(dataUrl);
            } catch (error) {
              console.error('Error generating barcode:', error);
            } finally {
              setIsGenerating(false);
            }
          }).catch((error) => {
            console.error('Error loading jsbarcode:', error);
            setIsGenerating(false);
          });
        } else {
          console.error('Canvas ref not available');
          setIsGenerating(false);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open, product]);

  const handlePrint = () => {
    if (!product || !barcodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${product.name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .barcode-container { margin: 20px 0; }
              .product-info { margin-bottom: 10px; }
              @media print {
                @page { size: A4; margin: 1cm; }
              }
            </style>
          </head>
          <body>
            <div class="product-info">
              <h3>${product.name}</h3>
              <p>Harga: ${formatPrice(product.price)}</p>
            </div>
            <div class="barcode-container">
              <img src="${barcodeDataUrl}" alt="Barcode" />
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    if (!product || !barcodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `barcode-${product.name.replace(/\s+/g, '-')}.png`;
    link.href = barcodeDataUrl;
    link.click();
    
    toast({
      title: "Berhasil",
      description: "Barcode berhasil diunduh"
    });
  };

  const handleShare = async () => {
    if (!product || !barcodeDataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(barcodeDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `barcode-${product.name}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Barcode - ${product.name}`,
          text: `Barcode produk: ${product.name}\nHarga: ${formatPrice(product.price)}`,
          files: [file]
        });
      } else if (navigator.share) {
        // Share without file if file sharing not supported
        await navigator.share({
          title: `Barcode - ${product.name}`,
          text: `Barcode produk: ${product.name}\nHarga: ${formatPrice(product.price)}\nKode: ${product.barcode || product.id}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `Barcode produk: ${product.name}\nHarga: ${formatPrice(product.price)}\nKode: ${product.barcode || product.id}`
        );
        toast({
          title: "Disalin",
          description: "Info produk disalin ke clipboard"
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Gagal",
          description: "Tidak dapat membagikan barcode",
          variant: "destructive"
        });
      }
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">Barcode: {product.name}</DialogTitle>
          <DialogDescription>
            Cetak atau bagikan barcode produk ini
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Canvas for generating barcode - use absolute positioning instead of display:none */}
          <canvas ref={canvasRef} className="absolute -left-[9999px]" />
          
          {/* Display barcode */}
          {isGenerating ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : barcodeDataUrl ? (
            <div className="bg-white p-4 rounded-lg border">
              <img src={barcodeDataUrl} alt="Barcode" className="max-w-full" />
            </div>
          ) : null}
          
          {/* Product info */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
            {product.barcode && (
              <p className="text-xs font-mono text-muted-foreground">{product.barcode}</p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 justify-center w-full">
            <Button onClick={handlePrint} className="flex-1 min-w-[100px]">
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
            <Button onClick={handleShare} variant="secondary" className="flex-1 min-w-[100px]">
              <Share2 className="h-4 w-4 mr-2" />
              Bagikan
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1 min-w-[100px]">
              <Download className="h-4 w-4 mr-2" />
              Unduh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
