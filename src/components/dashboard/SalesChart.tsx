
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTransactions } from '@/hooks/useTransactions';
import { useIncomeExpenses } from '@/hooks/useIncomeExpenses';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const chartConfig = {
  netProfit: {
    label: "Laba Bersih",
  },
};

export const SalesChart = () => {
  const { transactions } = useTransactions();
  const { incomeExpenses } = useIncomeExpenses();

  const chartData = useMemo(() => {
    // Get all dates from transactions and income/expenses
    const allDates: Date[] = [
      ...transactions.map(t => new Date(t.date)),
      ...incomeExpenses.map(item => new Date(item.date))
    ];

    // If no data, return empty array
    if (allDates.length === 0) return [];

    // Find the earliest date and use current date as end
    const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const startDate = startOfMonth(earliestDate);
    const currentDate = new Date();
    const endDate = endOfMonth(currentDate);
    
    // Get all months from earliest to current
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Calculate transaction revenue for the month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      const transactionRevenue = monthTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

      // Calculate income for the month
      const monthIncome = incomeExpenses
        .filter(item => {
          if (item.type !== 'income') return false;
          const itemDate = new Date(item.date);
          return itemDate >= monthStart && itemDate <= monthEnd;
        })
        .reduce((sum, item) => sum + Number(item.amount), 0);

      // Calculate expenses for the month
      const monthExpenses = incomeExpenses
        .filter(item => {
          if (item.type !== 'expense') return false;
          const itemDate = new Date(item.date);
          return itemDate >= monthStart && itemDate <= monthEnd;
        })
        .reduce((sum, item) => sum + Number(item.amount), 0);

      // Net profit = (Transaction Revenue + Income) - Expenses
      const netProfit = transactionRevenue + monthIncome - monthExpenses;
      
      // Format with year for clarity across multiple years
      const monthName = format(month, 'MMM yyyy', { locale: localeId });

      return {
        month: monthName,
        netProfit
      };
    });
  }, [transactions, incomeExpenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue per Bulan (Laba Bersih)</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div style={{ minWidth: `${Math.max(chartData.length * 80, 800)}px` }}>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
                      if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
                      return `Rp ${value}`;
                    }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [
                      new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(value),
                      'Laba Bersih'
                    ]}
                  />
                  <Bar dataKey="netProfit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
