import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Table, type Column } from '@/components/common/Table';
import { ChevronDown } from 'lucide-react';

type ShootingStatus = '매칭필요' | '매칭완료' | '계약서 전달완료' | '계약완료' | '촬영 완료' | '작업물 전달완료' | '정산완료' | '매칭실패';

interface Shooting {
    id: string; // 접수 번호
    organization: string; // 신청기관
    dateTime: string; // 촬영일시
    location: string; // 촬영장소
    grade: string; // 촬영등급 (e.g., A급, B급)
    photographer: string; // 배정작가
    status: ShootingStatus; // 처리상태
}

// Generate Mock Data for Pagination testing
const generateMockData = (): Shooting[] => {
    const statuses: ShootingStatus[] = ['매칭필요', '매칭완료', '계약완료', '촬영 완료', '정산완료'];
    const grades = ['Standard', 'Pro', 'Master'];
    return Array.from({ length: 125 }).map((_, i) => ({
        id: `S2024${String(i + 1).padStart(4, '0')}`,
        organization: `기업 ${i + 1}`,
        dateTime: `2024-01-${String((i % 30) + 1).padStart(2, '0')} 14:00`,
        location: i % 2 === 0 ? '서울 강남구' : '경기도 성남시',
        grade: grades[i % grades.length],
        photographer: i % 5 === 0 ? '미배정' : `작가 ${i % 10}`,
        status: statuses[i % statuses.length]
    }));
};

const INITIAL_DATA = generateMockData();

const STATUS_OPTIONS: ShootingStatus[] = [
    '매칭필요', '매칭완료', '계약서 전달완료', '계약완료',
    '촬영 완료', '작업물 전달완료', '정산완료', '매칭실패'
];

export default function GeneralShooting() {
    const [shootings, setShootings] = useState<Shooting[]>(INITIAL_DATA);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Dropdown State
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Status Change Handler
    const handleStatusChange = (id: string, newStatus: ShootingStatus) => {
        setShootings(prev => prev.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
        ));
        setOpenDropdownId(null);
    };

    // Toggle Dropdown
    const toggleDropdown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenDropdownId(prev => prev === id ? null : id);
    };

    // Close on click outside (Attached to document in a real app, here simplified via background click emulation if needed, or just rely on re-clicking)
    // A global click listener would be better, but for simplicity:
    useEffect(() => {
        const closeDropdown = () => setOpenDropdownId(null);
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, []);

    // Pagination Logic
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = shootings.slice(startIndex, endIndex);

    const columns: Column<Shooting>[] = [
        {
            header: '접수 번호',
            accessor: 'id',
            filterable: false
        },
        {
            header: '신청기관',
            accessor: 'organization',
            filterable: true
        },
        {
            header: '촬영일시',
            accessor: 'dateTime',
            filterable: true,
            filterType: 'date-range',
            getValue: (item) => item.dateTime
        },
        {
            header: '촬영장소',
            accessor: 'location',
            filterable: true
        },
        {
            header: '촬영등급',
            accessor: (item) => (
                <span className={`font-bold ${item.grade === 'Master' ? 'text-purple-600' :
                    item.grade === 'Pro' ? 'text-blue-600' :
                        'text-gray-600' // Standard
                    }`}>
                    {item.grade}
                </span>
            ),
            filterable: true,
            filterType: 'select',
            filterOptions: ['Standard', 'Pro', 'Master'],
            getValue: (item) => item.grade
        },
        {
            header: '배정작가',
            accessor: 'photographer',
            filterable: true,
            filterType: 'text'
        },
        {
            header: '처리상태',
            accessor: (item) => (
                <div className="relative">
                    <button
                        onClick={(e) => toggleDropdown(e, item.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                            ${item.status === '매칭실패' ? 'bg-red-100 text-red-600' :
                                item.status === '정산완료' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'}
                        `}
                    >
                        {item.status}
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* Dropdown Menu - Fixed Position Strategy could be better but simplified absolute with z-index */}
                    {openDropdownId === item.id && (
                        <div
                            className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="py-1 max-h-60 overflow-y-auto flex flex-col">
                                {STATUS_OPTIONS.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(item.id, status)}
                                        className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50
                                            ${item.status === status ? 'text-[#00A980] font-bold' : 'text-gray-700'}
                                        `}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
            className: 'w-48',
            filterable: true,
            filterType: 'select',
            filterOptions: STATUS_OPTIONS,
            getValue: (item) => item.status
        }
    ];

    return (
        <div className="p-8">
            <PageHeader title="접수된 행사촬영" onSearch={(term) => console.log('Global Search:', term)} />
            <Table
                data={currentData}
                columns={columns}
                onRowClick={(item) => console.log('Row clicked:', item.id)}
                pagination={{
                    currentPage,
                    totalItems: shootings.length,
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
