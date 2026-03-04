import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductExcelImportProps {
  products: Product[];
  onImportComplete: () => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  updated: number;
  failed: number;
  errors: ImportError[];
}

const VALID_CATEGORIES = ['sparepart', 'oli', 'ban', 'aki', 'aksesoris', 'tools', 'lainnya'];

const ProductExcelImport = ({ products, onImportComplete }: ProductExcelImportProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: allProducts } = await api.getAllProducts();

      const exportData = (allProducts || []).map((product: any, index: number) => ({
        'No': index + 1,
        'ID': product.id,
        'Nama Produk': product.name,
        'Kategori': product.category,
        'Harga Jual': product.price,
        'Harga Beli': product.purchase_price,
        'Stok': product.stock,
        'Supplier': product.supplier || '',
        'Barcode': product.barcode || '',
        'Gambar URL': product.image_url || '',
        'Tanggal Dibuat': new Date(product.created_at).toLocaleDateString('id-ID'),
        'Terakhir Update': new Date(product.updated_at).toLocaleDateString('id-ID'),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 5 }, { wch: 36 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 50 },
        { wch: 15 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `products_export_${date}.xlsx`);

      toast({ title: "Export Berhasil", description: `${allProducts?.length || 0} produk berhasil diekspor` });
    } catch (error: any) {
      toast({ title: "Export Gagal", description: error.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      'ID': '(Kosongkan untuk produk baru)',
      'Nama Produk': 'Contoh Produk',
      'Kategori': 'sparepart',
      'Harga Jual': 50000,
      'Harga Beli': 35000,
      'Stok': 10,
      'Supplier': 'Supplier ABC',
      'Barcode': 'PRD123456',
      'Gambar URL': 'https://cdn.mkaindo.com/autopart-products/contoh.jpg',
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    const instructionsData = [
      ['PETUNJUK IMPORT DATA PRODUK'], [''],
      ['Kolom yang wajib diisi:'],
      ['- Nama Produk: Nama produk (wajib)'],
      ['- Kategori: Pilihan: sparepart, oli, ban, aki, aksesoris, tools, lainnya (wajib)'],
      ['- Harga Jual: Harga jual dalam angka (wajib)'],
      ['- Harga Beli: Harga beli dalam angka (wajib)'],
      [''], ['Kolom opsional:'],
      ['- ID: Isi dengan ID produk yang sudah ada untuk update, kosongkan untuk produk baru'],
      ['- Stok: Jumlah stok (default: 0)'],
      ['- Supplier: Nama supplier'],
      ['- Barcode: Kode barcode produk'],
      ['- Gambar URL: URL gambar produk (opsional, tidak akan di-overwrite jika kosong)'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 80 }];
    ws['!cols'] = [{ wch: 36 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Petunjuk');
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_import_produk.xlsx');
    toast({ title: "Template Diunduh", description: "Template Excel berhasil diunduh." });
  };


  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowImportDialog(true);
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames.find(name => name !== 'Petunjuk') || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error('File Excel kosong atau format tidak sesuai');

      setImportProgress(30);

      // Map Excel rows to backend format
      const mappedProducts = jsonData.map((row: any, i: number) => {
        const productId = row['ID'] && String(row['ID']).trim() !== '' && String(row['ID']).trim() !== '(Kosongkan untuk produk baru)' ? String(row['ID']).trim() : null;
        return {
          _rowNum: i + 2,
          id: productId,
          name: row['Nama Produk'] ? String(row['Nama Produk']).trim() : '',
          category: row['Kategori'] ? String(row['Kategori']).toLowerCase().trim() : '',
          price: Number(row['Harga Jual']) || 0,
          purchase_price: Number(row['Harga Beli']) || 0,
          stock: row['Stok'] !== undefined && row['Stok'] !== '' ? Number(row['Stok']) : 0,
          supplier: row['Supplier'] ? String(row['Supplier']).trim() : null,
          barcode: row['Barcode'] ? String(row['Barcode']).trim() : null,
          image_url: row['Gambar URL'] ? String(row['Gambar URL']).trim() : undefined,
        };
      });

      setImportProgress(50);

      // Send all data to backend in one request
      const result = await api.importProducts(mappedProducts);

      setImportProgress(100);
      setImportResult(result);

      if (result.success > 0 || result.updated > 0) {
        onImportComplete();
        toast({ title: "Import Selesai", description: `${result.success} produk baru, ${result.updated} produk diupdate, ${result.failed} gagal` });
      } else if (result.failed > 0) {
        toast({ title: "Import Gagal", description: `Semua ${result.failed} baris gagal diimport.`, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Import Gagal", description: error.message, variant: "destructive" });
      setImportResult({ success: 0, updated: 0, failed: 1, errors: [{ row: 0, field: 'File', message: error.message }] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="sm:h-10">
        {exporting ? <Loader2 className="h-4 w-4 animate-spin sm:mr-2" /> : <Download className="h-4 w-4 sm:mr-2" />}
        <span className="hidden sm:inline">Export</span>
      </Button>

      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="sm:h-10">
        <Upload className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="sm:h-10" title="Download Template Excel">
        <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Template</span>
      </Button>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />Import Produk dari Excel
            </DialogTitle>
            <DialogDescription>{importing ? 'Sedang memproses file...' : 'Hasil import data produk'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Memproses data...</span><span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {importResult && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.success}</div>
                    <div className="text-xs text-muted-foreground">Produk Baru</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.updated}</div>
                    <div className="text-xs text-muted-foreground">Diupdate</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.failed}</div>
                    <div className="text-xs text-muted-foreground">Gagal</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Detail Error</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {importResult.errors.map((error, idx) => (
                          <Alert key={idx} variant="destructive" className="py-2">
                            <AlertDescription className="text-xs">
                              Baris {error.row} - {error.field}: {error.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductExcelImport;
