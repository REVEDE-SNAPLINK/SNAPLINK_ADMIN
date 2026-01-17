import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Table, type Column } from '@/components/common/Table';
import { ChevronDown } from 'lucide-react';

type ReservationStatus = '예약완료' | '수락됨' | '촬영완료' | '업로드완료' | '거절됨';

interface Reservation {
    id: string; // 접수 번호
    customerName: string; // 고객명
    dateTime: string; // 촬영일시
    item: string; // 촬영항목
    request: string; // 요청사항
    photographer: string; // 촬영작가
    status: ReservationStatus; // 처리상태
}

// Generate Mock Data
const generateMockData = (): Reservation[] => {
    const statuses: ReservationStatus[] = ['예약완료', '수락됨', '촬영완료', '업로드완료', '거절됨'];
    const items = ['증명사진', '프로필', '웨딩', '가족사진', '행사스냅'];

    return Array.from({ length: 85 }).map((_, i) => ({
        id: `R2024${String(i + 1).padStart(4, '0')}`,
        customerName: `고객 ${i + 1}`,
        dateTime: `2024-02-${String((i % 28) + 1).padStart(2, '0')} ${String(10 + (i % 8))}:00`,
        item: items[i % items.length],
        request: i % 3 === 0 ? '자연스러운 보정 부탁드립니다.' : '빠른 작업 요청',
        photographer: i % 4 === 0 ? '미배정' : `작가 ${i % 5}`,
        status: statuses[i % statuses.length]
    }));
};

const INITIAL_DATA = generateMockData();

const STATUS_OPTIONS: ReservationStatus[] = ['예약완료', '수락됨', '촬영완료', '업로드완료', '거절됨'];

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>(INITIAL_DATA);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Dropdown State
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Status Change Handler
    const handleStatusChange = (id: string, newStatus: ReservationStatus) => {
        setReservations(prev => prev.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
        ));
        setOpenDropdownId(null);
    };

    // Toggle Dropdown
    const toggleDropdown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenDropdownId(prev => prev === id ? null : id);
    };

    useEffect(() => {
        const closeDropdown = () => setOpenDropdownId(null);
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, []);

    // Pagination Logic
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = reservations.slice(startIndex, endIndex);

    const columns: Column<Reservation>[] = [
        {
            header: '접수 번호',
            accessor: 'id',
            filterable: false
        },
        {
            header: '고객명',
            accessor: 'customerName',
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
            header: '촬영항목',
            accessor: 'item',
            filterable: true,
            filterType: 'text',
            className: 'max-w-[150px] truncate'
        },
        {
            header: '요청사항',
            accessor: 'request',
            filterable: true,
            className: 'max-w-xs truncate'
        },
        {
            header: '촬영작가',
            accessor: 'photographer',
            filterable: true
        },
        {
            header: '처리상태',
            accessor: (item) => (
                <div className="relative">
                    <button
                        onClick={(e) => toggleDropdown(e, item.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                            ${item.status === '거절됨' ? 'bg-red-100 text-red-600' :
                                item.status === '업로드완료' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'}
                        `}
                    >
                        {item.status}
                        <ChevronDown className="w-3 h-3" />
                    </button>

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
            <PageHeader title="예약 조회" onSearch={(term) => console.log('Global Search:', term)} />
            <Table
                data={currentData}
                columns={columns}
                onRowClick={(item) => console.log('Row clicked:', item.id)}
                pagination={{
                    currentPage,
                    totalItems: reservations.length,
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
