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
  image_url?: string;
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
      
      // Check for empty stock products
      const emptyStock = (data || []).filter(product => product.stock === 0);
      setLowStockProducts(emptyStock);
      
      // Show toast notification if there are empty stock items
      if (emptyStock.length > 0) {
        toast({
          title: "⚠️ Peringatan Stok Kosong",
          description: `${emptyStock.length} produk memiliki stok kosong`,
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

  const uploadProductImage = async (file: File, productId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error: any) {
      return { url: null, error };
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>, imageFile?: File) => {
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

      // Upload image if provided
      if (imageFile && data) {
        const { url, error: uploadError } = await uploadProductImage(imageFile, data.id);
        if (url && !uploadError) {
          const { data: updatedData, error: updateError } = await supabase
            .from('products')
            .update({ image_url: url })
            .eq('id', data.id)
            .select()
            .single();

          if (!updateError && updatedData) {
            setProducts(prev => [updatedData, ...prev]);
            toast({
              title: "Berhasil",
              description: "Produk berhasil ditambahkan",
            });
            return { data: updatedData, error: null };
          }
        }
      }
      
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

  const updateProduct = async (id: string, productData: Partial<Product>, imageFile?: File) => {
    try {
      // Upload image if provided
      if (imageFile) {
        const { url, error: uploadError } = await uploadProductImage(imageFile, id);
        if (url && !uploadError) {
          productData.image_url = url;
        }
      }

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

      if (category && category !== 'all') {
        queryBuilder = queryBuilder.eq('category', category as Product['category']);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Filter products with flexible keyword matching
      let filteredData = data || [];
      if (query && query.trim()) {
        // Split query into individual words and filter out empty strings
        const keywords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
        
        // Filter products that contain all keywords in name or barcode
        filteredData = filteredData.filter(product => {
          const searchText = `${product.name} ${product.barcode || ''}`.toLowerCase();
          // Check if all keywords exist in the search text
          return keywords.every(keyword => searchText.includes(keyword));
        });
      }

      setProducts(filteredData);
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