
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTransactions } from '@/hooks/useTransactions';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const chartConfig = {
  revenue: {
    label: "Pendapatan",
  },
};

export const SalesChart = () => {
  const { transactions } = useTransactions();

  const chartData = useMemo(() => {
    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTransactions = transactions.filter(t => t.date === date);
      const revenue = dayTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      
      const dayName = new Date(date).toLocaleDateString('id-ID', { 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });

      return {
        day: dayName,
        revenue
      };
    });
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${(value / 1000)}k`} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any) => [
                  new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(value),
                  'Pendapatan'
                ]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
