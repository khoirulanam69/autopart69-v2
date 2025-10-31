import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import { useIncomeExpenses } from '@/hooks/useIncomeExpenses';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Finance() {
  const { transactions } = useTransactions();
  const { products } = useProducts();
  const { incomeExpenses, addIncomeExpense, updateIncomeExpense, deleteIncomeExpense } = useIncomeExpenses();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Helper to get product purchase price
  const getProductCost = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    return product?.purchase_price ? Number(product.purchase_price) : 0;
  };

  // Filter income/expenses first
  const filteredIncomeExpenses = incomeExpenses.filter(item => {
    const itemDate = parseISO(item.date);
    const now = new Date();
    switch (selectedPeriod) {
      case 'day':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return itemDate >= weekAgo;
      case 'month':
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      case 'year':
        return itemDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const totalIncome = filteredIncomeExpenses
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpense = filteredIncomeExpenses
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // Calculate financial metrics
  const calculateMetrics = () => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      switch (selectedPeriod) {
        case 'day':
          return transactionDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return transactionDate >= weekAgo;
        case 'month':
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear();
        case 'year':
          return transactionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    const totalRevenue = filtered.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const totalCost = filtered.reduce((sum, t) => {
      const itemsCost = t.items.reduce((itemSum, item) => 
        itemSum + (Number(item.quantity) * getProductCost(item.product_id)), 0
      );
      return sum + itemsCost;
    }, 0);
    const grossProfit = totalRevenue - totalCost;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate net profit and net margin
    const netProfit = (grossProfit + totalIncome) - totalExpense;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { 
      totalRevenue, 
      totalCost, 
      grossProfit, 
      grossMargin, 
      netProfit,
      netMargin,
      transactionCount: filtered.length 
    };
  };

  const metrics = calculateMetrics();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'day': return 'Hari Ini';
      case 'week': return 'Minggu Ini';
      case 'month': return 'Bulan Ini';
      case 'year': return 'Tahun Ini';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateIncomeExpense({
        id: editingItem.id,
        ...formData,
        amount: Number(formData.amount),
      });
    } else {
      addIncomeExpense({
        ...formData,
        amount: Number(formData.amount),
      });
    }
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      amount: item.amount.toString(),
      category: item.category,
      description: item.description || '',
      date: item.date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteIncomeExpense(itemToDelete);
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };


  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Manajemen Keuangan</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Kelola dan pantau keuangan bisnis Anda</p>
        </div>
        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hari Ini</SelectItem>
            <SelectItem value="week">Minggu Ini</SelectItem>
            <SelectItem value="month">Bulan Ini</SelectItem>
            <SelectItem value="year">Tahun Ini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financial Summary Cards */}
      <div className="w-full grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {metrics.totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {metrics.totalCost.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Kotor</CardTitle>
            {metrics.grossProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {metrics.grossProfit.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Kotor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.grossMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.transactionCount} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            {metrics.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {metrics.netProfit.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Bersih</CardTitle>
            {metrics.netMargin >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.netMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Reports */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Ringkasan</TabsTrigger>
          <TabsTrigger value="income-expenses" className="text-xs sm:text-sm py-2">Pemasukan & Pengeluaran</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm py-2">Detail Transaksi</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm py-2">Analisis Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Keuangan {getPeriodLabel()}</CardTitle>
              <CardDescription>
                Gambaran umum performa keuangan bisnis Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Jumlah Transaksi</span>
                  <span className="font-bold">{metrics.transactionCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Total Pendapatan</span>
                  <span className="font-bold text-green-600">Rp {metrics.totalRevenue.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Total Biaya Produk</span>
                  <span className="font-bold text-orange-600">Rp {metrics.totalCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Laba Kotor</span>
                  <span className={`font-bold ${metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {metrics.grossProfit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Margin Kotor</span>
                  <span className="font-bold">{metrics.grossMargin.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Pemasukan Lain</span>
                  <span className="font-bold text-green-600">Rp {totalIncome.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Pengeluaran Lain</span>
                  <span className="font-bold text-red-600">Rp {totalExpense.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Laba Bersih</span>
                  <span className={`font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {metrics.netProfit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Margin Bersih</span>
                  <span className={`font-bold ${metrics.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.netMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pemasukan & Pengeluaran</CardTitle>
                  <CardDescription>
                    Catat pemasukan dan pengeluaran lainnya
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingItem(null);
                      setFormData({
                        type: 'expense',
                        amount: '',
                        category: '',
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                      });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Edit Data' : 'Tambah Data'}</DialogTitle>
                      <DialogDescription>
                        {editingItem ? 'Ubah data pemasukan atau pengeluaran' : 'Tambah data pemasukan atau pengeluaran baru'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="type">Tipe</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value: 'income' | 'expense') =>
                              setFormData({ ...formData, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Pemasukan</SelectItem>
                              <SelectItem value="expense">Pengeluaran</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Jumlah</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Kategori</Label>
                          <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Keterangan</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Tanggal</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button type="submit">
                          {editingItem ? 'Simpan' : 'Tambah'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomeExpenses.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(parseISO(item.date), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detail Transaksi</CardTitle>
              <CardDescription>
                Daftar lengkap transaksi dalam periode {getPeriodLabel().toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead className="text-right">Laba</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(t => {
                      const transactionDate = parseISO(t.date);
                      const now = new Date();
                      switch (selectedPeriod) {
                        case 'day':
                          return transactionDate.toDateString() === now.toDateString();
                        case 'week':
                          const weekAgo = new Date(now);
                          weekAgo.setDate(now.getDate() - 7);
                          return transactionDate >= weekAgo;
                        case 'month':
                          return transactionDate.getMonth() === now.getMonth() && 
                                 transactionDate.getFullYear() === now.getFullYear();
                        case 'year':
                          return transactionDate.getFullYear() === now.getFullYear();
                        default:
                          return true;
                      }
                    })
                    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
                    .map((transaction) => {
                      const cost = transaction.items.reduce((sum, item) => 
                        sum + (Number(item.quantity) * getProductCost(item.product_id)), 0
                      );
                      const profit = Number(transaction.total_amount) - cost;
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell>{transaction.customer_name}</TableCell>
                          <TableCell>
                            {transaction.items.map(item => item.product_name).join(', ').substring(0, 30)}
                            {transaction.items.map(item => item.product_name).join(', ').length > 30 && '...'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rp {Number(transaction.total_amount).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            Rp {cost.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rp {profit.toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Produk</CardTitle>
              <CardDescription>
                Produk terlaris dan kontribusi terhadap pendapatan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead className="text-right">Laba</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const productStats: Record<string, {
                      name: string;
                      quantity: number;
                      revenue: number;
                      cost: number;
                    }> = {};

                    transactions
                      .filter(t => {
                        const transactionDate = parseISO(t.date);
                        const now = new Date();
                        switch (selectedPeriod) {
                          case 'day':
                            return transactionDate.toDateString() === now.toDateString();
                          case 'week':
                            const weekAgo = new Date(now);
                            weekAgo.setDate(now.getDate() - 7);
                            return transactionDate >= weekAgo;
                          case 'month':
                            return transactionDate.getMonth() === now.getMonth() && 
                                   transactionDate.getFullYear() === now.getFullYear();
                          case 'year':
                            return transactionDate.getFullYear() === now.getFullYear();
                          default:
                            return true;
                        }
                      })
                      .forEach(transaction => {
                        transaction.items.forEach(item => {
                          const key = item.product_id || item.product_name;
                          if (!productStats[key]) {
                            productStats[key] = {
                              name: item.product_name,
                              quantity: 0,
                              revenue: 0,
                              cost: 0,
                            };
                          }
                          productStats[key].quantity += Number(item.quantity);
                          productStats[key].revenue += Number(item.total);
                          productStats[key].cost += Number(item.quantity) * getProductCost(item.product_id);
                        });
                      });

                    return Object.values(productStats)
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((stat) => {
                        const profit = stat.revenue - stat.cost;
                        const margin = stat.revenue > 0 ? (profit / stat.revenue) * 100 : 0;
                        
                        return (
                          <TableRow key={stat.name}>
                            <TableCell className="font-medium">{stat.name}</TableCell>
                            <TableCell className="text-right">{stat.quantity}</TableCell>
                            <TableCell className="text-right">
                              Rp {stat.revenue.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              Rp {stat.cost.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Rp {profit.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right">{margin.toFixed(1)}%</TableCell>
                          </TableRow>
                        );
                      });
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}