import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchEventReports,
  fetchClosingReports,
  fetchActiveEventReportIds,
} from '../api/reports';
import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight } from 'lucide-react';

interface BaseReport {
  id: string;
  shop_name: string;
  mapped_shop_name?: string | null;
  source_url: string;
  status: 'pending' | 'approved' | 'duplicate' | 'rejected' | 'canceled';
  created_at: string;
}

interface EventReport extends BaseReport {
  type: 'event';
}

interface ClosingReport extends BaseReport {
  type: 'closing';
}

type Report = EventReport | ClosingReport;

export const AdminPage = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [shopSearchQuery, setShopSearchQuery] = useState<string>('');
  const [shopResults, setShopResults] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const [formData, setFormData] = useState({
    shop_id: '',
    source_url: '',
    status_type: 'normal',
    starts_at: getTodayString(),
    ends_at: getTodayString(),
    menu_name: '',
    description: '',
    imageFile: null as File | null,
    imagePreview: '',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isDirectCreateMode, setIsDirectCreateMode] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  const [doneFilter, setDoneFilter] = useState('live');

  const closeModal = () => {
    setSelectedReport(null);
    setIsEditMode(false);
    setIsDirectCreateMode(false);
    setIsViewOnlyMode(false);
    setEditingEventId(null);
  };

  const { data: eventReports } = useQuery({
    queryKey: ['event_reports'],
    queryFn: fetchEventReports,
  });

  const { data: closingReports } = useQuery({
    queryKey: ['closing_reports'],
    queryFn: fetchClosingReports,
  });

  const { data: activeEvents } = useQuery({
    queryKey: ['active_events'],
    queryFn: fetchActiveEventReportIds,
  });

  const activeReportIds = activeEvents?.map((item) => item.report_id) || [];

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

  // 게시 중 필터링
  const filteredProcessedReports = useMemo(() => {
    return allProcessedReports.filter((report) => {
      if (doneFilter === 'all') return true;

      if (doneFilter === 'live') {
        if (report.status !== 'approved') return false;
        return activeReportIds.includes(report.id);
      }

      if (doneFilter === 'approved') return report.status === 'approved';
      if (doneFilter === 'rejected')
        return report.status === 'rejected' || report.status === 'duplicate';
      if (doneFilter === 'canceled') return report.status === 'canceled';
      return true;
    });
  }, [allProcessedReports, doneFilter, activeReportIds]);

  const handleOpenModal = (report: Report) => {
    setSelectedReport(report);
    setShopSearchQuery(report.shop_name);
    setSelectedShop(null);
    setShopResults([]);
    setFormData({
      shop_id: '',
      source_url: report.source_url,
      status_type: report.type === 'closing' ? 'closed_all' : 'normal',
      starts_at: getTodayString(),
      ends_at: getTodayString(),
      menu_name: '',
      description: '',
      imageFile: null,
      imagePreview: '',
    });
  };

  const handleEditModal = async (report: Report) => {
    if (report.status !== 'approved') {
      alert('승인되어 게시된 제보만 수정할 수 있습니다.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ramen_events')
        .select('*, shops(id, name, profile_img_url)')
        .eq('report_id', report.id)
        .single();

      if (error || !data) {
        alert('등록된 이벤트 정보를 찾을 수 없습니다.');
        return;
      }

      setSelectedReport(report);
      setIsEditMode(true);
      setEditingEventId(data.id);

      setSelectedShop(data.shops as unknown as Shop);
      setShopSearchQuery((data.shops as unknown as Shop).name);

      setFormData({
        shop_id: data.shop_id,
        source_url: data.source_url || report.source_url,
        status_type: data.status_type,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        menu_name: data.menu_name || '',
        description: data.description || '',
        imageFile: null,
        imagePreview: data.proof_image_url,
      });
    } catch (err) {
      console.error(err);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleDirectCreate = () => {
    setSelectedReport(null);
    setIsEditMode(false);
    setIsDirectCreateMode(true);
    setEditingEventId(null);
    setSelectedShop(null);
    setShopSearchQuery('');

    setFormData({
      shop_id: '',
      source_url: '',
      status_type: 'normal',
      starts_at: getTodayString(),
      ends_at: getTodayString(),
      menu_name: '',
      description: '',
      imageFile: null,
      imagePreview: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setShopSearchQuery(query);

    if (query.length < 2) {
      setShopResults([]);
      return;
    }

    const { data } = await supabase
      .from('shops')
      .select('id, name, profile_img_url')
      .ilike('name', `%${query}%`)
      .limit(5);

    setShopResults((data as Shop[]) || []);
  };

  const handleViewModal = (report: Report) => {
    setSelectedReport(report);
    setIsViewOnlyMode(true);
    setShopSearchQuery(report.shop_name);
    setFormData({
      shop_id: '',
      source_url: report.source_url,
      status_type: report.type === 'closing' ? 'closed_all' : 'normal',
      starts_at: getTodayString(),
      ends_at: getTodayString(),
      menu_name: '',
      description: '',
      imageFile: null,
      imagePreview: '',
    });
  };

  const handleDoneRowClick = (report: Report) => {
    if (report.status === 'approved') {
      handleEditModal(report);
    } else {
      handleViewModal(report);
    }
  };

  const handleReviewApprove = async () => {
    if (!selectedReport && !isDirectCreateMode) return;
    if (!formData.shop_id) {
      alert('가게를 매핑해주세요!');
      return;
    }
    if (!isEditMode && !formData.imageFile) {
      alert('스크린샷을 업로드해주세요!');
      return;
    }

    try {
      let publicUrl = formData.imagePreview;

      if (formData.imageFile) {
        const fileExt = formData.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('proof-images')
          .upload(fileName, formData.imageFile);
        if (uploadError)
          throw new Error(`이미지 업로드 실패: ${uploadError.message}`);

        const {
          data: { publicUrl: newUrl },
        } = supabase.storage.from('proof-images').getPublicUrl(fileName);
        publicUrl = newUrl;
      }

      const eventData = {
        shop_id: formData.shop_id,
        menu_name: formData.menu_name || null,
        proof_image_url: publicUrl,
        source_url: formData.source_url,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        status_type: formData.status_type,
        description: formData.description || null,
      };

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('ramen_events')
          .update(eventData)
          .eq('id', editingEventId);
        if (updateError) throw new Error(`수정 실패: ${updateError.message}`);
        alert('🎉 성공적으로 수정되었습니다!');
      } else if (isDirectCreateMode) {
        const targetTable =
          formData.status_type === 'normal'
            ? 'event_reports'
            : 'closing_reports';

        const { data: reportData, error: reportError } = await supabase
          .from(targetTable)
          .insert({
            shop_name: selectedShop?.name || '관리자 직접 등록',
            source_url: formData.source_url,
            status: 'approved',
          })
          .select('id')
          .single();

        if (reportError)
          throw new Error(`제보 로그 생성 실패: ${reportError.message}`);

        const { error: insertError } = await supabase
          .from('ramen_events')
          .insert({
            ...eventData,
            report_id: reportData.id,
          });

        if (insertError)
          throw new Error(`직접 등록 실패: ${insertError.message}`);
        alert('🎉 성공적으로 직접 등록되었습니다!');
      } else {
        const { error: insertError } = await supabase
          .from('ramen_events')
          .insert({
            ...eventData,
            report_id: selectedReport?.id,
          });

        if (insertError) throw new Error(`생성 실패: ${insertError.message}`);

        const targetTable =
          selectedReport?.type === 'event'
            ? 'event_reports'
            : 'closing_reports';

        const { error: statusError } = await supabase
          .from(targetTable)
          .update({
            status: 'approved',
            mapped_shop_name: selectedShop?.name,
          })
          .eq('id', selectedReport?.id);

        if (statusError)
          throw new Error(`상태 업데이트 실패: ${statusError.message}`);
        alert('🎉 성공적으로 게시되었습니다!');
      }

      queryClient.invalidateQueries({ queryKey: ['event_reports'] });
      queryClient.invalidateQueries({ queryKey: ['closing_reports'] });
      queryClient.invalidateQueries({ queryKey: ['active_events'] });
      closeModal();
    } catch (error: unknown) {
      console.error('처리 중 에러 발생:', error);
      if (error instanceof Error) alert(error.message);
      else alert('알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedReport || !editingEventId) return;
    if (!window.confirm('이벤트를 정말 취소하고 앱에서 삭제하시겠습니까?'))
      return;

    try {
      const { error: deleteError } = await supabase
        .from('ramen_events')
        .delete()
        .eq('id', editingEventId);
      if (deleteError)
        throw new Error(`이벤트 삭제 실패: ${deleteError.message}`);

      const targetTable =
        selectedReport.type === 'event' ? 'event_reports' : 'closing_reports';
      const { error: updateError } = await supabase
        .from(targetTable)
        .update({ status: 'canceled' })
        .eq('id', selectedReport.id);
      if (updateError)
        throw new Error(`상태 업데이트 실패: ${updateError.message}`);

      alert('🗑️ 게시물이 성공적으로 취소/삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['event_reports'] });
      queryClient.invalidateQueries({ queryKey: ['closing_reports'] });
      closeModal();
    } catch (error: unknown) {
      console.error('삭제 처리 중 에러 발생:', error);
      if (error instanceof Error) alert(error.message);
      else alert('알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleReviewStatus = async (newStatus: 'duplicate' | 'rejected') => {
    if (!selectedReport) return;
    const actionName = newStatus === 'duplicate' ? '중복' : '거절';
    if (!window.confirm(`이 제보를 ${actionName} 처리하시겠습니까?`)) return;

    try {
      const targetTable =
        selectedReport.type === 'event' ? 'event_reports' : 'closing_reports';
      const { error: updateError } = await supabase
        .from(targetTable)
        .update({ status: newStatus })
        .eq('id', selectedReport.id);
      if (updateError)
        throw new Error(`상태 업데이트 실패: ${updateError.message}`);

      alert(`✅ ${actionName} 처리가 완료되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['event_reports'] });
      queryClient.invalidateQueries({ queryKey: ['closing_reports'] });
      closeModal();
    } catch (error: unknown) {
      console.error(`${actionName} 처리 중 에러 발생:`, error);
      if (error instanceof Error) alert(error.message);
      else alert('알 수 없는 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-4 md:p-6 h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
      <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-4 shrink-0">
        관리자 페이지
      </h1>

      <div className="flex gap-2 lg:hidden mb-4 shrink-0">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'pending' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
        >
          신규 제보
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'done' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
        >
          처리 내역
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 pb-4">
        {/* 신규 제보 섹션 */}
        <section
          className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-0 flex-col ${activeTab === 'pending' ? 'flex' : 'hidden'} lg:flex`}
        >
          <div className="shrink-0 p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl z-10">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              🚨 대기 중인 제보
              {allPendingReports.length > 0 && (
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[11px] font-black">
                  {allPendingReports.length}건
                </span>
              )}
            </h2>
            <button
              onClick={handleDirectCreate}
              className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-sm"
            >
              + 직접 등록
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 md:p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex flex-col">
              {allPendingReports.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm font-bold">
                  새로운 제보가 없습니다.
                </div>
              )}
              {allPendingReports.map((report) => (
                <div
                  key={`${report.type}-${report.id}`}
                  onClick={() => handleOpenModal(report)}
                  className="flex items-center gap-3 md:gap-6 py-3.5 md:py-5 px-2 md:px-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors rounded-xl"
                >
                  <span
                    className={`shrink-0 w-[68px] md:w-[76px] flex items-center justify-center gap-1 text-[10px] md:text-xs font-black py-1 md:py-1.5 rounded-md ${report.type === 'event' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                  >
                    <span>{report.type === 'event' ? '🍜' : '📢'}</span>
                    <span>{report.type === 'event' ? '이벤트' : '변동'}</span>
                  </span>
                  <h3 className="font-bold text-sm md:text-base text-gray-900 truncate flex-1">
                    {report.shop_name}
                  </h3>
                  <ChevronRight className="w-[18px] h-[18px] md:w-6 md:h-6 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 처리 내역 섹션 */}
        <section
          className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-0 flex-col ${activeTab === 'done' ? 'flex' : 'hidden'} lg:flex`}
        >
          <div className="shrink-0 p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center bg-white rounded-t-2xl z-10 gap-3 md:gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <h2 className="font-bold text-gray-900 shrink-0 mr-4 whitespace-nowrap">
              📋 처리 내역
            </h2>

            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setDoneFilter('live')}
                className={`px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-md transition-colors ${doneFilter === 'live' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                게시 중
              </button>
              <button
                onClick={() => setDoneFilter('all')}
                className={`px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-md transition-colors ${doneFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                전체
              </button>
              <button
                onClick={() => setDoneFilter('approved')}
                className={`px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-md transition-colors ${doneFilter === 'approved' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                승인
              </button>
              <button
                onClick={() => setDoneFilter('rejected')}
                className={`px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-md transition-colors ${doneFilter === 'rejected' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                거절/중복
              </button>
              <button
                onClick={() => setDoneFilter('canceled')}
                className={`px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-md transition-colors ${doneFilter === 'canceled' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                취소
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 md:p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex flex-col">
              {filteredProcessedReports.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm font-bold">
                  해당하는 처리 내역이 없습니다.
                </div>
              )}
              {filteredProcessedReports.map((report) => {
                const badgeStyle =
                  report.status === 'approved'
                    ? 'bg-blue-100 text-blue-700'
                    : report.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : report.status === 'duplicate'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-100 text-gray-400';

                const statusInfoMap: Record<
                  string,
                  { emoji: string; text: string }
                > = {
                  approved: { emoji: '✅', text: '승인' },
                  rejected: { emoji: '🚫', text: '거절' },
                  duplicate: { emoji: '🔄', text: '중복' },
                  canceled: { emoji: '🗑️', text: '취소' },
                  pending: { emoji: '⏳', text: '대기' },
                };
                const statusInfo = statusInfoMap[report.status] || {
                  emoji: '❓',
                  text: '알수없음',
                };

                return (
                  <div
                    key={`${report.type}-${report.id}`}
                    onClick={() => handleDoneRowClick(report)}
                    className={`flex items-center gap-3 md:gap-6 py-3.5 md:py-5 px-2 md:px-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors rounded-xl ${report.status === 'canceled' ? 'opacity-50 grayscale' : ''}`}
                  >
                    <span
                      className={`shrink-0 w-[68px] md:w-[76px] flex items-center justify-center gap-1 text-[10px] md:text-xs font-black py-1 md:py-1.5 rounded-md ${report.type === 'event' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                    >
                      <span>{report.type === 'event' ? '🍜' : '📢'}</span>
                      <span>{report.type === 'event' ? '이벤트' : '변동'}</span>
                    </span>

                    <h3
                      className={`font-bold text-sm md:text-base truncate flex-1 ${report.status === 'canceled' ? 'line-through text-gray-500' : 'text-gray-900'}`}
                    >
                      {report.mapped_shop_name || report.shop_name}
                    </h3>

                    <span
                      className={`shrink-0 w-16 md:w-[72px] flex items-center justify-center gap-1 text-[10px] md:text-xs font-bold py-1 md:py-1.5 rounded-md ${badgeStyle}`}
                    >
                      <span>{statusInfo.emoji}</span>
                      <span>{statusInfo.text}</span>
                    </span>

                    <ChevronRight className="w-[18px] h-[18px] md:w-6 md:h-6 text-gray-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* 모달 */}
      {(selectedReport || isDirectCreateMode) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 h-[90dvh] md:h-auto md:max-h-[90dvh]">
            {/* 상단 헤더 */}
            <div className="shrink-0 p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start mb-1">
                {isDirectCreateMode ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-500 text-white">
                    ✍️ 관리자 직접 등록
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md ${selectedReport?.type === 'event' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}
                  >
                    {selectedReport?.type === 'event'
                      ? '🍜 이벤트 제보'
                      : '📢 영업변동 제보'}
                  </span>
                )}
                <button
                  onClick={closeModal}
                  className="text-gray-400 text-xl hover:text-black"
                >
                  ✕
                </button>
              </div>
              <h2 className="text-lg font-black text-gray-900">
                {isDirectCreateMode
                  ? '새로운 이벤트 추가'
                  : selectedReport?.shop_name}
              </h2>
            </div>

            {/* 바디 */}
            <div className="p-4 flex-1 overflow-y-auto overscroll-contain space-y-4">
              {/* 가게 매핑 */}
              <div>
                <label className="block text-s font-bold text-gray-500 mb-1">
                  가게 이름 (필수)
                </label>
                {selectedShop ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedShop.profile_img_url || ''}
                        alt="shop"
                        className="w-8 h-8 rounded-full bg-white object-cover border"
                      />
                      <div>
                        <p className="text-[9px] text-blue-600 font-bold">
                          매핑 완료
                        </p>
                        <p className="text-xs font-bold">{selectedShop.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedShop(null);
                        setFormData((prev) => ({ ...prev, shop_id: '' }));
                        setShopSearchQuery('');
                      }}
                      className="text-[10px] px-2 py-1 bg-white border rounded-md"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={shopSearchQuery}
                      onChange={handleSearchChange}
                      placeholder="정확한 가게명 검색"
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:border-black"
                    />
                    {shopResults.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                        {shopResults.map((shop) => (
                          <li
                            key={shop.id}
                            onClick={() => {
                              setSelectedShop(shop);
                              setFormData((prev) => ({
                                ...prev,
                                shop_id: shop.id,
                              }));
                              setShopResults([]);
                            }}
                            className="flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <img
                              src={shop.profile_img_url || ''}
                              className="w-6 h-6 rounded-full border object-cover"
                              alt=""
                            />
                            <span className="text-xs font-bold">
                              {shop.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* 증거 & 영업 상태 */}
              <div className="flex gap-3">
                <div className="w-24 h-36 shrink-0 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center">
                  {formData.imagePreview ? (
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-medium text-center leading-tight">
                      터치하여
                      <br />
                      사진 등록
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        setFormData((prev) => ({
                          ...prev,
                          imageFile: file,
                          imagePreview: URL.createObjectURL(file),
                        }));
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <label className="block text-s font-bold text-gray-500 mb-1">
                      원본 링크 (필수)
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        name="source_url"
                        value={formData.source_url}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-lg text-xs outline-none"
                        placeholder="링크"
                      />
                      <a
                        href={formData.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 px-2.5 py-2 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg flex items-center"
                      >
                        확인
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-s font-bold text-gray-500 mb-1 mt-2">
                      영업 상태
                    </label>
                    <select
                      name="status_type"
                      value={formData.status_type}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg text-xs outline-none bg-white font-bold text-blue-600"
                    >
                      <option value="normal">✅ 정상 / 이벤트</option>
                      <option value="closed_lunch">🍜 점심 조기마감</option>
                      <option value="closed_dinner">🌙 저녁 조기마감</option>
                      <option value="closed_all">🚫 금일 전체휴무</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5 ml-1">
                      시작일
                    </label>
                    <input
                      type="date"
                      name="starts_at"
                      value={formData.starts_at}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg text-xs outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5 ml-1">
                      종료일
                    </label>
                    <input
                      type="date"
                      name="ends_at"
                      value={formData.ends_at}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg text-xs outline-none bg-white"
                    />
                  </div>
                </div>
                {formData.status_type === 'normal' && (
                  <input
                    type="text"
                    name="menu_name"
                    value={formData.menu_name}
                    onChange={handleChange}
                    placeholder="메뉴명 (예: 한정 지로라멘)"
                    className="w-full p-2 border rounded-lg text-xs outline-none bg-white"
                  />
                )}
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="앱에 노출될 상세 설명을 적어주세요."
                  className="w-full h-14 p-2 border rounded-lg text-xs outline-none resize-none bg-white"
                />
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="shrink-0 p-4 border-t bg-white">
              {isViewOnlyMode ? (
                <button
                  onClick={closeModal}
                  className="w-full py-4 bg-gray-200 text-gray-700 rounded-xl font-bold active:scale-95 transition-transform"
                >
                  닫기 (내용 확인 전용)
                </button>
              ) : isEditMode ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleReviewApprove}
                    className="flex-[2] py-4 bg-green-500 text-white rounded-xl font-bold active:scale-95 transition-transform"
                  >
                    수정 내용 저장하기
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="flex-1 py-4 bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold active:scale-95 transition-transform"
                  >
                    게시 취소
                  </button>
                </div>
              ) : isDirectCreateMode ? (
                <button
                  onClick={handleReviewApprove}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
                >
                  직접 등록 및 게시하기
                </button>
              ) : (
                <>
                  <button
                    onClick={handleReviewApprove}
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold active:scale-95 transition-transform mb-2"
                  >
                    승인 및 게시하기
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewStatus('duplicate')}
                      className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-bold active:scale-95 transition-transform text-sm"
                    >
                      중복
                    </button>
                    <button
                      onClick={() => handleReviewStatus('rejected')}
                      className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold active:scale-95 transition-transform text-sm"
                    >
                      거절
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getTodayString = () => new Date().toISOString().split('T')[0];
