import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();

  // Export products to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all products for export
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Prepare data for Excel
      const exportData = (allProducts || []).map((product, index) => ({
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

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 36 },  // ID
        { wch: 30 },  // Nama
        { wch: 12 },  // Kategori
        { wch: 15 },  // Harga Jual
        { wch: 15 },  // Harga Beli
        { wch: 8 },   // Stok
        { wch: 20 },  // Supplier
        { wch: 20 },  // Barcode
        { wch: 50 },  // Gambar URL
        { wch: 15 },  // Tanggal Dibuat
        { wch: 15 },  // Terakhir Update
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `products_export_${date}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Berhasil",
        description: `${allProducts?.length || 0} produk berhasil diekspor ke ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Download template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID': '(Kosongkan untuk produk baru)',
        'Nama Produk': 'Contoh Produk',
        'Kategori': 'sparepart',
        'Harga Jual': 50000,
        'Harga Beli': 35000,
        'Stok': 10,
        'Supplier': 'Supplier ABC',
        'Barcode': 'PRD123456',
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Add instructions sheet
    const instructionsData = [
      ['PETUNJUK IMPORT DATA PRODUK'],
      [''],
      ['Kolom yang wajib diisi:'],
      ['- Nama Produk: Nama produk (wajib)'],
      ['- Kategori: Pilihan: sparepart, oli, ban, aki, aksesoris, tools, lainnya (wajib)'],
      ['- Harga Jual: Harga jual dalam angka (wajib)'],
      ['- Harga Beli: Harga beli dalam angka (wajib)'],
      [''],
      ['Kolom opsional:'],
      ['- ID: Isi dengan ID produk yang sudah ada untuk update, kosongkan untuk produk baru'],
      ['- Stok: Jumlah stok (default: 0)'],
      ['- Supplier: Nama supplier'],
      ['- Barcode: Kode barcode produk'],
      [''],
      ['Catatan:'],
      ['- Jangan mengubah nama kolom pada header'],
      ['- Pastikan kategori sesuai dengan pilihan yang tersedia'],
      ['- Harga harus berupa angka tanpa titik atau koma'],
      ['- Untuk update produk, pastikan ID sudah benar'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 80 }];

    ws['!cols'] = [
      { wch: 36 },  // ID
      { wch: 30 },  // Nama
      { wch: 12 },  // Kategori
      { wch: 15 },  // Harga Jual
      { wch: 15 },  // Harga Beli
      { wch: 8 },   // Stok
      { wch: 20 },  // Supplier
      { wch: 20 },  // Barcode
    ];

    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Petunjuk');
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    XLSX.writeFile(wb, 'template_import_produk.xlsx');

    toast({
      title: "Template Diunduh",
      description: "Template Excel berhasil diunduh. Lihat sheet 'Petunjuk' untuk panduan.",
    });
  };

  // Validate single product data
  const validateProduct = (row: any, rowIndex: number): { valid: boolean; errors: ImportError[] } => {
    const errors: ImportError[] = [];
    const rowNum = rowIndex + 2; // Excel rows start at 1, plus header

    // Required fields
    if (!row['Nama Produk'] || String(row['Nama Produk']).trim() === '') {
      errors.push({ row: rowNum, field: 'Nama Produk', message: 'Nama produk wajib diisi' });
    }

    if (!row['Kategori'] || String(row['Kategori']).trim() === '') {
      errors.push({ row: rowNum, field: 'Kategori', message: 'Kategori wajib diisi' });
    } else if (!VALID_CATEGORIES.includes(String(row['Kategori']).toLowerCase().trim())) {
      errors.push({ 
        row: rowNum, 
        field: 'Kategori', 
        message: `Kategori tidak valid. Pilihan: ${VALID_CATEGORIES.join(', ')}` 
      });
    }

    const hargaJual = Number(row['Harga Jual']);
    if (isNaN(hargaJual) || hargaJual < 0) {
      errors.push({ row: rowNum, field: 'Harga Jual', message: 'Harga jual harus berupa angka positif' });
    }

    const hargaBeli = Number(row['Harga Beli']);
    if (isNaN(hargaBeli) || hargaBeli < 0) {
      errors.push({ row: rowNum, field: 'Harga Beli', message: 'Harga beli harus berupa angka positif' });
    }

    const stok = row['Stok'] !== undefined && row['Stok'] !== '' ? Number(row['Stok']) : 0;
    if (isNaN(stok) || stok < 0) {
      errors.push({ row: rowNum, field: 'Stok', message: 'Stok harus berupa angka positif' });
    }

    return { valid: errors.length === 0, errors };
  };

  // Check for duplicate barcodes
  const checkDuplicateBarcode = async (barcode: string, excludeId?: string): Promise<boolean> => {
    if (!barcode || barcode.trim() === '') return false;

    let query = supabase
      .from('products')
      .select('id')
      .eq('barcode', barcode.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.maybeSingle();
    return !!data;
  };

  // Handle file import
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

      if (jsonData.length === 0) {
        throw new Error('File Excel kosong atau format tidak sesuai');
      }

      const result: ImportResult = {
        success: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };

      const totalRows = jsonData.length;
      const barcodeSet = new Set<string>();

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        setImportProgress(Math.round(((i + 1) / totalRows) * 100));

        // Validate row
        const validation = validateProduct(row, i);
        if (!validation.valid) {
          result.failed++;
          result.errors.push(...validation.errors);
          continue;
        }

        // Check for duplicate barcode in current import batch
        const barcode = row['Barcode'] ? String(row['Barcode']).trim() : null;
        if (barcode && barcodeSet.has(barcode)) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            field: 'Barcode',
            message: `Barcode duplikat dalam file import: ${barcode}`,
          });
          continue;
        }

        // Prepare product data
        const productId = row['ID'] && String(row['ID']).trim() !== '' && 
                         String(row['ID']).trim() !== '(Kosongkan untuk produk baru)' 
                         ? String(row['ID']).trim() : null;

        const productData = {
          name: String(row['Nama Produk']).trim(),
          category: String(row['Kategori']).toLowerCase().trim() as Product['category'],
          price: Number(row['Harga Jual']),
          purchase_price: Number(row['Harga Beli']),
          stock: row['Stok'] !== undefined && row['Stok'] !== '' ? Number(row['Stok']) : 0,
          supplier: row['Supplier'] ? String(row['Supplier']).trim() : null,
          barcode: barcode,
        };

        try {
          // Check for duplicate barcode in database
          if (barcode) {
            const isDuplicate = await checkDuplicateBarcode(barcode, productId || undefined);
            if (isDuplicate) {
              result.failed++;
              result.errors.push({
                row: i + 2,
                field: 'Barcode',
                message: `Barcode sudah digunakan produk lain: ${barcode}`,
              });
              continue;
            }
            barcodeSet.add(barcode);
          }

          if (productId) {
            // Update existing product
            const { error } = await supabase
              .from('products')
              .update(productData)
              .eq('id', productId);

            if (error) {
              if (error.code === 'PGRST116') {
                result.failed++;
                result.errors.push({
                  row: i + 2,
                  field: 'ID',
                  message: `Produk dengan ID tidak ditemukan: ${productId}`,
                });
              } else {
                throw error;
              }
            } else {
              result.updated++;
            }
          } else {
            // Create new product
            const { error } = await supabase
              .from('products')
              .insert([{ ...productData, created_by: user?.id }]);

            if (error) throw error;
            result.success++;
          }
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            field: 'Database',
            message: error.message || 'Gagal menyimpan ke database',
          });
        }
      }

      setImportResult(result);

      if (result.success > 0 || result.updated > 0) {
        onImportComplete();
        toast({
          title: "Import Selesai",
          description: `${result.success} produk baru, ${result.updated} produk diupdate, ${result.failed} gagal`,
        });
      } else if (result.failed > 0) {
        toast({
          title: "Import Gagal",
          description: `Semua ${result.failed} baris gagal diimport. Lihat detail error.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Import Gagal",
        description: error.message,
        variant: "destructive",
      });
      setImportResult({
        success: 0,
        updated: 0,
        failed: 1,
        errors: [{ row: 0, field: 'File', message: error.message }],
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting}
        className="sm:h-10"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
        ) : (
          <Download className="h-4 w-4 sm:mr-2" />
        )}
        <span className="hidden sm:inline">Export</span>
      </Button>

      {/* Import Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="sm:h-10"
      >
        <Upload className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      {/* Template Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownloadTemplate}
        className="sm:h-10"
        title="Download Template Excel"
      >
        <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Template</span>
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Produk dari Excel
            </DialogTitle>
            <DialogDescription>
              {importing ? 'Sedang memproses file...' : 'Hasil import data produk'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Memproses data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {importResult && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importResult.success}
                    </div>
                    <div className="text-xs text-muted-foreground">Produk Baru</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {importResult.updated}
                    </div>
                    <div className="text-xs text-muted-foreground">Diupdate</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResult.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Gagal</div>
                  </div>
                </div>

                {/* Errors */}
                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Detail Error ({importResult.errors.length})
                    </h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {importResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive" className="py-2">
                            <AlertDescription className="text-xs">
                              <span className="font-medium">Baris {error.row}</span>
                              {error.field !== 'File' && (
                                <span className="text-muted-foreground"> - {error.field}</span>
                              )}
                              <span className="block mt-1">{error.message}</span>
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

          {!importing && (
            <div className="flex justify-end">
              <Button onClick={() => setShowImportDialog(false)}>
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductExcelImport;
