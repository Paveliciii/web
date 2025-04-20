import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { downloadCsvExample, getImportCsvExample } from '../utils/format';

const ImportData: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [showExample, setShowExample] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage('');
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Пожалуйста, выберите файл');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setMessage('Импортирую данные...');
            const response = await api.post('/import/csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data.message);
            setError('');
            setFile(null);
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            // Показываем сообщение об успехе
            setTimeout(() => {
                // После успешного импорта перенаправляем на Dashboard
                navigate('/');
            }, 1500);
        } catch (err) {
            console.error('Import error:', err);
            setError('Ошибка при импорте данных');
            setMessage('');
        }
    };

    const handleDownloadExample = () => {
        downloadCsvExample();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Импорт данных</h2>
            
            <div className="mb-6">
                <button 
                    type="button"
                    onClick={() => setShowExample(!showExample)}
                    className="text-blue-600 underline hover:text-blue-800 mb-2"
                >
                    {showExample ? 'Скрыть формат данных' : 'Показать формат данных'}
                </button>
                
                {showExample && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Формат CSV файла:</h3>
                        <div className="bg-gray-100 p-3 rounded overflow-x-auto">
                            <pre className="text-sm">{getImportCsvExample()}</pre>
                        </div>
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={handleDownloadExample}
                                className="text-sm bg-green-50 hover:bg-green-100 text-green-700 py-1 px-3 rounded border border-green-300"
                            >
                                Скачать пример CSV
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <p className="text-blue-700">
                        <strong>Примечание:</strong> Импортируемый файл должен содержать заголовок с названиями колонок и данные в формате CSV.
                        Система автоматически создаст новые товары и регионы, если они не существуют в базе.
                    </p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Выберите CSV файл
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!file}
                    className={`px-4 py-2 rounded-md text-white font-medium
                        ${file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    Импортировать
                </button>
            </form>
            {message && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
                    {message}
                </div>
            )}
            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ImportData; 