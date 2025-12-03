import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Edit, Trash2, Package, Printer, AlertTriangle, Loader2 } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
import { AuthGuard } from '@/components/AuthGuard';
import { LazyImage } from '@/components/LazyImage';

const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'sparepart', label: 'Sparepart' },
  { value: 'oli', label: 'Oli' },
  { value: 'ban', label: 'Ban' },
  { value: 'aki', label: 'Aki' },
  { value: 'aksesoris', label: 'Aksesoris' },
  { value: 'tools', label: 'Tools' },
  { value: 'lainnya', label: 'Lainnya' }
];

const Products = () => {
  const { products, loading, hasMore, createProduct, updateProduct, deleteProduct, searchProducts, loadMore } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [columnCount, setColumnCount] = useState(1);
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Responsive column count based on screen size
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth >= 1024) {
        setColumnCount(3); // lg breakpoint
      } else if (window.innerWidth >= 768) {
        setColumnCount(2); // md breakpoint
      } else {
        setColumnCount(1); // mobile
      }
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const rowCount = Math.ceil(products.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 415,
    overscan: 2,
  });

  // Detect when user scrolls near bottom for infinite loading
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 400;
      
      if (isNearBottom && !loading && hasMore && !isSearching) {
        loadMore();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, loadMore, isSearching]);

  const handleSearch = () => {
    setIsSearching(true);
    searchProducts(searchQuery);
  };

  const handleCreateProduct = async (data: any, imageFile?: File) => {
    return await createProduct(data, imageFile);
  };

  const handleUpdateProduct = async (data: any, imageFile?: File) => {
    if (editingProduct) {
      return await updateProduct(editingProduct.id, data, imageFile);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
  };

  const handlePrintBarcode = (product: Product) => {
    const canvas = document.createElement('canvas');
    import('jsbarcode').then((JsBarcode) => {
      JsBarcode.default(canvas, product.barcode || product.id, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true
      });
      
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
                <img src="${canvas.toDataURL()}" alt="Barcode" />
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
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      sparepart: 'bg-blue-100 text-blue-800',
      oli: 'bg-green-100 text-green-800',
      ban: 'bg-purple-100 text-purple-800',
      aki: 'bg-orange-100 text-orange-800',
      aksesoris: 'bg-pink-100 text-pink-800',
      tools: 'bg-gray-100 text-gray-800',
      lainnya: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card shrink-0">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-lg sm:text-2xl font-bold">Management Produk</h1>
              </div>
              <Button onClick={() => setShowForm(true)} size="sm" className="sm:h-10">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Produk</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} size="sm" className="sm:h-10">Cari</Button>
            </div>
          </div>

          {/* Virtualized Products Grid */}
          {products.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada produk</p>
            </div>
          ) : (
            <div
              ref={parentRef}
              className="flex-1 overflow-auto"
              style={{ contain: 'strict' }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * columnCount;
                  const rowProducts = products.slice(startIndex, startIndex + columnCount);

                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-1">
                        {rowProducts.map((product) => (
                          <Card key={product.id} className="h-fit hover:shadow-lg transition-shadow">
                            {product.image_url && (
                              <LazyImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-40 sm:h-48 object-cover"
                              />
                            )}
                            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm sm:text-base line-clamp-2">{product.name}</CardTitle>
                                  <CardDescription className="mt-1 text-xs">
                                    {CATEGORIES.find(cat => cat.value === product.category)?.label}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-0.5 sm:gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlePrintBarcode(product)}
                                    title="Print Barcode"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  >
                                    <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditProduct(product)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus produk "{product.name}"? 
                                          Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteProduct(product.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                              <div className="space-y-1.5 sm:space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge className={`${getCategoryBadgeColor(product.category)} text-xs`} variant="secondary">
                                    Stok: {product.stock}
                                  </Badge>
                                  <div className="text-right">
                                    <div className="text-sm sm:text-base font-bold">
                                      {formatPrice(product.price)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Beli: {formatPrice(product.purchase_price)}
                                    </div>
                                  </div>
                                </div>

                                {product.supplier && (
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">Supplier:</span>
                                    <span className="ml-1 line-clamp-1">{product.supplier}</span>
                                  </div>
                                )}

                                {product.barcode && (
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">Barcode:</span>
                                    <span className="ml-1 font-mono line-clamp-1">{product.barcode}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Loading indicator for infinite scroll */}
              {loading && hasMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Product Form */}
        <ProductForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingProduct(null);
          }}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          product={editingProduct}
          title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
        />
      </div>
    </AuthGuard>
  );
};

export default Products;
