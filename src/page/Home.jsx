import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Flame } from "lucide-react";
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

  useEffect(() => {
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
          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 className="text-sm font-black tracking-[0.3em] flex items-center gap-2 uppercase text-zinc-800">
              Mới nhất <Flame size={16} className="text-orange-500" fill="currentColor" />
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