import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BookCard from '../components/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import { Heart } from 'lucide-react';

const Favourite = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [favBooks, setFavBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchFavorites = async () => {
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('book_id, books (*)')
          .eq('user_id', user.id);
        if (data) setFavBooks(data.map(item => item.books));
      } else {
        setFavBooks([]);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user, authLoading]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />
        <main className="p-6 md:p-12">
          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 className="text-sm font-black tracking-[0.3em] flex items-center gap-2 uppercase text-zinc-800">
              Danh sách yêu thích <Heart size={16} className="text-red-500" fill="currentColor" />
            </h2>
          </div>

          {loading || authLoading ? (
            <div className="flex justify-center items-center py-40">
              <p className="italic text-zinc-400 animate-pulse text-lg">Đang tải...</p>
            </div>
          ) : favBooks.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {favBooks.map(b => (
                <BookCard
                  key={b.id}
                  book={b}
                  userId={user?.id}
                  initialIsFavorite={true}
                  onOpenDetail={(book) => setSelectedBook(book)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-zinc-100">
              <Heart size={32} className="text-zinc-200 mx-auto mb-3" fill="currentColor" />
              <p className="text-zinc-400 font-medium italic">Chưa có sách yêu thích nào. Hãy thêm ngay!</p>
            </div>
          )}
        </main>
      </div>
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
};

export default Favourite;