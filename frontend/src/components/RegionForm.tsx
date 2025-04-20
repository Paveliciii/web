import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';
import api from '../services/api';

interface Region {
    id: number;
    name: string;
}

interface ValidationErrors {
    name?: string;
}

const RegionForm: React.FC = () => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [newRegion, setNewRegion] = useState('');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/regions');
            setRegions(response.data);
            setLoading(false);
        } catch (err) {
            setError('Ошибка при загрузке регионов');
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};
        let isValid = true;

        if (!newRegion.trim()) {
            errors.name = 'Название региона обязательно';
            isValid = false;
        } else if (newRegion.length < 2) {
            errors.name = 'Название региона должно содержать минимум 2 символа';
            isValid = false;
        } else if (newRegion.length > 50) {
            errors.name = 'Название региона не должно превышать 50 символов';
            isValid = false;
        } else if (regions.some(region => region.name.toLowerCase() === newRegion.toLowerCase())) {
            errors.name = 'Регион с таким названием уже существует';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/regions', { name: newRegion });

            if (response.status === 200 || response.status === 201) {
                setNewRegion('');
                setError('');
                setValidationErrors({});
                fetchRegions();
            } else {
                const errorData = await response.data;
                setError(errorData.error || 'Ошибка при добавлении региона');
            }
            setLoading(false);
        } catch (err) {
            setError('Ошибка при добавлении региона');
            setLoading(false);
        }
    };

    // Get current regions for pagination
    const indexOfLastRegion = currentPage * itemsPerPage;
    const indexOfFirstRegion = indexOfLastRegion - itemsPerPage;
    const currentRegions = regions.slice(indexOfFirstRegion, indexOfLastRegion);

    // Change page
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Управление регионами</h2>
            
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Добавить новый регион</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Название региона
                        </label>
                        <input
                            type="text"
                            value={newRegion}
                            onChange={(e) => {
                                setNewRegion(e.target.value);
                                // Clear errors when typing
                                if (validationErrors.name) {
                                    setValidationErrors({...validationErrors, name: undefined});
                                }
                            }}
                            placeholder="Название региона"
                            className={`w-full px-4 py-2 rounded-lg bg-gray-700 text-white border ${
                                validationErrors.name ? 'border-red-500' : 'border-gray-600'
                            } focus:border-blue-500 focus:outline-none`}
                        />
                        {validationErrors.name && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Добавление...' : 'Добавить'}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>

            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Список регионов</h3>
                {loading && regions.length === 0 ? (
                    <p className="text-gray-400">Загрузка регионов...</p>
                ) : regions.length === 0 ? (
                    <p className="text-gray-400">Нет доступных регионов</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-700 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 bg-gray-700 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Название
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {currentRegions.map((region) => (
                                        <tr key={region.id} className="hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {region.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {region.name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={Math.ceil(regions.length / itemsPerPage)}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default RegionForm; 