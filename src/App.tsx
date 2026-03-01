import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/layouts/MainLayout';
import LoginPage from '@/pages/Login';
import ChatPage from '@/pages/Chat';
import SchedulePage from '@/pages/Schedule';
import ReportsPage from '@/pages/Reports';
import ReservationsPage from '@/pages/Reservations';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';

import GeneralDashboard from '@/pages/dashboard/General';
import AcquisitionDashboard from '@/pages/dashboard/Acquisition';
import FunnelDashboard from '@/pages/dashboard/Funnel';
import CreatorDashboard from '@/pages/dashboard/Creator';

import GroupShooting from '@/pages/shootings/Group';
import RegisterShooting from '@/pages/shootings/Register';

// Placeholder for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <PageHeader
      title={title}
      onSearch={(term) => console.log('Search:', term)}
    >
      {['공지사항 관리', 'FAQ 관리', '프로모션 배너 관리'].some(t => title.includes(t)) && (
        <button className="bg-[#00A980] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#008f6b] transition-colors">
          글쓰기
        </button>
      )}
    </PageHeader>
    <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
      {title.includes('행사/일정') ? (
        <div className="flex h-full gap-4">
          <div className="w-1/3 border-r border-gray-100 pr-4 flex items-center justify-center bg-gray-50 rounded-lg">
            <span className="text-gray-400">달력 영역 (준비중)</span>
          </div>
          <div className="w-2/3 flex items-center justify-center bg-gray-50 rounded-lg">
            <span className="text-gray-400">촬영 리스트 스크롤 영역 (준비중)</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full pt-20">
          <p className="text-gray-500">준비 중인 페이지입니다.</p>
        </div>
      )}
    </div>
  </div>
);

function App() {
  const { bootstrap } = useAuthStore();

  useEffect(() => {
    // App mount check
    bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard/general" replace />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/general" replace />} />

          {/* 대시보드 */}
          <Route path="/dashboard/general" element={<GeneralDashboard />} />
          <Route path="/dashboard/acquisition" element={<AcquisitionDashboard />} />
          <Route path="/dashboard/funnel" element={<FunnelDashboard />} />
          <Route path="/dashboard/creator" element={<CreatorDashboard />} />

          {/* 촬영관리 */}
          <Route path="/shootings/general" element={<Placeholder title="일반 촬영 접수 내역" />} />
          <Route path="/shootings/group" element={<GroupShooting />} />
          <Route path="/shootings/register" element={<RegisterShooting />} />

          {/* 일정관리 */}
          <Route path="/schedule" element={<SchedulePage />} />

          {/* 게시판 */}
          <Route path="/board/notice" element={<Placeholder title="공지사항" />} />
          <Route path="/board/faq" element={<Placeholder title="자주 묻는 질문" />} />
          <Route path="/board/news" element={<Placeholder title="소식" />} />

          {/* 고객관리 */}
          <Route path="/customers/clients" element={<Placeholder title="촬영 고객 관리" />} />
          <Route path="/customers/photographers" element={<Placeholder title="사진 작가 관리" />} />

          {/* 채팅 */}
          <Route path="/chat" element={<ChatPage />} />

          {/* 광고 및 프로모션 관리 */}
          <Route path="/marketing/ads" element={<Placeholder title="광고현황" />} />
          <Route path="/marketing/events" element={<Placeholder title="이벤트 관리" />} />
          <Route path="/marketing/promotions" element={<Placeholder title="프로모션" />} />

          {/* 데이터분석 */}
          <Route path="/analytics/dashboard" element={<Placeholder title="분석 대시보드" />} />
          <Route path="/analytics/download" element={<Placeholder title="데이터 다운로드" />} />

          {/* 콘텐츠 관리 */}
          <Route path="/content/portfolio" element={<Placeholder title="포트폴리오 검수" />} />
          <Route path="/content/community" element={<Placeholder title="커뮤니티 관리" />} />
          <Route path="/content/tags" element={<Placeholder title="카테고리, 태그 관리" />} />

          {/* 정산 매출 관리 */}
          <Route path="/settlement/pending" element={<Placeholder title="정산 대기 내역" />} />
          <Route path="/settlement/tax" element={<Placeholder title="세금 계산서 및 영수증 발행" />} />
          <Route path="/settlement/fees" element={<Placeholder title="수수료 설정" />} />

          {/* 고객 지원 관리 */}
          <Route path="/cs/reports" element={<Placeholder title="신고 접수 내역" />} />
          <Route path="/cs/inquiry" element={<Placeholder title="1:1 문의 내역" />} />
          <Route path="/cs/faq" element={<Placeholder title="FAQ 질문 관리" />} />
          <Route path="/cs/chat-log" element={<Placeholder title="채팅 로그 모니터링" />} />

          {/* 구버전 경로 호환성 유지 또는 리다이렉트 (필요 시) */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
