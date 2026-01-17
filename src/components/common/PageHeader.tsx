import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    onSearch?: (term: string) => void;
    children?: ReactNode;
}

export function PageHeader({ title, onSearch, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

            <div className="flex items-center gap-4">
                {onSearch && (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="검색어를 입력하세요"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A980] focus:border-transparent w-[300px]"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
