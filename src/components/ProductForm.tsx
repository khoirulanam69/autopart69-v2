import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/hooks/useProducts';
import { Scan, Upload, X, Camera, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);

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
      setFormData({ name: '', category: '', price: 0, purchase_price: 0, stock: 0, supplier: '', barcode: '' });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product]);

  useEffect(() => {
    if (!isScanning) return;

    let barcodeBuffer = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 0) {
          setFormData(prev => ({ ...prev, barcode: barcodeBuffer }));
          barcodeBuffer = '';
          setIsScanning(false);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { barcodeBuffer = ''; }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress, true);
    return () => {
      document.removeEventListener('keypress', handleKeyPress, true);
      clearTimeout(timeoutId);
    };
  }, [isScanning]);

  const generateUniqueBarcode = async () => {
    setIsGeneratingBarcode(true);
    try {
      let isUnique = false;
      let newBarcode = '';

      while (!isUnique) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        newBarcode = `PRD${timestamp}${random}`;

        const { exists } = await api.checkBarcode(newBarcode);
        if (!exists) {
          isUnique = true;
        }
      }

      setFormData(prev => ({ ...prev, barcode: newBarcode }));
      toast({ title: "Berhasil", description: "Kode barcode berhasil di-generate" });
    } catch (error: any) {
      toast({ title: "Error", description: "Gagal generate kode barcode", variant: "destructive" });
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.purchase_price <= 0) {
      toast({ title: "Error", description: "Harga beli harus lebih dari 0", variant: "destructive" });
      return;
    }

    if (formData.price <= 0) {
      toast({ title: "Error", description: "Harga jual harus lebih dari 0", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = await onSubmit(formData, imageFile || undefined);

    if (result?.error === null) {
      onOpenChange(false);
      setFormData({ name: '', category: '', price: 0, purchase_price: 0, stock: 0, supplier: '', barcode: '' });
      setImageFile(null);
      setImagePreview(null);
    }
    setLoading(false);
  };

  const formatNumberValue = (value: number): string => value === 0 ? '' : value.toString();
  const parseNumberValue = (value: string): number => { const p = parseFloat(value); return isNaN(p) ? 0 : p; };
  const parseIntValue = (value: string): number => { const p = parseInt(value); return isNaN(p) ? 0 : p; };

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
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleRemoveImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="camera-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('camera-upload')?.click()}>
                        <Camera className="h-4 w-4 mr-2" />Ambil Foto
                      </Button>
                    </Label>
                    <Input id="camera-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('image-upload')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />Pilih dari Galeri
                      </Button>
                    </Label>
                    <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} required className="uppercase" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Harga Beli *</Label>
              <Input id="purchase_price" type="number" min="1" step="1" value={formatNumberValue(formData.purchase_price)} onChange={(e) => setFormData({ ...formData, purchase_price: parseNumberValue(e.target.value) })} placeholder="Masukkan harga beli" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga Jual *</Label>
              <Input id="price" type="number" min="1" step="1" value={formatNumberValue(formData.price)} onChange={(e) => setFormData({ ...formData, price: parseNumberValue(e.target.value) })} placeholder="Masukkan harga jual" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stok *</Label>
            <Input id="stock" type="number" min="0" value={formatNumberValue(formData.stock)} onChange={(e) => setFormData({ ...formData, stock: parseIntValue(e.target.value) })} placeholder="Masukkan jumlah stok" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan, ketik, atau generate barcode" disabled={isScanning || isGeneratingBarcode} className="flex-1" />
              <Button type="button" variant="outline" size="icon" onClick={generateUniqueBarcode} disabled={isGeneratingBarcode || isScanning} title="Generate Barcode">
                <Wand2 className={`h-4 w-4 ${isGeneratingBarcode ? 'animate-spin' : ''}`} />
              </Button>
              <Button type="button" variant={isScanning ? "destructive" : "outline"} size="icon" onClick={() => setIsScanning(!isScanning)} disabled={isGeneratingBarcode} title={isScanning ? "Stop Scan" : "Scan Barcode"}>
                <Scan className="h-4 w-4" />
              </Button>
            </div>
            {isScanning && <p className="text-sm text-muted-foreground">Mode scan aktif. Gunakan barcode scanner atau ketik enter untuk selesai.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input id="supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Loading..." : "Simpan"}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
