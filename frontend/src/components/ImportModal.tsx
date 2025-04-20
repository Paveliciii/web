import React, { useState } from 'react';
import { ordersApi } from '../services/api';
import { AxiosError } from 'axios';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ApiErrorResponse {
    error?: string;
    details?: string;
    message?: string;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [retryCount, setRetryCount] = useState<number>(0);
    const MAX_RETRIES = 3;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Пожалуйста, выберите файл для импорта');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setProgress(10);

            await ordersApi.importOrders(file);
            
            setProgress(100);
            onSuccess();
            setTimeout(() => {
                onClose();
                setFile(null);
                setProgress(0);
            }, 1000);
        } catch (err) {
            console.error('Import error:', err);
            setProgress(0);
            
            // Если это ошибка 500 и не превышено количество повторных попыток
            const axiosError = err as AxiosError<ApiErrorResponse>;
            if (axiosError.response?.status === 500 && retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setError(`Ошибка при импорте данных. Повторная попытка ${retryCount + 1}/${MAX_RETRIES}...`);
                
                // Повторяем попытку через 2 секунды
                setTimeout(() => {
                    handleImport();
                }, 2000);
            } else {
                const errorData = axiosError.response?.data as ApiErrorResponse;
                const errorMessage = errorData?.error || errorData?.message || 'Произошла ошибка при импорте данных';
                const details = errorData?.details ? ` ${errorData.details}` : '';
                setError(`${errorMessage}.${details}`);
                setRetryCount(0);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Импорт данных</h2>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Выберите CSV файл для импорта
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Поддерживается как стандартный формат CSV с <code># Products data</code>, <code># Regions data</code>, 
                        <code># Orders data</code>, так и простой формат с заголовками столбцов.
                    </p>
                </div>
                
                {progress > 0 && (
                    <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {progress < 100 ? 'Импорт данных...' : 'Импорт успешно завершен!'}
                        </p>
                    </div>
                )}
                
                {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleImport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={!file || loading}
                    >
                        {loading ? 'Загрузка...' : 'Импортировать'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal; 