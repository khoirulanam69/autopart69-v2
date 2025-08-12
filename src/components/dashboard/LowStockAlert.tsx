
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LowStockAlert = () => {
  const { lowStockProducts } = useProducts();

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Peringatan Stok Rendah
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lowStockProducts.length} produk memiliki stok kurang dari 2 unit:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Kategori: {product.category}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">
                  {product.stock} unit
                </Badge>
              </div>
            ))}
          </div>
          
          {lowStockProducts.length > 6 && (
            <p className="text-sm text-muted-foreground">
              Dan {lowStockProducts.length - 6} produk lainnya...
            </p>
          )}
          
          <div className="flex justify-end">
            <Link to="/products">
              <Button variant="outline" size="sm">
                Kelola Produk
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
