import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Region {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
}

interface FilterState {
    startDate: string;
    endDate: string;
    regionId: string;
    productId: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

interface FilterProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
}

const Filters: React.FC<FilterProps> = ({ filters, onFilterChange }) => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [dateError, setDateError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [regionsRes, productsRes] = await Promise.all([
                    api.get('/regions'),
                    api.get('/products')
                ]);
                setRegions(regionsRes.data);
                setProducts(productsRes.data);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Валидация дат
        if (name === 'startDate' || name === 'endDate') {
            // Проверка на пустое значение - разрешаем сбросить фильтр
            if (!value) {
                setDateError('');
                onFilterChange({
                    ...filters,
                    [name]: value
                });
                return;
            }
            
            // Проверка на корректность даты
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
                setDateError('Некорректный формат даты');
                return;
            }
            
            // Проверка на корректность интервала
            if (name === 'startDate' && filters.endDate && new Date(value) > new Date(filters.endDate)) {
                setDateError('Начальная дата не может быть позже конечной');
                return;
            }
            
            if (name === 'endDate' && filters.startDate && new Date(value) < new Date(filters.startDate)) {
                setDateError('Конечная дата не может быть раньше начальной');
                return;
            }
            
            // Если все в порядке, сбрасываем ошибку
            setDateError('');
        }
        
        onFilterChange({
            ...filters,
            [name]: value
        });
    };

    const resetFilters = () => {
        onFilterChange({
            startDate: '',
            endDate: '',
            regionId: '',
            productId: '',
            sortBy: 'period',
            sortOrder: 'desc'
        });
        setDateError('');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Фильтры</h2>
                <button 
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                    Сбросить все
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Начальная дата
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${dateError ? 'border-red-500' : ''}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Конечная дата
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${dateError ? 'border-red-500' : ''}`}
                    />
                </div>
                {dateError && (
                    <div className="md:col-span-3 text-red-500 text-sm mt-1">{dateError}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Регион
                    </label>
                    <select
                        name="regionId"
                        value={filters.regionId}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Все регионы</option>
                        {regions.map(region => (
                            <option key={region.id} value={region.id}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Продукт
                    </label>
                    <select
                        name="productId"
                        value={filters.productId}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Все продукты</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Сортировка по
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleChange}
                            className="p-2 border rounded"
                        >
                            <option value="period">Дате</option>
                            <option value="revenue">Выручке</option>
                        </select>
                        <select
                            name="sortOrder"
                            value={filters.sortOrder}
                            onChange={handleChange}
                            className="p-2 border rounded"
                        >
                            <option value="desc">По убыванию</option>
                            <option value="asc">По возрастанию</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Filters; 