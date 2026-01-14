import { useQuery } from '@tanstack/react-query';
import { getShops } from './api/shops';
import { Star, MapPin } from 'lucide-react';

function App() {
  const {
    data: shops,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
  });

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold">라멘집 찾는 중... 🍜</div>
    );
  if (isError)
    return (
      <div className="p-10 text-center text-red-500">
        데이터를 못 가져왔어요. 😭
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* GNB는 유지 */}
      <nav className="border-b border-gray-100 h-16 flex items-center px-6">
        <h1 className="text-xl font-black text-brand">RAMEN TODAY</h1>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-8">오늘의 추천 맛집</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shops?.map((shop) => (
            <div key={shop.id} className="group cursor-pointer">
              {/* 가게 썸네일 */}
              <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
                <img
                  src={shop.image_url}
                  alt={shop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {/* 영업 시간 기반 배지 (심화 로직은 나중에!) */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-md">
                  OPEN
                </div>
              </div>

              {/* 가게 정보 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <span className="font-bold text-slate-800">
                    {shop.category}
                  </span>
                  <span>•</span>
                  <span>{shop.address.split(' ')[1]}</span>{' '}
                  {/* '마포구 합정동'에서 '합정동'만 추출 */}
                </div>
                <h3 className="text-lg font-bold truncate">{shop.name}</h3>

                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm">
                    {shop.score.toFixed(1)}
                  </span>
                </div>

                {/* 태그 영역 */}
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-500 font-medium">
                    염도 보통
                  </span>
                  <span className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-500 font-medium">
                    재방문 높음
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
