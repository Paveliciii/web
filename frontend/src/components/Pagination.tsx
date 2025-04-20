import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pageNumbers = [];
        
        // Always show the first page
        pageNumbers.push(
            <button
                key={1}
                onClick={() => onPageChange(1)}
                className={`px-3 py-1 mx-1 rounded ${
                    currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'
                }`}
            >
                1
            </button>
        );

        // If there are many pages, show ellipsis and skip some
        if (totalPages > 7) {
            if (currentPage > 3) {
                pageNumbers.push(
                    <span key="ellipsis1" className="px-3 py-1 mx-1">
                        ...
                    </span>
                );
            }

            // Show pages around current page
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`px-3 py-1 mx-1 rounded ${
                            currentPage === i ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'
                        }`}
                    >
                        {i}
                    </button>
                );
            }

            if (currentPage < totalPages - 2) {
                pageNumbers.push(
                    <span key="ellipsis2" className="px-3 py-1 mx-1">
                        ...
                    </span>
                );
            }
        } else {
            // If not many pages, show all
            for (let i = 2; i < totalPages; i++) {
                pageNumbers.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`px-3 py-1 mx-1 rounded ${
                            currentPage === i ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'
                        }`}
                    >
                        {i}
                    </button>
                );
            }
        }

        // Always show the last page
        if (totalPages > 1) {
            pageNumbers.push(
                <button
                    key={totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className={`px-3 py-1 mx-1 rounded ${
                        currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'
                    }`}
                >
                    {totalPages}
                </button>
            );
        }

        return pageNumbers;
    };

    return (
        <div className="flex justify-center items-center my-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 mx-1 rounded ${
                    currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-blue-600 border border-blue-300'
                }`}
            >
                Пред
            </button>
            
            {renderPageNumbers()}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 mx-1 rounded ${
                    currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-blue-600 border border-blue-300'
                }`}
            >
                След
            </button>
        </div>
    );
};

export default Pagination; 