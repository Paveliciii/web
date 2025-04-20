import React, { useState, useEffect } from 'react';
import { Order, Product } from '../types';
import api from '../services/api';

interface Customer {
    customer_id: string;
    customer_name: string;
}

interface Region {
    id: number;
    name: string;
}

interface OrderFormProps {
    order?: Order;
    onSubmit?: (order: Partial<Order>) => void;
    onCancel?: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Order>>({
        order_id: '', // Пустое значение, будет заполнено сервером
        customer_id: 1, // Начинаем с 1
        customer_name: '',
        product_id: undefined,
        quantity: 1,
        sales: 0,
        region_id: 1, // По умолчанию первый регион
        ...order,
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, regionsRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/regions')
                ]);
                setProducts(productsRes.data);
                setRegions(regionsRes.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Ошибка при загрузке данных');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log('Field changed:', name, value);
        
        const newFormData = {
            ...formData,
            [name]: name === 'product_id' || name === 'quantity' || name === 'region_id' || name === 'customer_id'
                ? Number(value) 
                : value,
        };

        // Если изменился продукт или количество, пересчитываем сумму
        if (name === 'product_id' || name === 'quantity') {
            const selectedProduct = products.find(p => p.id === Number(newFormData.product_id));
            console.log('Selected product:', selectedProduct);
            if (selectedProduct) {
                const quantity = Number(newFormData.quantity) || 1;
                newFormData.sales = quantity * selectedProduct.price;
                console.log('Calculated sales:', newFormData.sales);
            }
        }

        console.log('New form data:', newFormData);
        setFormData(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_id) {
            setError('Пожалуйста, выберите продукт');
            return;
        }
        console.log('Submitting form data:', formData);

        try {
            setSubmitting(true);
            
            const response = await api.post('/orders', formData);
            
            if (response.status === 201) {
                setSuccess(true);
                // ... reset form ...
            }
            
            setSubmitting(false);
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Ошибка при создании заказа');
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Order ID
                        <input
                            type="text"
                            name="order_id"
                            value={formData.order_id || 'Will be generated automatically'}
                            readOnly
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                        />
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Region
                        <select
                            name="region_id"
                            value={formData.region_id}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            {regions.map(region => (
                                <option key={region.id} value={region.id}>
                                    {region.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Customer ID
                        <input
                            type="number"
                            name="customer_id"
                            value={formData.customer_id || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                            min="1"
                            placeholder="Enter customer ID"
                        />
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Customer Name
                        <input
                            type="text"
                            name="customer_name"
                            value={formData.customer_name || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                            placeholder="Enter customer name"
                        />
                    </label>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Product
                        <select
                            name="product_id"
                            value={formData.product_id || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Product</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} - {product.price} ₽
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Quantity
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity || ''}
                            onChange={handleChange}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Total Amount
                        <input
                            type="number"
                            name="sales"
                            value={formData.sales || ''}
                            readOnly
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                        />
                    </label>
                </div>
            </div>

            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => onCancel && onCancel()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {order ? 'Update Order' : 'Create Order'}
                </button>
            </div>
        </form>
    );
};

export default OrderForm; 