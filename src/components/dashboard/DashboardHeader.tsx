import React from 'react';

interface DashboardHeaderProps {
    title: string;
    onFilterChange: (filters: any) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, onFilterChange }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

            <div className="flex flex-wrap items-center gap-3">
                {/* Period Filter */}
                <select
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                    onChange={(e) => onFilterChange({ period: e.target.value })}
                >
                    <option value="7d">지난 7일</option>
                    <option value="30d">지난 30일</option>
                    <option value="90d">지난 90일</option>
                </select>

                {/* User Type Filter */}
                <select
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                    onChange={(e) => onFilterChange({ userType: e.target.value })}
                >
                    <option value="all">모든 사용자</option>
                    <option value="customer">고객</option>
                    <option value="creator">작가</option>
                </select>

                {/* Platform Filter */}
                <select
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#00A980] outline-none"
                    onChange={(e) => onFilterChange({ platform: e.target.value })}
                >
                    <option value="all">모든 플랫폼</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                </select>
            </div>
        </div>
    );
};
