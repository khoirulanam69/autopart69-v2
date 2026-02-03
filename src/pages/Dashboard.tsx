
import { useEffect } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';

const Dashboard = () => {
  useEffect(() => {
    document.title = 'Dashboard | Autopart69';
  }, []);
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

      {/* Sales Chart */}
      <div className="mb-8">
        <SalesChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
};

export default Dashboard;
