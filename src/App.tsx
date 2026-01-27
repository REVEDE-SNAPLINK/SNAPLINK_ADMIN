import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/layouts/MainLayout';
import LoginPage from '@/pages/Login';
import ChatPage from '@/pages/Chat';
import SchedulePage from '@/pages/Schedule';
import ReportsPage from '@/pages/Reports';
import ShootingsPage from '@/pages/Shootings';
import ReservationsPage from '@/pages/Reservations';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';

import GeneralDashboard from '@/pages/dashboard/General';
import AcquisitionDashboard from '@/pages/dashboard/Acquisition';
import FunnelDashboard from '@/pages/dashboard/Funnel';
import CreatorDashboard from '@/pages/dashboard/Creator';

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
          <Route path="/dashboard/general" element={<GeneralDashboard />} />
          <Route path="/dashboard/acquisition" element={<AcquisitionDashboard />} />
          <Route path="/dashboard/funnel" element={<FunnelDashboard />} />
          <Route path="/dashboard/creator" element={<CreatorDashboard />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/shootings" element={<ShootingsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/notice" element={<Placeholder title="공지사항 관리" />} />
          <Route path="/faq" element={<Placeholder title="FAQ 관리" />} />
          <Route path="/users" element={<Placeholder title="회원 관리" />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/banners" element={<Placeholder title="프로모션 배너 관리" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
