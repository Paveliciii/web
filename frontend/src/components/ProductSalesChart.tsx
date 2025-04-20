import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';
import { SalesByProductChart } from '../types';

interface ProductSalesChartProps {
    data: SalesByProductChart[];
}

const ProductSalesChart: React.FC<ProductSalesChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Топ продуктов по выручке</h2>
                <p className="text-gray-500">Нет данных для отображения</p>
            </div>
        );
    }

    // Sort and take top 5 products by revenue
    const topProducts = [...data]
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 5);

    // Format the data for the chart
    const chartData = topProducts.map(item => ({
        name: item.product_name,
        revenue: item.total_sales,
        quantity: item.quantity_sold
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
                    <p className="font-semibold">{label}</p>
                    <p className="text-blue-600">{`Выручка: ${formatCurrency(payload[0].value)}`}</p>
                    <p className="text-green-600">{`Количество: ${payload[1].value} шт.`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Топ продуктов по выручке</h2>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `${value / 1000}K`} />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={100}
                            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                            dataKey="revenue" 
                            name="Выручка" 
                            fill="#3b82f6" 
                            radius={[0, 4, 4, 0]}
                        />
                        <Bar 
                            dataKey="quantity" 
                            name="Количество" 
                            fill="#10b981" 
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProductSalesChart; 