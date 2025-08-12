import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  name: string;
  category: 'sparepart' | 'oli' | 'ban' | 'aki' | 'aksesoris' | 'tools' | 'lainnya';
  price: number;
  purchase_price: number;
  stock: number;
  supplier?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
      
      // Check for low stock products
      const lowStock = (data || []).filter(product => product.stock < 2);
      setLowStockProducts(lowStock);
      
      // Show toast notification if there are low stock items
      if (lowStock.length > 0) {
        toast({
          title: "⚠️ Peringatan Stok Rendah",
          description: `${lowStock.length} produk memiliki stok kurang dari 2`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [data, ...prev]);
      toast({
        title: "Berhasil",
        description: "Produk berhasil ditambahkan",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => prev.map(product => 
        product.id === id ? data : product
      ));
      toast({
        title: "Berhasil",
        description: "Produk berhasil diupdate",
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(product => product.id !== id));
      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const searchProducts = async (query: string, category?: string) => {
    try {
      setLoading(true);
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (query) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,barcode.ilike.%${query}%`
        );
      }

      if (category && category !== 'all') {
        queryBuilder = queryBuilder.eq('category', category as Product['category']);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  return {
    products,
    lowStockProducts,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    fetchProducts
  };
};