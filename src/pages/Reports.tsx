import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Table, type Column } from '@/components/common/Table';

interface Report {
    id: string; // 신고 번호
    date: string; // 접수 일시
    category: string; // 카테고리
    reporter: string; // 신고자
    reportedUser: string; // 피신고자
    content: string; // 신고 내용
    status: '미처리' | '처리'; // 처리상태: 미처리, 처리
}

// Generate Mock Data
const generateMockReports = (): Report[] => {
    const categories = ['욕설/비방', '스팸/홍보', '사기', '기타'];
    return Array.from({ length: 45 }).map((_, i) => ({
        id: `R2024${String(i + 1).padStart(4, '0')}`,
        date: `2024-01-${String((i % 30) + 1).padStart(2, '0')} 14:30`,
        category: categories[i % categories.length],
        reporter: `user${i + 1}`,
        reportedUser: `bad_user${i + 1}`,
        content: i % 2 === 0 ? '욕설을 했습니다.' : '불법 홍보물 게시',
        status: i % 3 === 0 ? '처리' : '미처리'
    }));
};

const MOCK_REPORTS = generateMockReports();

export default function ReportsPage() {
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = MOCK_REPORTS.slice(startIndex, endIndex);

    const columns: Column<Report>[] = [
        {
            header: '신고 번호',
            accessor: 'id',
            filterable: false
        },
        {
            header: '접수 일시',
            accessor: 'date',
            filterable: true,
            filterType: 'date-range',
            getValue: (item) => item.date // Provide raw string for date filtering
        },
        {
            header: '카테고리',
            accessor: 'category',
            filterable: true,
            filterType: 'select',
            filterOptions: ['욕설/비방', '스팸/홍보', '사기', '기타']
        },
        {
            header: '신고자',
            accessor: 'reporter',
            filterable: true
        },
        {
            header: '피신고자',
            accessor: 'reportedUser',
            filterable: true
        },
        {
            header: '신고 내용',
            accessor: 'content',
            filterable: true,
            className: 'max-w-xs truncate'
        },
        {
            header: '처리상태',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === '미처리' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                    {item.status}
                </span>
            ),
            filterable: true,
            filterType: 'select',
            filterOptions: ['미처리', '처리'],
            getValue: (item) => item.status // Critical for filtering on rendered component columns
        },
        {
            header: '',
            accessor: (_) => (
                <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('View report');
                    }}
                >
                    열람
                </button>
            ),
            filterable: false,
            className: 'w-20 text-center'
        }
    ];

    return (
        <div className="p-8">
            <PageHeader title="접수된 신고" onSearch={(term) => console.log('Global Search:', term)} />
            <Table
                data={currentData}
                columns={columns}
                onRowClick={(item) => console.log('Row clicked:', item.id)}
                pagination={{
                    currentPage,
                    totalItems: MOCK_REPORTS.length,
                    pageSize,
                    onPageChange: setCurrentPage,
                    onPageSizeChange: (size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }
                }}
            />
        </div>
    );
}
