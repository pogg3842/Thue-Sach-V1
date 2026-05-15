import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // ✅ đọc ?q= từ Navbar search
import { supabase } from '../lib/supabase';
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BookCard from '../components/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import { Tag, Search } from 'lucide-react';

const Category = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const queryFromNav = searchParams.get("q") || ""; // lấy từ ?q=xxx

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      if (user) {
        const { data: favs } = await supabase.from("favorites").select("book_id").eq("user_id", user.id);
        if (favs) setFavoriteIds(favs.map(f => f.book_id));
      }
      const { data: allBooks } = await supabase.from('books').select('*');
      if (allBooks) {
        setBooks(allBooks);
        setCategories(["Tất cả", ...new Set(allBooks.map(b => b.category))]);
      }
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  // ✅ Nếu có query từ Navbar → lọc theo text, bỏ qua category filter
  // Không có query → lọc theo category như bình thường
  const filteredBooks = queryFromNav
    ? books.filter(b =>
      b.title.toLowerCase().includes(queryFromNav.toLowerCase()) ||
      b.author.toLowerCase().includes(queryFromNav.toLowerCase())
    )
    : selectedCategory === "Tất cả"
      ? books
      : books.filter(b => b.category === selectedCategory);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />
        <main className="p-6 md:p-12">

          {/* Tiêu đề — thay đổi khi đang search */}
          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 className="text-sm font-black tracking-[0.3em] flex items-center gap-2 uppercase text-zinc-800">
              {queryFromNav
                ? <><Search size={16} className="text-blue-600" /> Kết quả cho "{queryFromNav}"</>
                : <><Tag size={16} className="text-blue-600" /> Khám phá thể loại</>
              }
            </h2>
          </div>

          {/* Bộ lọc category — ẩn khi đang search */}
          {!queryFromNav && (
            <div className="flex flex-wrap gap-3 mb-10">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 ${selectedCategory === cat
                      ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200"
                      : "bg-white text-zinc-500 border border-zinc-100 hover:bg-zinc-50"
                    }`}
                >{cat}</button>
              ))}
            </div>
          )}

          {loading || authLoading ? (
            <div className="flex justify-center items-center py-40">
              <p className="italic text-zinc-400 animate-pulse text-lg">Đang tải sách...</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {filteredBooks.map(b => (
                <BookCard key={b.id} book={b} userId={user?.id}
                  initialIsFavorite={favoriteIds.includes(b.id)}
                  onOpenDetail={(book) => setSelectedBook(book)}
                  onFavoriteChange={(isFav) => {
                    setFavoriteIds(prev => isFav ? [...prev, b.id] : prev.filter(id => id !== b.id));
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-20 text-zinc-400 italic">
              {queryFromNav ? `Không tìm thấy sách nào cho "${queryFromNav}".` : "Không có sách thuộc thể loại này."}
            </p>
          )}
        </main>
      </div>
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
};

export default Category;