export const formatCurrency = (value: number, showSymbol: boolean = true): string => {
    if (isNaN(value)) {
        return showSymbol ? 'не число ₽' : 'не число';
    }
    
    const options: Intl.NumberFormatOptions = {
        style: showSymbol ? 'currency' : 'decimal',
        currency: showSymbol ? 'RUB' : undefined,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    };
    
    return new Intl.NumberFormat('ru-RU', options).format(value);
};

export const formatDate = (dateString: string): string => {
    if (!dateString) {
        console.warn('Date string is undefined or empty');
        return '';
    }

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return dateString;
        }

        return new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}; 