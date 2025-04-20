import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SalesTrend from './SalesTrend';
import SalesTrendChart from './SalesTrendChart';
import RegionDistributionChart from './RegionDistributionChart';
import ProductSalesChart from './ProductSalesChart';
import Filters from './Filters';
import { formatCurrency } from '../utils/format';
import api from '../services/api';

interface SalesSummary {
    total_sales: number;
    total_orders: number;
    average_order_value: number;
}

interface SalesByRegion {
    region_name: string;
    total_sales: number;
    order_count: number;
}

interface SalesByProduct {
    product_name: string;
    total_sales: number;
    quantity_sold: number;
}

interface SalesTrendData {
    date: string;
    revenue: number;
}

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
        total_sales: 0,
        total_orders: 0,
        average_order_value: 0
    });
    const [regions, setRegions] = useState<SalesByRegion[]>([]);
    const [products, setProducts] = useState<SalesByProduct[]>([]);
    const [trends, setTrends] = useState<SalesTrendData[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('Fetching data from API with filters:', filters);
            
            // Проверка корректности дат перед отправкой
            let validatedFilters = { ...filters };
            
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                if (isNaN(startDate.getTime())) {
                    validatedFilters.startDate = '';
                    console.warn('Invalid startDate format, removed from query');
                }
            }
            
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                if (isNaN(endDate.getTime())) {
                    validatedFilters.endDate = '';
                    console.warn('Invalid endDate format, removed from query');
                }
            }
            
            // Create query params from validated filters
            let params = new URLSearchParams();
            if (validatedFilters.startDate) params.append('startDate', validatedFilters.startDate);
            if (validatedFilters.endDate) params.append('endDate', validatedFilters.endDate);
            if (validatedFilters.regionId) params.append('regionId', validatedFilters.regionId);
            if (validatedFilters.productId) params.append('productId', validatedFilters.productId);
            if (validatedFilters.sortBy) params.append('sortBy', validatedFilters.sortBy);
            if (validatedFilters.sortOrder) params.append('sortOrder', validatedFilters.sortOrder);
            
            const queryString = params.toString();
            const apiUrl = queryString ? `?${queryString}` : '';
            
            const [summaryRes, regionsRes, productsRes, trendsRes] = await Promise.all([
                api.get(`/sales/summary${apiUrl}`),
                api.get(`/sales/by-region${apiUrl}`),
                api.get(`/sales/by-product${apiUrl}`),
                api.get(`/sales/trend${apiUrl}`)
            ]);

            console.log('Raw API Responses:', {
                summary: summaryRes.data,
                regions: regionsRes.data,
                products: productsRes.data,
                trends: trendsRes.data
            });

            // Ensure numeric values are properly parsed
            const parsedSummary = {
                total_sales: Number(summaryRes.data.total_revenue) || 0,
                total_orders: Number(summaryRes.data.total_orders) || 0,
                average_order_value: Number(summaryRes.data.average_order_value) || 0
            };

            console.log('Parsed summary:', parsedSummary);

            const parsedRegions = regionsRes.data.map((region: any) => {
                return {
                    region_name: region.region || 'Без региона',
                    total_sales: Number(region.revenue) || 0,
                    order_count: Number(region.order_count) || 0
                };
            });

            const parsedProducts = productsRes.data.map((product: any) => ({
                product_name: product.product || 'Без продукта',
                total_sales: Number(product.revenue) || 0,
                quantity_sold: Number(product.total_quantity) || 0
            }));

            const parsedTrends = trendsRes.data.map((trend: any) => {
                const date = trend.date || '';
                
                if (!date) {
                    console.warn('Missing date in trend data:', trend);
                    return null;
                }
                
                return {
                    date: date,
                    revenue: Number(trend.revenue) || 0
                };
            }).filter(Boolean);

            console.log('Parsed Data:', {
                summary: parsedSummary,
                regions: parsedRegions,
                products: parsedProducts,
                trends: parsedTrends
            });

            setSummary(parsedSummary);
            setRegions(parsedRegions);
            setProducts(parsedProducts);
            setTrends(parsedTrends);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Ошибка при загрузке данных');
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const handleExportData = async () => {
        try {
            // Create query params from filters
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
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sales_data_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
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
            
            {/* Filters */}
            <Filters filters={filters} onFilterChange={handleFilterChange} />
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Общая выручка</h3>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_sales)}</p>
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
                    {/* Sales Trend Chart */}
                    {trends.length > 0 ? (
                        <SalesTrendChart data={trends} />
                    ) : (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">График продаж</h2>
                            <p className="text-gray-500">Нет данных для отображения</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Region Distribution Chart */}
                        <div className="col-span-1 min-h-[450px]">
                            <RegionDistributionChart data={regions} />
                        </div>

                        {/* Product Sales Chart */}
                        <div className="col-span-1">
                            <ProductSalesChart data={products} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Sales Trend Table */}
                    <SalesTrend data={trends} />

                    {/* Sales by Region */}
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
                                                Выручка
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Количество заказов
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {regions.map((region, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {region.region_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(region.total_sales)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {region.order_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Sales by Product */}
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
                                                Выручка
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Количество продаж
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
                                                    {formatCurrency(product.total_sales)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.quantity_sold}
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