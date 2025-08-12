import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TransactionItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Transaction {
  id: string;
  date: string;
  customer_name: string;
  total_amount: number;
  payment_method: 'cash' | 'transfer' | 'card';
  status: 'completed' | 'pending' | 'cancelled';
  items: TransactionItem[];
}

export const useTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch transactions with their items
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Transform data to match the component interface
      const transformedTransactions: Transaction[] = transactionsData?.map(t => ({
        id: t.id,
        date: new Date(t.created_at).toISOString().split('T')[0],
        customer_name: t.customer_name,
        total_amount: Number(t.total_amount),
        payment_method: t.payment_method as 'cash' | 'transfer' | 'card',
        status: t.status as 'completed' | 'pending' | 'cancelled',
        items: t.transaction_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total)
        })) || []
      })) || [];

      setTransactions(transformedTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (
    customerName: string,
    paymentMethod: 'cash' | 'transfer' | 'card',
    items: Omit<TransactionItem, 'id'>[]
  ) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Start a transaction to ensure atomicity
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          customer_name: customerName,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = items.map(item => ({
        transaction_id: transactionData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update product stocks
      for (const item of items) {
        // First get current product data
        const { data: productData, error: productFetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (productFetchError) {
          console.error('Error fetching product:', productFetchError);
          throw new Error(`Gagal mengambil data produk ${item.product_name}`);
        }

        const currentStock = productData.stock;
        
        // Check if there's enough stock
        if (currentStock < item.quantity) {
          throw new Error(`Stok ${item.product_name} tidak mencukupi. Stok tersedia: ${currentStock}, diminta: ${item.quantity}`);
        }

        // Update the stock
        const newStock = currentStock - item.quantity;
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (stockUpdateError) {
          console.error('Error updating stock:', stockUpdateError);
          throw new Error(`Gagal mengupdate stok ${item.product_name}`);
        }

        console.log(`Updated stock for ${item.product_name}: ${currentStock} -> ${newStock}`);
      }

      // Refresh transactions
      await fetchTransactions();

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dibuat dan stok produk telah diperbarui"
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      
      // If there's an error, we should ideally rollback the transaction
      // For now, we'll show a detailed error message
      toast({
        title: "Error",
        description: error.message || "Gagal membuat transaksi",
        variant: "destructive"
      });
      return { error: error.message };
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // First get the transaction data to restore stock
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Restore product stocks before deleting
      for (const item of transactionData.transaction_items) {
        // Get current product stock
        const { data: productData, error: productFetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (productFetchError) {
          console.error('Error fetching product:', productFetchError);
          throw new Error(`Gagal mengambil data produk ${item.product_name}`);
        }

        // Restore stock by adding back the sold quantity
        const newStock = productData.stock + item.quantity;
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (stockUpdateError) {
          console.error('Error updating stock:', stockUpdateError);
          throw new Error(`Gagal mengembalikan stok ${item.product_name}`);
        }

        console.log(`Restored stock for ${item.product_name}: ${productData.stock} -> ${newStock}`);
      }

      // Delete transaction items first (due to foreign key constraint)
      const { error: itemsDeleteError } = await supabase
        .from('transaction_items')
        .delete()
        .eq('transaction_id', transactionId);

      if (itemsDeleteError) throw itemsDeleteError;

      // Delete the transaction
      const { error: transactionDeleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (transactionDeleteError) throw transactionDeleteError;

      // Refresh transactions
      await fetchTransactions();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus transaksi",
        variant: "destructive"
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    createTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  };
};
