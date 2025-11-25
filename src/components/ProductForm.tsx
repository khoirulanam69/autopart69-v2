import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/hooks/useProducts';
import { Scan, Upload, X, Camera } from 'lucide-react';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, imageFile?: File) => Promise<any>;
  product?: Product | null;
  title: string;
}

const CATEGORIES = [
  { value: 'sparepart', label: 'Sparepart' },
  { value: 'oli', label: 'Oli' },
  { value: 'ban', label: 'Ban' },
  { value: 'aki', label: 'Aki' },
  { value: 'aksesoris', label: 'Aksesoris' },
  { value: 'tools', label: 'Tools' },
  { value: 'lainnya', label: 'Lainnya' }
];

const ProductForm = ({ open, onOpenChange, onSubmit, product, title }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price || 0,
    purchase_price: product?.purchase_price || 0,
    stock: product?.stock || 0,
    supplier: product?.supplier || '',
    barcode: product?.barcode || ''
  });
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price || 0,
        purchase_price: product.purchase_price || 0,
        stock: product.stock || 0,
        supplier: product.supplier || '',
        barcode: product.barcode || ''
      });
      setImagePreview(product.image_url || null);
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        category: '',
        price: 0,
        purchase_price: 0,
        stock: 0,
        supplier: '',
        barcode: ''
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product]);

  // Barcode scanner listener
  useEffect(() => {
    if (!isScanning) return;

    let barcodeBuffer = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Enter') {
        // Barcode scan complete
        if (barcodeBuffer.length > 0) {
          setFormData(prev => ({ ...prev, barcode: barcodeBuffer }));
          barcodeBuffer = '';
          setIsScanning(false);
        }
      } else if (e.key.length === 1) {
        // Add character to buffer
        barcodeBuffer += e.key;
        
        // Reset timeout
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          barcodeBuffer = '';
        }, 100); // Clear buffer after 100ms of inactivity
      }
    };

    document.addEventListener('keypress', handleKeyPress, true);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress, true);
      clearTimeout(timeoutId);
    };
  }, [isScanning]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await onSubmit(formData, imageFile || undefined);
    
    if (result?.error === null) {
      onOpenChange(false);
      setFormData({
        name: '',
        category: '',
        price: 0,
        purchase_price: 0,
        stock: 0,
        supplier: '',
        barcode: ''
      });
      setImageFile(null);
      setImagePreview(null);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Foto Produk</Label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="camera-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('camera-upload')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Ambil Foto
                      </Button>
                    </Label>
                    <Input
                      id="camera-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Pilih dari Galeri
                      </Button>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Harga Beli *</Label>
              <Input
                id="purchase_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga Jual *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stok *</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Scan atau ketik barcode"
                disabled={isScanning}
              />
              <Button
                type="button"
                variant={isScanning ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsScanning(!isScanning)}
              >
                <Scan className="h-4 w-4" />
                {isScanning ? "Stop" : "Scan"}
              </Button>
            </div>
            {isScanning && (
              <p className="text-sm text-muted-foreground">
                Mode scan aktif. Gunakan barcode scanner atau ketik enter untuk selesai.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Loading..." : "Simpan"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;