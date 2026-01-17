import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale/ko';
import "react-datepicker/dist/react-datepicker.css";
import { clsx } from 'clsx';

// Register Korean locale
registerLocale('ko', ko);

// Generic Table Props
export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
    // Filtering configuration
    filterable?: boolean;
    filterType?: 'text' | 'select' | 'date-range';
    filterOptions?: string[]; // Options for select type
    getValue?: (item: T) => string; // Function to get raw value for filtering
}

export interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    pagination?: PaginationProps;
}

export function Table<T>({ data, columns, onRowClick, pagination }: TableProps<T>) {
    const [filters, setFilters] = useState<Record<number, any>>({});

    // Handle filter change
    const handleFilterChange = (colIndex: number, value: any) => {
        setFilters(prev => ({
            ...prev,
            [colIndex]: value
        }));
    };

    // Filter data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            return columns.every((col, index) => {
                if (!col.filterable) return true;
                const filterValue = filters[index];

                // Skip if filter is empty
                if (filterValue === undefined || filterValue === '' || (typeof filterValue === 'object' && !filterValue.start && !filterValue.end)) {
                    return true;
                }

                // Get raw value for comparison
                let itemValue = '';
                if (col.getValue) {
                    itemValue = col.getValue(item);
                } else if (typeof col.accessor === 'function') {
                    // Fallback to stringifying result if possible, but unsafe for components
                    // Ideally getValue should be provided if accessor returns a component
                    const result = col.accessor(item);
                    itemValue = typeof result === 'string' || typeof result === 'number' ? String(result) : '';
                } else {
                    itemValue = String(item[col.accessor]);
                }

                // Date Range Filtering
                if (col.filterType === 'date-range') {
                    const { start, end } = filterValue as { start?: Date | null, end?: Date | null };
                    if (!start && !end) return true;

                    // Assuming itemValue is a comparable string like 'YYYY-MM-DD...'
                    const dateValue = itemValue.substring(0, 10); // Simple YYYY-MM-DD extraction

                    if (start) {
                        const startDateStr = start.toISOString().substring(0, 10);
                        if (dateValue < startDateStr) return false;
                    }
                    if (end) {
                        const endDateStr = end.toISOString().substring(0, 10);
                        if (dateValue > endDateStr) return false;
                    }
                    return true;
                }

                // Text/Select Filtering
                return itemValue.toLowerCase().includes(String(filterValue).toLowerCase());
            });
        });
    }, [data, columns, filters]);

    // Check if any filter is active
    const hasActiveFilters = Object.values(filters).some(val => {
        if (typeof val === 'object') return val.start || val.end;
        return !!val;
    });

    // Pagination Logic
    const renderPagination = () => {
        if (!pagination) return null;

        const { currentPage, totalItems, pageSize, onPageChange, onPageSizeChange } = pagination;
        const totalPages = Math.ceil(totalItems / pageSize);
        const maxPageButtons = 5;

        // Calculate start and end page for the current view block
        const currentGroup = Math.ceil(currentPage / maxPageButtons);
        const startPage = (currentGroup - 1) * maxPageButtons + 1;
        const endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        const handlePrevGroup = () => {
            if (startPage > 1) {
                onPageChange(startPage - 1);
            }
        };

        const handleNextGroup = () => {
            if (endPage < totalPages) {
                onPageChange(endPage + 1);
            }
        };

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">페이지 당 행:</span>
                    <select
                        className="text-sm border border-gray-300 rounded p-1 outline-none focus:border-[#00A980]"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="첫 페이지"
                    >
                        <ChevronsLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={handlePrevGroup}
                        disabled={startPage === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="이전 5페이지"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={clsx(
                                "w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors",
                                page === currentPage
                                    ? "bg-[#00A980] text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={handleNextGroup}
                        disabled={endPage === totalPages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="다음 5페이지"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="마지막 페이지"
                    >
                        <ChevronsRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {/* Header Row */}
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    <div className="flex flex-col gap-2">
                                        <span className="h-6 flex items-center">{col.header}</span>

                                        {/* Filter Input */}
                                        {col.filterable && (
                                            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                                {col.filterType === 'date-range' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex gap-1">
                                                            <DatePicker
                                                                selected={filters[idx]?.start}
                                                                onChange={(date: Date | null) => handleFilterChange(idx, { ...filters[idx], start: date })}
                                                                selectsStart
                                                                startDate={filters[idx]?.start}
                                                                endDate={filters[idx]?.end}
                                                                locale="ko"
                                                                dateFormat="yyyy-MM-dd"
                                                                placeholderText="시작일"
                                                                className="w-full text-[10px] p-1 border border-gray-300 rounded focus:border-[#00A980] outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <DatePicker
                                                                selected={filters[idx]?.end}
                                                                onChange={(date: Date | null) => handleFilterChange(idx, { ...filters[idx], end: date })}
                                                                selectsEnd
                                                                startDate={filters[idx]?.start}
                                                                endDate={filters[idx]?.end}
                                                                minDate={filters[idx]?.start}
                                                                locale="ko"
                                                                dateFormat="yyyy-MM-dd"
                                                                placeholderText="종료일"
                                                                className="w-full text-[10px] p-1 border border-gray-300 rounded focus:border-[#00A980] outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : col.filterType === 'select' ? (
                                                    <select
                                                        className="w-full text-xs p-1 border border-gray-300 rounded focus:border-[#00A980] focus:ring-1 focus:ring-[#00A980] outline-none"
                                                        value={filters[idx] || ''}
                                                        onChange={(e) => handleFilterChange(idx, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="">전체</option>
                                                        {col.filterOptions?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="검색"
                                                            className="w-full text-xs p-1 pl-6 border border-gray-300 rounded focus:border-[#00A980] focus:ring-1 focus:ring-[#00A980] outline-none"
                                                            value={filters[idx] || ''}
                                                            onChange={(e) => handleFilterChange(idx, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <Search className="absolute left-1.5 top-1.5 w-3 h-3 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item, rowIdx) => (
                            <tr
                                key={rowIdx}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={onRowClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
                            >
                                {columns.map((col, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                    >
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                                    {hasActiveFilters ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination()}
        </div>
    );
}
