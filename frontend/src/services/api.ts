import axios from 'axios';
import { Order, Product, SalesSummary, SalesByRegion, SalesByProduct, SalesTrend, CustomerSegment } from '../types';

// Определяем базовый URL для API
const baseURL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

console.log('API URL:', baseURL);

// Создаем настроенный экземпляр axios
const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Включаем отправку куки для кросс-доменных запросов
});

// Логи для отладки запросов
api.interceptors.request.use(request => {
    console.log('Starting Request:', request);
    return request;
});

api.interceptors.response.use(
    response => {
        console.log('Response:', response);
        return response;
    },
    error => {
        console.error('API Error:', error.message, error.response || 'No response');
        return Promise.reject(error);
    }
);

export default api;

export const ordersApi = {
    getOrders: (params?: any) => api.get<Order[]>('/orders', { params }),
    getOrder: (id: number) => api.get<Order>(`/orders/${id}`),
    createOrder: (data: Partial<Order>) => api.post<Order>('/orders', data),
    updateOrder: (id: number, data: Partial<Order>) => api.put<Order>(`/orders/${id}`, data),
    deleteOrder: (id: number) => api.delete(`/orders/${id}`),
    importOrders: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/import/csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export const productsApi = {
    getProducts: () => api.get<Product[]>('/products'),
    getProduct: (id: number) => api.get<Product>(`/products/${id}`),
    createProduct: (data: Partial<Product>) => api.post<Product>('/products', data),
    updateProduct: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
    deleteProduct: (id: number) => api.delete(`/products/${id}`),
    getCategories: () => api.get<string[]>('/products/categories'),
};

export const analyticsApi = {
    getSummary: () => api.get<SalesSummary>('/analytics/summary'),
    getSalesTrend: (period: string) => api.get<SalesTrend[]>('/analytics/sales-trend', { params: { period } }),
    getSalesByRegion: () => api.get<SalesByRegion[]>('/analytics/sales-by-region'),
    getSalesByProduct: () => api.get<SalesByProduct[]>('/analytics/sales-by-product'),
    getTopProducts: (params?: { limit?: number }) =>
        api.get<SalesByProduct[]>('/analytics/top-products', { params }),
    getCustomerSegments: () => api.get<CustomerSegment[]>('/analytics/customer-segments'),
};