import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import RegionForm from './components/RegionForm';
import ProductForm from './components/ProductForm';
import OrderForm from './components/OrderForm';
import ImportData from './components/ImportData';
import Dashboard from './components/Dashboard';
import api from './services/api';

function App() {
    const handleOrderSubmit = async (order: any) => {
        console.log('Order submitted:', order);
        try {
            const response = await api.post('/orders', order);
            console.log('Order created successfully:', response.data);
            // Можно добавить уведомление об успешном создании заказа
            alert('Заказ успешно создан!');
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Ошибка при создании заказа. Проверьте консоль для подробностей.');
        }
    };

    const handleOrderCancel = () => {
        console.log('Order creation cancelled');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold">Sales Analytics</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    to="/"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/regions"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Regions
                                </Link>
                                <Link
                                    to="/products"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Products
                                </Link>
                                <Link
                                    to="/orders"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Orders
                                </Link>
                                <Link
                                    to="/import"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Import
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-8">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/regions" element={<RegionForm />} />
                    <Route path="/products" element={<ProductForm />} />
                    <Route path="/orders" element={<OrderForm onSubmit={handleOrderSubmit} onCancel={handleOrderCancel} />} />
                    <Route path="/import" element={<ImportData />} />
                </Routes>
            </main>
        </div>
    );
}

export default App; 