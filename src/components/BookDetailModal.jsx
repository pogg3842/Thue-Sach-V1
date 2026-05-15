import React from 'react';
import { X, BookOpen, Clock, ShieldCheck } from 'lucide-react';

const BookDetailModal = ({ book, onClose }) => {
    if (!book) return null;

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in duration-300">

                {/* Bên trái: Ảnh bìa */}
                <div className="md:w-1/2 bg-zinc-50 p-10 flex items-center justify-center border-r border-zinc-100">
                    <img
                        src={book.image_url}
                        className="w-full max-h-112.5 object-contain rounded-2xl shadow-2xl rotate-2"
                        alt={book.title}
                    />
                </div>

                {/* Bên phải: Thông tin */}
                <div className="md:w-1/2 p-10 overflow-y-auto relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>

                    <div className="space-y-6">
                        <div>
                            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full">
                                {book.category}
                            </span>
                            <h2 className="text-3xl font-black text-zinc-900 mt-4 leading-tight">{book.title}</h2>
                            <p className="text-zinc-500 font-medium mt-1">Tác giả: {book.author}</p>
                        </div>

                        <div className="flex gap-4 py-4 border-y border-zinc-100">
                            <div className="flex items-center gap-2 text-zinc-600 text-xs font-bold">
                                <Clock size={16} className="text-blue-500" /> 7 ngày thuê
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600 text-xs font-bold">
                                <ShieldCheck size={16} className="text-green-500" /> Bảo quản tốt
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={14} /> Giới thiệu nội dung
                            </h4>
                            <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                                {/* Đây là cột description bạn vừa thêm */}
                                {book.description || "Cuốn sách này hiện chưa có nội dung mô tả chi tiết từ quản trị viên."}
                            </p>
                        </div>

                        <div className="pt-6 mt-auto flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-zinc-400 font-black uppercase">Giá trọn gói</p>
                                <p className="text-3xl font-black text-blue-600">{book.price?.toLocaleString()}đ</p>
                            </div>
                            <button className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-zinc-200">
                                Thuê ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetailModal;