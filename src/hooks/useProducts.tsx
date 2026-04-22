import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { compressImage } from '@/lib/imageCompression';
import { getProductImageFilename } from '@/lib/productImage';

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const PAGE_SIZE = 20;

  const fetchProducts = async (resetData = false) => {
    try {
      setLoading(true);
      const currentPage = resetData ? 0 : page;

      const { data, count } = await api.getProducts(currentPage, PAGE_SIZE);

      setTotalCount(count || 0);

      if (resetData) {
        setProducts(data);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }

      setHasMore(data.length === PAGE_SIZE && (count || 0) > (currentPage + 1) * PAGE_SIZE);

      if (resetData) {
        const { data: lowStock } = await api.getLowStockProducts();
        setLowStockProducts(lowStock);
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
      const compressedFile = await compressImage(file);
      const { url } = await api.uploadProductImage(productId, compressedFile);
      return { url, error: null };
    } catch (error: any) {
      return { url: null, error };
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>, imageFile?: File) => {
    try {
      const { data } = await api.createProduct(productData);

      if (imageFile && data) {
        const { url, error: uploadError } = await uploadProductImage(imageFile, data.id);
        if (url && !uploadError) {
          const { data: updatedData } = await api.updateProduct(data.id, { image_url: getProductImageFilename(url) });
          setProducts(prev => [updatedData, ...prev]);
          toast({ title: "Berhasil", description: "Produk berhasil ditambahkan" });
          return { data: updatedData, error: null };
        }
      }

      setProducts(prev => [data, ...prev]);
      toast({ title: "Berhasil", description: "Produk berhasil ditambahkan" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>, imageFile?: File) => {
    try {
      if (imageFile) {
        const { url, error: uploadError } = await uploadProductImage(imageFile, id);
        if (url && !uploadError) {
          productData.image_url = getProductImageFilename(url) || undefined;
        }
      }

      const { data } = await api.updateProduct(id, productData);

      setProducts(prev => prev.map(product => product.id === id ? data : product));
      toast({ title: "Berhasil", description: "Produk berhasil diupdate" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      toast({ title: "Berhasil", description: "Produk berhasil dihapus" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const searchProducts = async (query: string, category?: string) => {
    try {
      setLoading(true);
      const { data } = await api.searchProducts(query, category);
      setProducts(data);
      setPage(0);
      setHasMore(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const { data } = await api.getAllProducts();
      setAllProducts(data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching all products:', error);
      return { data: [], error };
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts(true);
      fetchAllProducts();
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
