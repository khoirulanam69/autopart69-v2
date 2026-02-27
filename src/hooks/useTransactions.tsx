import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
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
  technician_fee: number;
  other_fees: number;
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
      const { data } = await api.getTransactions();
      setTransactions(data);
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
    items: Omit<TransactionItem, 'id'>[],
    technicianFee: number = 0,
    otherFees: number = 0
  ) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      await api.createTransaction({
        customer_name: customerName,
        payment_method: paymentMethod,
        items,
        technician_fee: technicianFee,
        other_fees: otherFees,
      });

      await fetchTransactions();

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dibuat dan stok produk telah diperbarui"
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat transaksi",
        variant: "destructive"
      });
      return { error: error.message };
    }
  };

  const updateTransaction = async (
    transactionId: string,
    customerName: string,
    paymentMethod: 'cash' | 'transfer' | 'card',
    items: Omit<TransactionItem, 'id'>[],
    technicianFee: number = 0,
    otherFees: number = 0
  ) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      await api.updateTransaction(transactionId, {
        customer_name: customerName,
        payment_method: paymentMethod,
        items,
        technician_fee: technicianFee,
        other_fees: otherFees,
      });

      await fetchTransactions();

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil diperbarui"
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui transaksi",
        variant: "destructive"
      });
      return { error: error.message };
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      await api.deleteTransaction(transactionId);
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
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  };
};
