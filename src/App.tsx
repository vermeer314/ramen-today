function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-black tracking-tighter text-brand mb-4">
        RAMEN TODAY
      </h1>
      <p className="text-gray-400 text-lg">
        무신사 스타일의 시크한 라멘 커뮤니티 시작!
      </p>
      <button className="mt-8 px-6 py-3 bg-brand text-white font-bold rounded-full hover:scale-105 transition">
        오늘의 라멘 제보하기
      </button>
    </div>
  );
}

export default App;
