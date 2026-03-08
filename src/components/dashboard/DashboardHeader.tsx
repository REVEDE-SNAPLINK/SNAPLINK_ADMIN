import React from 'react';

interface DashboardHeaderProps {
    title: string;
    filters: any;
    onFilterChange: (filters: any) => void;
    metadata?: {
        firstDataDate?: string;
        maxDate?: string;
    };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, filters, onFilterChange, metadata }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

            <div className="flex flex-wrap items-center gap-3">
                {/* Period Filter */}
                <div className="flex items-center gap-2">
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                        value={filters.period}
                        onChange={(e) => onFilterChange({ period: e.target.value })}
                    >
                        <option value="7d">지난 7일</option>
                        <option value="30d">지난 30일</option>
                        <option value="90d">지난 90일</option>
                        <option value="custom">직접 입력</option>
                    </select>

                    {filters.period === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <input
                                type="date"
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                                value={filters.startDate || ''}
                                min={metadata?.firstDataDate}
                                max={metadata?.maxDate}
                                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                            />
                            <span className="text-gray-400 text-xs">~</span>
                            <input
                                type="date"
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                                value={filters.endDate || ''}
                                min={metadata?.firstDataDate}
                                max={metadata?.maxDate}
                                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                {/* User Type Filter */}
                <select
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                    value={filters.userType}
                    onChange={(e) => onFilterChange({ userType: e.target.value })}
                >
                    <option value="all">모든 사용자</option>
                    <option value="user">고객</option>
                    <option value="photographer">작가</option>
                </select>

                {/* Platform Filter */}
                <select
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                    value={filters.platform}
                    onChange={(e) => onFilterChange({ platform: e.target.value })}
                >
                    <option value="all">모든 플랫폼</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                </select>
            </div>
        </div>
    );
};
