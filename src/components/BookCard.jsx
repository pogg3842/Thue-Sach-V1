import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BookCard = ({ book, onOpenDetail, userId, initialIsFavorite, onFavoriteChange }) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();

    if (!userId) {
      alert("Đức ơi, đăng nhập để lưu sách yêu thích nhé!");
      return;
    }

    const previousState = isFavorite;
    const newState = !previousState;
    setIsFavorite(newState);

    // Báo cho trang cha (như Favourite) biết để xóa card ngay lập tức (Realtime UI)
    if (onFavoriteChange) onFavoriteChange(newState);

    try {
      if (newState) {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: userId, book_id: book.id }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('book_id', book.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Lỗi:", error.message);
      setIsFavorite(previousState);
      if (onFavoriteChange) onFavoriteChange(previousState);
      alert("Hệ thống bận, Đức thử lại sau nhé!");
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(book)}
      className="group bg-white rounded-[2.5rem] border border-zinc-100 p-5 transition-all hover:shadow-xl cursor-pointer hover:-translate-y-1 duration-300"
    >
      <div className="relative aspect-3/4 rounded-4xl overflow-hidden mb-4 bg-zinc-50">
        <img
          src={book.image_url || "https://via.placeholder.com/400x600?text=No+Image"}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          alt={book.title}
        />

        <button
          onClick={toggleFavorite}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-sm ${isFavorite ? "bg-red-500 text-white shadow-red-200" : "bg-white/90 text-zinc-400 hover:text-red-500"
            }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>

      <div className="space-y-2">
        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
          {book.category}
        </span>
        <h3 className="font-bold text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-zinc-400 font-medium">Tác giả: {book.author}</p>
      </div>
    </div>
  );
};

export default BookCard;