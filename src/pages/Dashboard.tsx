
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ProductsChart } from '@/components/dashboard/ProductsChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Monitoring</h1>
        <p className="text-muted-foreground">
          Pantau performa bengkel dan analitik bisnis Anda
        </p>
      </div>

      {/* Stats Overview */}
      <DashboardStats />

      {/* Low Stock Alert */}
      <LowStockAlert />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesChart />
        <ProductsChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
};

export default Dashboard;
