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
import { Search, Plus, Receipt, ShoppingCart, Trash2, Calendar, Download, Pencil } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, type TransactionItem, type Transaction } from '@/hooks/useTransactions';
import { useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import jsPDF from 'jspdf';

const Transactions = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { toast } = useToast();
  const { transactions, loading, createTransaction: createTransactionInDB, updateTransaction: updateTransactionInDB, deleteTransaction } = useTransactions();
  
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [showEditTransactionDialog, setShowEditTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  
  // New transaction form state
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [technicianFee, setTechnicianFee] = useState(0);
  const [otherFees, setOtherFees] = useState(0);

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setCustomerName(transaction.customer_name);
    setPaymentMethod(transaction.payment_method);
    setTransactionItems(transaction.items);
    setTechnicianFee(transaction.technician_fee);
    setOtherFees(transaction.other_fees);
    setShowEditTransactionDialog(true);
  };

  const closeEditDialog = () => {
    setShowEditTransactionDialog(false);
    setEditingTransaction(null);
    setCustomerName('');
    setPaymentMethod('cash');
    setTransactionItems([]);
    setTechnicianFee(0);
    setOtherFees(0);
    setSelectedProduct('');
    setQuantity(1);
  };

  // Barcode scanner effect - always active when dialog is open
  useEffect(() => {
    if (!showNewTransactionDialog && !showEditTransactionDialog) return;

    let barcodeBuffer = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only process barcode input when dialog is open
      if (showNewTransactionDialog || showEditTransactionDialog) {
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
  }, [showNewTransactionDialog, showEditTransactionDialog]);

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

  const generateReceipt = (transaction: Transaction) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header with Autopart69 branding (no background)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTOPART69', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Bengkel & Toko Sparepart', pageWidth / 2, 23, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text('Jl. Raya MM (Pasar Baru), Dampit', pageWidth / 2, 29, { align: 'center' });
    doc.text('Telp: 081217177949', pageWidth / 2, 34, { align: 'center' });
    
    // Transaction details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STRUK PEMBELIAN', pageWidth / 2, 48, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 58;
    
    doc.text(`ID Transaksi: ${transaction.id.substring(0, 8)}`, 15, yPos);
    yPos += 7;
    doc.text(`Tanggal: ${new Date(transaction.date).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 15, yPos);
    yPos += 7;
    doc.text(`Pelanggan: ${transaction.customer_name}`, 15, yPos);
    yPos += 7;
    doc.text(`Pembayaran: ${getPaymentMethodLabel(transaction.payment_method)}`, 15, yPos);
    yPos += 10;
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 7;
    
    // Items header
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 15, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Harga', 140, yPos);
    doc.text('Total', pageWidth - 15, yPos, { align: 'right' });
    yPos += 5;
    
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 7;
    
    // Items
    doc.setFont('helvetica', 'normal');
    transaction.items.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Truncate product name if too long
      const maxNameLength = 40;
      const productName = item.product_name.length > maxNameLength 
        ? item.product_name.substring(0, maxNameLength) + '...' 
        : item.product_name;
      
      doc.text(productName, 15, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(formatPrice(item.price), 140, yPos);
      doc.text(formatPrice(item.total), pageWidth - 15, yPos, { align: 'right' });
      yPos += 7;
    });
    
    yPos += 3;
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 7;
    
    // Subtotal
    const subtotal = transaction.items.reduce((sum, item) => sum + item.total, 0);
    doc.text('Subtotal Produk:', 15, yPos);
    doc.text(formatPrice(subtotal), pageWidth - 15, yPos, { align: 'right' });
    yPos += 7;
    
    // Technician fee
    if (transaction.technician_fee > 0) {
      doc.text('Biaya Teknisi:', 15, yPos);
      doc.text(formatPrice(transaction.technician_fee), pageWidth - 15, yPos, { align: 'right' });
      yPos += 7;
    }
    
    // Other fees
    if (transaction.other_fees > 0) {
      doc.text('Biaya Lain-lain:', 15, yPos);
      doc.text(formatPrice(transaction.other_fees), pageWidth - 15, yPos, { align: 'right' });
      yPos += 7;
    }
    
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 7;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 15, yPos);
    doc.text(formatPrice(transaction.total_amount), pageWidth - 15, yPos, { align: 'right' });
    
    // Footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Terima kasih atas kunjungan Anda!', pageWidth / 2, yPos, { align: 'center' });
    doc.setFontSize(8);
    doc.text('AUTOPART69 - Solusi Terpercaya Untuk Kendaraan Anda', pageWidth / 2, yPos + 5, { align: 'center' });
    
    return doc;
  };

  const handleCreateReceipt = (transaction: Transaction) => {
    try {
      const doc = generateReceipt(transaction);
      doc.save(`Struk-${transaction.id.substring(0, 8)}.pdf`);
      
      toast({
        title: "Berhasil",
        description: "Struk berhasil dibuat dan diunduh"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat struk",
        variant: "destructive"
      });
    }
  };

  const handleShareReceipt = async (transaction: Transaction) => {
    try {
      const doc = generateReceipt(transaction);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `Struk-${transaction.id.substring(0, 8)}.pdf`, { type: 'application/pdf' });
      
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Struk Transaksi - ${transaction.customer_name}`,
          text: `Struk pembelian dari Autopart69\nTotal: ${formatPrice(transaction.total_amount)}`,
          files: [pdfFile]
        });
        
        toast({
          title: "Berhasil",
          description: "Struk berhasil dibagikan"
        });
      } else {
        // Fallback: Download the file
        doc.save(`Struk-${transaction.id.substring(0, 8)}.pdf`);
        
        toast({
          title: "Info",
          description: "Fitur berbagi tidak didukung. Struk telah diunduh.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membagikan struk",
        variant: "destructive"
      });
    }
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
    return transactionItems.reduce((sum, item) => sum + item.total, 0) + technicianFee + otherFees;
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
      })),
      technicianFee,
      otherFees
    );

    if (result?.success) {
      // Reset form
      setCustomerName('');
      setPaymentMethod('cash');
      setTransactionItems([]);
      setTechnicianFee(0);
      setOtherFees(0);
      setShowNewTransactionDialog(false);
    }
  };

  const updateTransaction = async () => {
    if (!editingTransaction) return;

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

    const result = await updateTransactionInDB(
      editingTransaction.id,
      customerName,
      paymentMethod,
      transactionItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      technicianFee,
      otherFees
    );

    if (result?.success) {
      closeEditDialog();
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

                      <div>
                        <Label htmlFor="technician_fee">Biaya Teknisi</Label>
                        <Input
                          id="technician_fee"
                          type="number"
                          min="0"
                          value={technicianFee}
                          onChange={(e) => setTechnicianFee(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="other_fees">Biaya Lain-lain (Opsional)</Label>
                        <Input
                          id="other_fees"
                          type="number"
                          min="0"
                          value={otherFees}
                          onChange={(e) => setOtherFees(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
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
                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal Produk:</span>
                            <span>{formatPrice(transactionItems.reduce((sum, item) => sum + item.total, 0))}</span>
                          </div>
                          {technicianFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Biaya Teknisi:</span>
                              <span>{formatPrice(technicianFee)}</span>
                            </div>
                          )}
                          {otherFees > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Biaya Lain-lain:</span>
                              <span>{formatPrice(otherFees)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
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

              {/* Edit Transaction Dialog */}
              <Dialog open={showEditTransactionDialog} onOpenChange={(open) => !open && closeEditDialog()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Transaksi</DialogTitle>
                    <DialogDescription>
                      Ubah detail transaksi dan produk.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-customer">Nama Pelanggan</Label>
                        <Input
                          id="edit-customer"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Masukkan nama pelanggan"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-payment">Metode Pembayaran</Label>
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

                      <div>
                        <Label htmlFor="edit-technician-fee">Biaya Teknisi</Label>
                        <Input
                          id="edit-technician-fee"
                          type="number"
                          min="0"
                          value={technicianFee}
                          onChange={(e) => setTechnicianFee(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-other-fees">Biaya Lain-lain (Opsional)</Label>
                        <Input
                          id="edit-other-fees"
                          type="number"
                          min="0"
                          value={otherFees}
                          onChange={(e) => setOtherFees(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
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
                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal Produk:</span>
                            <span>{formatPrice(transactionItems.reduce((sum, item) => sum + item.total, 0))}</span>
                          </div>
                          {technicianFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Biaya Teknisi:</span>
                              <span>{formatPrice(technicianFee)}</span>
                            </div>
                          )}
                          {otherFees > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Biaya Lain-lain:</span>
                              <span>{formatPrice(otherFees)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{formatPrice(getTotalAmount())}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={closeEditDialog}>
                      Batal
                    </Button>
                    <Button onClick={updateTransaction}>
                      Simpan Perubahan
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(transaction)}
                              title="Edit Transaksi"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShareReceipt(transaction)}
                              title="Unduh Struk"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
