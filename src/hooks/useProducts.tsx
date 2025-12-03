import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { compressImage } from '@/lib/imageCompression';

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
  const [allProducts, setAllProducts] = useState<Product[]>([]); // For transactions - all products loaded
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const PAGE_SIZE = 20; // Load 20 products at a time

  const fetchProducts = async (resetData = false) => {
    try {
      setLoading(true);
      const currentPage = resetData ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      const newProducts = data || [];
      
      // Update total count
      setTotalCount(count || 0);
      
      if (resetData) {
        setProducts(newProducts);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(prev => prev + 1);
      }
      
      // Check if there are more products to load
      setHasMore(newProducts.length === PAGE_SIZE && (count || 0) > to + 1);
      
      // Check for empty stock products (only on initial load)
      if (resetData) {
        const { data: allProducts } = await supabase
          .from('products')
          .select('*')
          .eq('stock', 0);
        
        const emptyStock = allProducts || [];
        setLowStockProducts(emptyStock);
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

  const deleteProductImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/product-images/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting image:', error);
    }
  };

  const uploadProductImage = async (file: File, productId: string) => {
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedFile, {
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
        // Get current product to check for existing image
        const currentProduct = products.find(p => p.id === id);
        
        // Delete old image if it exists
        if (currentProduct?.image_url) {
          await deleteProductImage(currentProduct.image_url);
        }
        
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
        .select('*', { count: 'exact' })
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
      setPage(0);
      setHasMore(false); // Disable infinite scroll for search results
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

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(false);
    }
  };

  // Fetch all products without pagination - for transactions
  const fetchAllProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllProducts(data || []);
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error fetching all products:', error);
      return { data: [], error };
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts(true);
      fetchAllProducts(); // Also fetch all products for transactions
    }
  }, [user]);

  return {
    products,
    allProducts,
    lowStockProducts,
    loading,
    hasMore,
    totalCount,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    fetchProducts,
    loadMore,
    fetchAllProducts
  };
};