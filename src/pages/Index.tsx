
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Selamat Datang di Bengkel Hub</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Sistem Manajemen Bengkel Terintegrasi
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <Link to="/dashboard" className="p-6 border border-border rounded-lg hover:bg-accent transition-colors">
            <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
            <p className="text-muted-foreground">Monitoring & Analytics</p>
          </Link>
          <Link to="/products" className="p-6 border border-border rounded-lg hover:bg-accent transition-colors">
            <h3 className="text-lg font-semibold mb-2">Produk</h3>
            <p className="text-muted-foreground">Manajemen Inventory</p>
          </Link>
          <Link to="/transactions" className="p-6 border border-border rounded-lg hover:bg-accent transition-colors">
            <h3 className="text-lg font-semibold mb-2">Transaksi</h3>
            <p className="text-muted-foreground">Kelola Penjualan & Riwayat</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
