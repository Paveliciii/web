import React, { useState, useEffect } from 'react';
import { Order, Product, Region } from '../types';
import api from '../services/api';

interface OrderFormProps {
    onSubmit: (order: Order) => void;
    onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Order>>({
        order_id: '',
        customer_id: 1,
        product_id: 0,
        quantity: 1,
        region_id: 0
    });
    
    const [products, setProducts] = useState<Product[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productsRes, regionsRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/regions')
                ]);
                
                setProducts(productsRes.data);
                setRegions(regionsRes.data);
                
                if (productsRes.data.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        product_id: productsRes.data[0].id
                    }));
                    setSelectedProduct(productsRes.data[0]);
                }
                
                if (regionsRes.data.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        region_id: regionsRes.data[0].id
                    }));
                }
                
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);
    
    useEffect(() => {
        const product = products.find(p => p.id === formData.product_id);
        setSelectedProduct(product || null);
        
        if (product) {
            setFormData(prev => ({
                ...prev,
                price: product.price,
                sales: (prev.quantity || 0) * product.price
            }));
        }
    }, [formData.product_id, products]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'quantity') {
            const quantity = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                quantity,
                sales: quantity * (selectedProduct?.price || 0)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'product_id' || name === 'region_id' || name === 'customer_id' 
                    ? parseInt(value) 
                    : value
            }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.product_id || !formData.region_id) {
            setError('Пожалуйста, выберите продукт и регион');
            return;
        }
        
        const orderData = {
            ...formData,
            order_date: new Date().toISOString().split('T')[0]
        };
        
        try {
            onSubmit(orderData as Order);
            setFormData({
                order_id: '',
                customer_id: 1,
                product_id: formData.product_id,
                quantity: 1,
                region_id: formData.region_id
            });
        } catch (err) {
            console.error('Error submitting form:', err);
            setError('Ошибка при создании заказа');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Загрузка...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Новый заказ</h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Клиента
                    </label>
                    <input
                        type="number"
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Продукт
                    </label>
                    <select
                        name="product_id"
                        value={formData.product_id}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Выберите продукт</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} - {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(product.price)}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Количество
                    </label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Регион
                    </label>
                    <select
                        name="region_id"
                        value={formData.region_id}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Выберите регион</option>
                        {regions.map(region => (
                            <option key={region.id} value={region.id}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Сумма
                    </label>
                    <input
                        type="text"
                        value={new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(formData.sales || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                        readOnly
                    />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Создать заказ
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrderForm; 