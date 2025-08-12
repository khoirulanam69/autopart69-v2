
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTransactions } from '@/hooks/useTransactions';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const chartConfig = {
  quantity: {
    label: "Terjual",
  },
};

export const ProductsChart = () => {
  const { transactions } = useTransactions();

  const chartData = useMemo(() => {
    // Aggregate product sales from transaction items
    const productSales = transactions.reduce((acc, transaction) => {
      transaction.items.forEach(item => {
        if (acc[item.product_name]) {
          acc[item.product_name] += item.quantity;
        } else {
          acc[item.product_name] = item.quantity;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by quantity sold (descending)
    const sortedProducts = Object.entries(productSales)
      .map(([name, quantity]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        quantity
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8); // Take top 8 products

    return sortedProducts;
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk Terlaris</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="horizontal">
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any, name: any, props: any) => [
                  `${value} unit`,
                  'Terjual'
                ]}
                labelFormatter={(label: any, payload: any) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullName;
                  }
                  return label;
                }}
              />
              <Bar 
                dataKey="quantity" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
