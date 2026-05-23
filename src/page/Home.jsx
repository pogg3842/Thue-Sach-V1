import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Flame, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BookCard from "../components/BookCard";
import BookDetailModal from "../components/BookDetailModal";

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [readingProgress, setReadingProgress] = useState({});
  const [showBanner, setShowBanner] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Đọc lịch sử
    const progress = JSON.parse(localStorage.getItem('reading_progress')) || {};
    setReadingProgress(progress);
    
    // Nếu Auth đang kiểm tra session thì chưa tải dữ liệu sách
    if (authLoading) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Lấy danh sách sách
        const { data: allBooks } = await supabase
          .from("books")
          .select("*")
          .order('created_at', { ascending: false });

        if (isMounted && allBooks) setBooks(allBooks);

        // 2. Lấy danh sách yêu thích nếu đã có user
        if (user && isMounted) {
          const { data: favs } = await supabase
            .from("favorites")
            .select("book_id")
            .eq("user_id", user.id);
          if (favs) setFavoriteIds(favs.map(f => f.book_id));
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    // Realtime cập nhật sách
    const myChannel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, (payload) => {
        if (payload.eventType === 'INSERT') setBooks(list => [payload.new, ...list]);
        if (payload.eventType === 'UPDATE') setBooks(list => list.map(b => b.id === payload.new.id ? payload.new : b));
        if (payload.eventType === 'DELETE') setBooks(list => list.filter(b => b.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(myChannel);
    };
  }, [user, authLoading]); // Quan trọng: Chạy lại khi authLoading xong hoặc user đổi

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />

        <main className="p-6 md:p-12 bg-transparent flex-1">
          {showBanner && (
            <div className="mb-8 bg-blue-600 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Flame size={120} />
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">THÔNG BÁO MỚI</span>
                <h2 className="text-3xl font-black mt-4 mb-2">docsachVIP nay đã MIỄN PHÍ 100%! 🎉</h2>
                <p className="text-blue-100 mb-6 font-medium">
                  Từ hôm nay, toàn bộ hệ thống Thuê/Mua đã được gỡ bỏ. Trải nghiệm đọc truyện hoàn toàn miễn phí, tốc độ siêu tốc và nói không với quảng cáo.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setShowBanner(false)} className="bg-white text-blue-600 font-bold px-6 py-2.5 rounded-xl hover:scale-105 transition-transform">
                    Tuyệt vời!
                  </button>
                </div>
              </div>
            </div>
          )}

          {Object.keys(readingProgress).length > 0 && books.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 border-b border-zinc-200 pb-4">
                <h2 className="text-sm font-black tracking-[0.3em] flex items-center gap-2 uppercase text-zinc-800">
                  Tiếp tục đọc <Clock size={16} className="text-blue-500" />
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {books.filter(b => readingProgress[b.id]).slice(0, 4).map(b => (
                  <div key={`progress-${b.id}`} className="relative group">
                    <BookCard
                      book={b}
                      userId={user?.id}
                      initialIsFavorite={favoriteIds.includes(b.id)}
                      onOpenDetail={(book) => setSelectedBook(book)}
                      onFavoriteChange={(isFav) => {
                        if (isFav) setFavoriteIds(prev => [...prev, b.id]);
                        else setFavoriteIds(prev => prev.filter(id => id !== b.id));
                      }}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/read/${b.id}`); }}
                      className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 text-white font-bold py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                    >
                      Đọc tiếp
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 className="text-sm font-black tracking-[0.3em] flex items-center gap-2 uppercase text-zinc-800">
              Mới cập nhật <Flame size={16} className="text-orange-500" fill="currentColor" />
            </h2>
          </div>

          {loading || authLoading ? (
            <div className="flex justify-center items-center py-40">
              <p className="italic text-zinc-400 animate-pulse text-lg">Đang chuẩn bị thư viện...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {books.map(b => (
                <BookCard
                  key={b.id}
                  book={b}
                  userId={user?.id}
                  initialIsFavorite={favoriteIds.includes(b.id)}
                  onOpenDetail={(book) => setSelectedBook(book)}
                  onFavoriteChange={(isFav) => {
                    if (isFav) setFavoriteIds(prev => [...prev, b.id]);
                    else setFavoriteIds(prev => prev.filter(id => id !== b.id));
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

export default Home;