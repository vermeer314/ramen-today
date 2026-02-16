import { useQuery } from '@tanstack/react-query';
import { fetchEventReports, fetchClosingReports } from '../api/reports';
import { useState } from 'react';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('pending');

  // 이벤트 제보
  const { data: eventReports, isLoading: isEventLoading } = useQuery({
    queryKey: ['event_reports'],
    queryFn: fetchEventReports,
  });
  // 영업 변동 제보
  const { data: closingReports, isLoading: isClosingLoading } = useQuery({
    queryKey: ['closing_reports'],
    queryFn: fetchClosingReports,
  });

  const events = eventReports?.map((r) => ({ ...r, type: 'event' })) || [];
  const closings =
    closingReports?.map((r) => ({ ...r, type: 'closing' })) || [];

  const allPendingReports = [...events, ...closings]
    .filter((r) => r.status === 'pending')
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const allProcessedReports = [...events, ...closings]
    .filter((r) => r.status !== 'pending')
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  return (
    // 모바일 - 액티브 탭으로 pending/done에 따라 한 쪽만 보여줌
    // 데스크탑 - 가로로 모두 펼침
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">관리자 페이지</h1>
      <div className="flex gap-2 lg:hidden p-4 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'pending' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          pending
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'done' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          done
        </button>
      </div>
      <div className="flex flex-col lg:flex-row h-screen">
        {/* 신규 제보 */}
        <section
          className={`flex-1 p-4 ${activeTab === 'pending' ? 'block' : 'hidden'} lg:block lg:border-r`}
        >
          <h2 className="font-bold mb-4">신규 제보</h2>
          {/* ✏️ 새로운 제보 없을 때 구현해야함*/}
          {allPendingReports.map((report) => {
            return (
              <div
                key={`${report.type}-${report.id}`}
                className={`p-3 mb-2 border-2 rounded-2xl flex items-center gap-4 ${report.type === 'event' ? 'border-green-100 bg-green-50' : 'border-orange-100 bg-orange-50'}`}
              >
                {/* 태그 */}
                <span
                  className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${report.type === 'event' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}
                >
                  {report.type === 'event' ? '🍜 이벤트' : '📢 영업변동'}
                </span>

                {/* 가게 이름 */}
                <h3 className="font-bold text-sm truncate min-w-0">
                  {report.shop_name}
                </h3>

                {/* 원본 링크 */}
                <a
                  href={report.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto *:text-xs text-blue-600 underline shrink-0"
                >
                  link
                </a>

                {/* 검토 버튼 */}
                <button className="shrink-0 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform">
                  검토하기
                </button>
              </div>
            );
          })}
        </section>

        {/* 처리 내역 */}
        <section
          className={`flex-1 p-4 ${activeTab === 'done' ? 'block' : 'hidden'} lg:block`}
        >
          <h2 className="font-bold mb-4">처리 내역</h2>
          {allProcessedReports.map((report) => {
            return (
              <div
                key={`${report.type}-${report.id}`}
                className={`p-3 mb-2 border-2 rounded-2xl flex items-center gap-4 ${getStatusColor(report.status)}`}
              >
                {/* 태그 */}
                <span
                  className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg 
                    ${report.type === 'event' ? 'bg-green-500' : 'bg-orange-500'}`}
                >
                  {report.type === 'event' ? '🍜 이벤트' : '📢 영업변동'}
                </span>

                {/* 가게 이름 */}
                <h3 className="font-bold text-sm truncate min-w-0">
                  {report.shop_name}
                </h3>

                {/* 원본 링크 */}
                <a
                  href={report.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto *:text-xs text-blue-600 underline shrink-0"
                >
                  link
                </a>

                {/* 검토 버튼 */}
                <button className="shrink-0 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform">
                  수정하기
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-300 border-green-200';
    case 'duplicate':
      return 'bg-gray-300 border-gray-200';
    case 'rejected':
      return 'bg-red-500 border-red-400';
    default:
      return 'bg-white';
  }
};
