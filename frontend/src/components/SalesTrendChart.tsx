import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { formatCurrency, formatDate } from '../utils/format';
import { SalesTrendData } from '../types';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface SalesTrendChartProps {
    data: SalesTrendData[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Динамика продаж</h2>
                <p className="text-gray-500">Нет данных для отображения</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
                    <p className="font-semibold">{formatDate(label as string)}</p>
                    <p className="text-blue-600">{`Выручка: ${formatCurrency(payload[0].value as number)}`}</p>
                </div>
            );
        }
        return null;
    };

    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
    });

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Динамика продаж</h2>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={sortedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                        />
                        <YAxis 
                            tickFormatter={(value) => formatCurrency(value, false)}
                            domain={['dataMin - 10000', 'dataMax + 20000']}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3b82f6" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesTrendChart; 