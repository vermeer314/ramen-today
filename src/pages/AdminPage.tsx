import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEventReports, fetchClosingReports } from '../api/reports';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AdminPage = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('pending');
  // 모달 상태
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // 가게 검색을 위한 상태
  const [shopSearchQuery, setShopSearchQuery] = useState<string>('');
  const [shopResults, setShopResults] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // 제보 작성 폼 상태
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

  const closeModal = () => setSelectedReport(null);

  // 이벤트 제보 쿼리
  const { data: eventReports, isLoading: isEventLoading } = useQuery({
    queryKey: ['event_reports'],
    queryFn: fetchEventReports,
  });
  // 영업 변동 제보 쿼리
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

  // 검토하기 버튼을 눌렀을 때 실행될 핸들러
  const handleOpenModal = (report: Report) => {
    // 모달 띄우기
    setSelectedReport(report);
    // 유저가 입력한 검색어 가져오기
    setShopSearchQuery(report.shop_name);
    //초기화
    setSelectedShop(null);
    setShopResults([]);

    // 폼 데이터 초기화
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

  // 모달 창 폼 데이터 핸들러
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 가게 검색 핸들러
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setShopSearchQuery(query);

    // 두 글자 이상일 경우에 실행하도록
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

  const handleReviewApprove = async () => {
    if (!selectedReport) return;

    // 1. 필수값 방어 (유효성 검사)
    if (!formData.shop_id) {
      alert('가게를 매핑해주세요!');
      return;
    }
    if (!formData.imageFile) {
      alert('스크린샷을 업로드해주세요!');
      return;
    }

    try {
      // supabase storage에 스크린샷 이미지 업로드
      const fileExt = formData.imageFile.name.split('.').pop();
      // 파일명이 안 겹치도록 현재시간+랜덤문자열 조합
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('proof-images')
        .upload(fileName, formData.imageFile);

      if (uploadError)
        throw new Error(`이미지 업로드 실패: ${uploadError.message}`);

      // 업로드된 이미지의 public url 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('proof-images').getPublicUrl(fileName);

      // ramen_events 테이블에 최종 데이터 insert
      const { error: insertError } = await supabase
        .from('ramen_events')
        .insert({
          shop_id: formData.shop_id,
          report_id: selectedReport.id,
          menu_name: formData.menu_name || null,
          proof_image_url: publicUrl,
          source_url: formData.source_url,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at,
          status_type: formData.status_type,
          description: formData.description || null,
        });

      if (insertError) throw new Error(`생성 실패: ${insertError.message}`);

      // 원본 제보(reports) 상태를 'approved'로 변경
      const targetTable =
        selectedReport.type === 'event' ? 'event_reports' : 'closing_reports';
      const { error: updateError } = await supabase
        .from(targetTable)
        .update({ status: 'approved' })
        .eq('id', selectedReport.id);

      if (updateError)
        throw new Error(`상태 업데이트 실패: ${updateError.message}`);

      // 성공 처리 및 화면 갱신
      alert('🎉 성공적으로 게시되었습니다!');

      // React Query로 리스트 즉시 새로고침
      queryClient.invalidateQueries({ queryKey: ['event_reports'] });
      queryClient.invalidateQueries({ queryKey: ['closing_reports'] });

      closeModal();
    } catch (error: unknown) {
      console.error('승인 처리 중 에러 발생:', error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
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
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

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
          {/* ✏️ 새로운 제보 없을 때 구현해야함 */}
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
                <button
                  className="shrink-0 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                  onClick={() => handleOpenModal(report)}
                >
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

      {/* 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* 상단 헤더 (패딩 축소) */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-md ${selectedReport.type === 'event' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}
                >
                  {selectedReport.type === 'event'
                    ? '🍜 이벤트 제보'
                    : '📢 영업변동 제보'}
                </span>
                <button
                  onClick={closeModal}
                  className="text-gray-400 text-xl hover:text-black"
                >
                  ✕
                </button>
              </div>
              <h2 className="text-lg font-black text-gray-900">
                {selectedReport.shop_name}
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
                {/* 좌측: 세로형 스크린샷 */}
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

                {/* 우측: 링크 & 영업 상태 */}
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

              {/* 상세 정보 (날짜, 메뉴, 설명) */}
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

            {/* 하단 액션 버튼 (높이 및 여백 축소) */}
            <div className="p-4 border-t bg-white">
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
            </div>
          </div>
        </div>
      )}
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

const getTodayString = () => new Date().toISOString().split('T')[0];

interface BaseReport {
  id: string;
  shop_name: string;
  source_url: string;
  status: 'pending' | 'approved' | 'duplicate' | 'rejected';
  created_at: string;
}

interface EventReport extends BaseReport {
  type: 'event';
}

interface ClosingReport extends BaseReport {
  type: 'closing';
}

interface Shop {
  id: string;
  name: string;
  profile_img_url: string | null; // 이미지가 없을 수도 있으니 null 허용
}

type Report = EventReport | ClosingReport;
