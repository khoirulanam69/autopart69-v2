
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import { ShoppingCart, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';

export const DashboardStats = () => {
  const { transactions } = useTransactions();
  const { totalCount, lowStockProducts } = useProducts();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.date === today);
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    
    const totalProducts = totalCount;
    const lowStock = lowStockProducts.length;

    return {
      totalRevenue,
      todayRevenue,
      totalTransactions: transactions.length,
      todayTransactions: todayTransactions.length,
      totalProducts,
      lowStock
    };
  }, [transactions, totalCount, lowStockProducts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            Hari ini: {formatCurrency(stats.todayRevenue)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          <p className="text-xs text-muted-foreground">
            Hari ini: {stats.todayTransactions} transaksi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            Produk aktif di inventory
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stok Kosong</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.lowStock}</div>
          <p className="text-xs text-muted-foreground">
            Produk perlu direstock
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
