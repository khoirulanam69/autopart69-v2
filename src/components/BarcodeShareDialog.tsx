import { useState, useEffect } from 'react';
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && product) {
      setIsGenerating(true);
      setQrCodeDataUrl('');
      
      import('qrcode').then((QRCode) => {
        const qrData = product.barcode || product.id;
        
        QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        })
          .then((dataUrl: string) => {
            console.log('QR Code generated:', dataUrl ? 'success' : 'empty');
            setQrCodeDataUrl(dataUrl);
          })
          .catch((error: Error) => {
            console.error('Error generating QR code:', error);
          })
          .finally(() => {
            setIsGenerating(false);
          });
      }).catch((error) => {
        console.error('Error loading qrcode library:', error);
        setIsGenerating(false);
      });
    }
  }, [open, product]);

  const handlePrint = () => {
    if (!product || !qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${product.name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin: 20px 0; }
              .qr-container img { width: 200px; height: 200px; }
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
            <div class="qr-container">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
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
    if (!product || !qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${product.name.replace(/\s+/g, '-')}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    
    toast({
      title: "Berhasil",
      description: "QR Code berhasil diunduh"
    });
  };

  const handleShare = async () => {
    if (!product || !qrCodeDataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `qrcode-${product.name}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code - ${product.name}`,
          text: `QR Code produk: ${product.name}\nHarga: ${formatPrice(product.price)}`,
          files: [file]
        });
      } else if (navigator.share) {
        // Share without file if file sharing not supported
        await navigator.share({
          title: `QR Code - ${product.name}`,
          text: `QR Code produk: ${product.name}\nHarga: ${formatPrice(product.price)}\nKode: ${product.barcode || product.id}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `QR Code produk: ${product.name}\nHarga: ${formatPrice(product.price)}\nKode: ${product.barcode || product.id}`
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
          description: "Tidak dapat membagikan QR Code",
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
          <DialogTitle className="line-clamp-1">QR Code: {product.name}</DialogTitle>
          <DialogDescription>
            Cetak atau bagikan QR Code produk ini
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Display QR Code */}
          {isGenerating ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : qrCodeDataUrl ? (
            <div className="bg-white p-4 rounded-lg border">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56" />
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
