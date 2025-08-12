import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Receipt, ShoppingCart, Trash2, Calendar } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, type TransactionItem, type Transaction } from '@/hooks/useTransactions';
import { useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';

const Transactions = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { toast } = useToast();
  const { transactions, loading, createTransaction: createTransactionInDB, deleteTransaction } = useTransactions();
  
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  
  // New transaction form state
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Barcode scanner effect - always active when dialog is open
  useEffect(() => {
    if (!showNewTransactionDialog) return;

    let barcodeBuffer = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only process barcode input when dialog is open
      if (showNewTransactionDialog) {
        // Don't interfere with normal input fields
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Enter') {
          // Barcode scan complete
          if (barcodeBuffer.length > 0) {
            handleBarcodeScanned(barcodeBuffer);
            barcodeBuffer = '';
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
      }
    };

    document.addEventListener('keypress', handleKeyPress, true);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress, true);
      clearTimeout(timeoutId);
    };
  }, [showNewTransactionDialog]);

  const handleBarcodeScanned = (barcode: string) => {
    // Find product by barcode
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      setSelectedProduct(product.id);
      toast({
        title: "Produk Ditemukan",
        description: `${product.name} berhasil dipilih dari barcode`,
      });
    } else {
      toast({
        title: "Produk Tidak Ditemukan",
        description: `Tidak ada produk dengan barcode: ${barcode}`,
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      transfer: 'Transfer',
      card: 'Kartu'
    };
    return labels[method] || method;
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const result = await deleteTransaction(transactionId);
    if (result?.success) {
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus"
      });
    }
  };

  const addItemToTransaction = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast({
        title: "Error",
        description: "Produk tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Jumlah harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    // Check stock availability immediately
    const currentStock = product.stock;
    
    // Calculate how much of this product is already in the transaction
    const existingQuantity = transactionItems
      .filter(item => item.product_id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const totalRequestedQuantity = existingQuantity + quantity;

    if (totalRequestedQuantity > currentStock) {
      toast({
        title: "Stok Tidak Mencukupi",
        description: `Stok ${product.name} tidak mencukupi. Stok tersedia: ${currentStock}, sudah dipilih: ${existingQuantity}, diminta tambahan: ${quantity}`,
        variant: "destructive"
      });
      return;
    }

    const newItem: TransactionItem = {
      id: Date.now().toString(),
      product_id: product.id,
      product_name: product.name,
      quantity: quantity,
      price: product.price,
      total: quantity * product.price
    };

    setTransactionItems([...transactionItems, newItem]);
    setSelectedProduct('');
    setQuantity(1);

    // Show success message
    toast({
      title: "Item Ditambahkan",
      description: `${product.name} (${quantity} pcs) berhasil ditambahkan ke transaksi`
    });
  };

  const removeItemFromTransaction = (itemId: string) => {
    setTransactionItems(transactionItems.filter(item => item.id !== itemId));
  };

  const getTotalAmount = () => {
    return transactionItems.reduce((sum, item) => sum + item.total, 0);
  };

  const createTransaction = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Nama pelanggan harus diisi",
        variant: "destructive"
      });
      return;
    }

    if (transactionItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada 1 item",
        variant: "destructive"
      });
      return;
    }

    // Create transaction in database (stock validation will happen in the hook but should not fail since we already validated)
    const result = await createTransactionInDB(
      customerName,
      paymentMethod,
      transactionItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    );

    if (result?.success) {
      // Reset form
      setCustomerName('');
      setPaymentMethod('cash');
      setTransactionItems([]);
      setShowNewTransactionDialog(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPayment = selectedPaymentFilter === 'all' || transaction.payment_method === selectedPaymentFilter;
    
    let matchesDate = true;
    if (selectedDateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = transaction.date === today;
    } else if (selectedDateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(transaction.date) >= weekAgo;
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.total_amount, 0);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Transaksi</h1>
              </div>
              <Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Transaksi Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Buat Transaksi Baru</DialogTitle>
                    <DialogDescription>
                      Tambahkan detail transaksi dan produk yang dibeli.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customer">Nama Pelanggan</Label>
                        <Input
                          id="customer"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Masukkan nama pelanggan"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="payment">Metode Pembayaran</Label>
                        <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Tunai</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="card">Kartu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tambah Produk</Label>
                        
                        <div className="flex gap-2">
                          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Pilih produk" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {formatPrice(product.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                            className="w-20"
                            min="1"
                          />
                          <Button onClick={addItemToTransaction} disabled={!selectedProduct}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Item Transaksi</Label>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                        {transactionItems.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">Belum ada item</p>
                        ) : (
                          <div className="space-y-2">
                            {transactionItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div className="flex-1">
                                  <div className="font-medium">{item.product_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.quantity} x {formatPrice(item.price)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{formatPrice(item.total)}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeItemFromTransaction(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {transactionItems.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total:</span>
                            <span>{formatPrice(getTotalAmount())}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTransactionDialog(false)}>
                      Batal
                    </Button>
                    <Button onClick={createTransaction}>
                      Simpan Transaksi
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Transaksi</CardDescription>
                <CardTitle className="text-2xl">{filteredTransactions.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Pendapatan</CardDescription>
                <CardTitle className="text-2xl">{formatPrice(totalRevenue)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Transaksi Hari Ini</CardDescription>
                <CardTitle className="text-2xl">
                  {transactions.filter(t => t.date === new Date().toISOString().split('T')[0]).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rata-rata per Transaksi</CardDescription>
                <CardTitle className="text-2xl">
                  {formatPrice(filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi atau pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tanggal</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">7 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPaymentFilter} onValueChange={setSelectedPaymentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pembayaran</SelectItem>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="card">Kartu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada transaksi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono">{transaction.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(transaction.date).toLocaleDateString('id-ID')}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.customer_name}</TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(transaction.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getPaymentMethodLabel(transaction.payment_method)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status === 'completed' ? 'Selesai' : 
                             transaction.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.items.map((item, index) => (
                              <div key={item.id}>
                                {item.product_name} ({item.quantity}x)
                                {index < transaction.items.length - 1 && <br />}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Transactions;
