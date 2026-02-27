import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface IncomeExpense {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export const useIncomeExpenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: incomeExpenses = [], isLoading } = useQuery({
    queryKey: ['income-expenses'],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await api.getIncomeExpenses();
      return data as IncomeExpense[];
    },
    enabled: !!user,
  });

  const addIncomeExpense = useMutation({
    mutationFn: async (data: Omit<IncomeExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      const { data: result } = await api.createIncomeExpense(data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-expenses'] });
      toast.success('Data berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan data: ${error.message}`);
    },
  });

  const updateIncomeExpense = useMutation({
    mutationFn: async ({ id, ...data }: Partial<IncomeExpense> & { id: string }) => {
      const { data: result } = await api.updateIncomeExpense(id, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-expenses'] });
      toast.success('Data berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui data: ${error.message}`);
    },
  });

  const deleteIncomeExpense = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteIncomeExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-expenses'] });
      toast.success('Data berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus data: ${error.message}`);
    },
  });

  return {
    incomeExpenses,
    isLoading,
    addIncomeExpense: addIncomeExpense.mutate,
    updateIncomeExpense: updateIncomeExpense.mutate,
    deleteIncomeExpense: deleteIncomeExpense.mutate,
  };
};
