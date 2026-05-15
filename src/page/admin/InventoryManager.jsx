import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import BookFormModal from './BookFormModal';

const InventoryManager = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null); // null = thêm mới, object = sửa
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Lần đầu load
        const fetchBooks = async () => {
            const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
            if (!error && data) setBooks(data);
            setLoading(false);
        };
        fetchBooks();

        // Realtime: cập nhật ngay khi DB thay đổi (không cần fetchBooks() lại)
        const channel = supabase
            .channel('inventory-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, ({ eventType, new: n, old: o }) => {
                if (eventType === 'INSERT') setBooks(prev => [n, ...prev]);
                if (eventType === 'UPDATE') setBooks(prev => prev.map(b => b.id === n.id ? n : b));
                if (eventType === 'DELETE') setBooks(prev => prev.filter(b => b.id !== o.id));
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const openAdd = () => { setSelectedBook(null); setIsModalOpen(true); };
    const openEdit = (book) => { setSelectedBook(book); setIsModalOpen(true); };

    // ✅ Đóng modal và reset selectedBook để lần sau mở "Thêm mới" không bị điền sẵn
    const closeModal = () => { setIsModalOpen(false); setSelectedBook(null); };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận xóa sách này khỏi kho?")) return;
        const { error } = await supabase.from('books').delete().eq('id', id);
        if (error) alert("Lỗi khi xóa: " + error.message);
    };

    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F8F9FA]">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 md:ml-64 flex flex-col">
                <Navbar setIsSidebarOpen={setIsSidebarOpen} />

                <main className="p-6 md:p-10 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-xl text-white"><Package size={20} /></div>
                                QUẢN LÝ KHO SÁCH
                            </h1>
                            <p className="text-zinc-500 text-xs mt-1 ml-11 font-medium uppercase tracking-widest">
                                {books.length} đầu sách · Realtime
                            </p>
                        </div>
                        <button onClick={openAdd}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all active:scale-95"
                        >
                            <Plus size={18} /> THÊM SÁCH MỚI
                        </button>
                    </div>

                    {/* Tìm kiếm */}
                    <div className="bg-white p-2 rounded-2xl border border-zinc-100 mb-6 flex items-center gap-3 shadow-sm focus-within:ring-2 ring-blue-100 transition-all">
                        <div className="pl-4 text-zinc-400"><Search size={18} /></div>
                        <input
                            type="text"
                            placeholder="Tìm tên sách hoặc tác giả..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none py-3 text-sm w-full font-medium"
                        />
                    </div>

                    {/* Bảng danh sách */}
                    <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-zinc-300" size={32} />
                            </div>
                        ) : filteredBooks.length === 0 ? (
                            <div className="py-20 text-center text-zinc-400 italic">
                                {searchTerm ? "Không tìm thấy sách phù hợp." : "Kho sách đang trống."}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50/50 border-b border-zinc-100">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sách & Tác giả</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Thể loại</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Trạng thái</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {filteredBooks.map((book) => (
                                        <tr key={book.id} className="hover:bg-zinc-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-16 rounded-lg bg-zinc-100 overflow-hidden shadow-sm shrink-0">
                                                        <img src={book.image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-800 group-hover:text-blue-600 transition-colors line-clamp-1">{book.title}</p>
                                                        <p className="text-[11px] text-zinc-400 font-medium">{book.author}</p>
                                                        <p className="text-[11px] font-bold text-blue-600">{book.price?.toLocaleString()}đ</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                                                    {book.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${book.status === 'Available' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${book.status === 'Available' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                    {book.status === 'Available' ? 'CÓ SẴN' : 'ĐANG THUÊ'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(book)}
                                                        className="p-2.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    ><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(book.id)}
                                                        className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    ><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal chỉ mount khi mở — đảm bảo form luôn fresh */}
            {isModalOpen && <BookFormModal onClose={closeModal} editData={selectedBook} />}
        </div>
    );
};

export default InventoryManager;