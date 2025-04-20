// Utility functions for formatting data

/**
 * Formats a number as currency
 * @param value - The number to format
 * @param showSymbol - Whether to show the currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | undefined, showSymbol = true): string => {
    if (value === undefined || isNaN(value)) {
        return showSymbol ? '₽0.00' : '0.00';
    }
    
    const formatter = new Intl.NumberFormat('ru-RU', {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'RUB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(value);
};

/**
 * Formats a date string
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
        console.warn('Undefined date string provided to formatDate');
        return '';
    }
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string provided to formatDate: ${dateString}`);
            return dateString;
        }
        
        return new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    } catch (error) {
        console.error(`Error formatting date ${dateString}:`, error);
        return dateString;
    }
};

/**
 * Генерирует пример CSV для импорта
 * @returns Строка с примером CSV
 */
export const getImportCsvExample = (): string => {
    return `Номер заказа,ID клиента,Имя клиента,Товар,Количество,Сумма,Дата заказа,Регион
ORD-101,1,Иванов Иван,Ноутбук,2,90000.00,2023-01-15,Москва
ORD-102,2,Петрова Мария,Смартфон,1,35000.00,2023-01-20,Новосибирск
ORD-103,3,Сидоров Петр,Планшет,3,75000.00,2023-01-25,Санкт-Петербург`;
};

/**
 * Скачивает текстовый файл с примером CSV
 */
export const downloadCsvExample = (): void => {
    const csvContent = getImportCsvExample();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}; 