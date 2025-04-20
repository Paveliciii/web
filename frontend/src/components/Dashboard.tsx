import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { formatCurrency, formatDate } from '../utils/format';
import SalesTrend from './SalesTrend';
import SalesTrendChart from './SalesTrendChart';
import RegionDistributionChart from './RegionDistributionChart';
import ProductSalesChart from './ProductSalesChart';
import Filters from './Filters';
import api from '../services/api';
import { SalesSummary, SalesByRegion, SalesByProduct, SalesTrendData, SalesByRegionChart, SalesByProductChart } from '../types';

interface FilterState {
    startDate: string;
    endDate: string;
    regionId: string;
    productId: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const Dashboard: React.FC = () => {
    const [summary, setSummary] = useState<SalesSummary>({
        total_orders: 0,
        total_quantity: 0,
        total_revenue: 0,
        average_order_value: 0
    });
    const [regions, setRegions] = useState<SalesByRegion[]>([]);
    const [products, setProducts] = useState<SalesByProduct[]>([]);
    const [trends, setTrends] = useState<SalesTrendData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [filters, setFilters] = useState<FilterState>({
        startDate: '',
        endDate: '',
        regionId: '',
        productId: '',
        sortBy: 'period',
        sortOrder: 'desc'
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const summaryRes = await api.get('/analytics/summary');
            const regionRes = await api.get('/analytics/by-region');
            const productRes = await api.get('/analytics/by-product');
            const trendRes = await api.get('/analytics/trend');

            setSummary({
                total_orders: summaryRes.data.total_orders,
                total_quantity: summaryRes.data.total_quantity,
                total_revenue: summaryRes.data.total_revenue,
                average_order_value: summaryRes.data.total_revenue / summaryRes.data.total_orders
            });
            setRegions(regionRes.data);
            setProducts(productRes.data);
            
            const trendData = trendRes.data.map((item: any) => ({
                date: item.date || item.period,
                revenue: item.revenue
            }));
            setTrends(trendData);
            
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        
        // Установим интервал обновления данных каждые 30 секунд при активном окне
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        }, 30000);
        
        // Обработчик изменения видимости страницы
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        };
        
        // Добавляем слушатель события изменения видимости
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchData]);

    // Convert data for charts
    const regionsForChart: SalesByRegionChart[] = regions.map(region => ({
        region_name: region.region,
        total_sales: region.revenue
    }));

    const productsForChart: SalesByProductChart[] = products.map(product => ({
        product_name: product.product,
        total_sales: product.revenue,
        quantity_sold: product.total_quantity || 0
    }));

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const handleExportData = async () => {
        try {
            let params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.regionId) params.append('regionId', filters.regionId);
            if (filters.productId) params.append('productId', filters.productId);
            
            const queryString = params.toString();
            const apiUrl = queryString ? `?${queryString}` : '';
            
            const response = await api.get(`/export/csv${apiUrl}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sales_data_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting data:', err);
            alert('Ошибка при экспорте данных');
        }
    };

    if (loading) return <div className="container mx-auto p-8">Загрузка...</div>;
    if (error) return <div className="container mx-auto p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Панель управления продажами</h1>
                <div className="flex space-x-4">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Обновить
                    </button>
                    <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Экспорт данных (CSV)
                    </button>
                    <div className="flex rounded-md shadow-sm">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`px-4 py-2 rounded-l-lg border ${
                                viewMode === 'chart' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-blue-600'
                            }`}
                        >
                            Графики
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-2 rounded-r-lg border ${
                                viewMode === 'table' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-blue-600'
                            }`}
                        >
                            Таблицы
                        </button>
                    </div>
                </div>
            </div>
            
            <Filters filters={filters} onFilterChange={handleFilterChange} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Общая выручка</h3>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Количество заказов</h3>
                    <p className="text-2xl font-bold">{summary.total_orders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Средний чек</h3>
                    <p className="text-2xl font-bold">{formatCurrency(summary.average_order_value)}</p>
                </div>
            </div>

            {viewMode === 'chart' ? (
                <div className="space-y-8">
                    {trends.length > 0 ? (
                        <SalesTrendChart data={trends} />
                    ) : (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">График продаж</h2>
                            <p className="text-gray-500">Нет данных для отображения</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="col-span-1 min-h-[450px]">
                            <RegionDistributionChart data={regionsForChart} />
                        </div>

                        <div className="col-span-1">
                            <ProductSalesChart data={productsForChart} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <SalesTrend data={trends} />

                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Продажи по регионам</h2>
                        <div className="overflow-x-auto">
                            {regions.length === 0 ? (
                                <p className="text-gray-500">Нет данных для отображения</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Регион
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Заказы
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Выручка
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {regions.map((region, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {region.region}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {region.order_count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(region.revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Продажи по товарам</h2>
                        <div className="overflow-x-auto">
                            {products.length === 0 ? (
                                <p className="text-gray-500">Нет данных для отображения</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Товар
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Категория
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Кол-во
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Выручка
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.map((product, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.product_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.quantity_sold}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(product.revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 