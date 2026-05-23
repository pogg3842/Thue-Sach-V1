import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DonateQR from '../components/DonateQR';

const mockContent = `Đây là nội dung văn bản thử nghiệm cho trình đọc truyện chữ.

Trong một ngôi làng nhỏ ven rừng, có một cậu bé tên là Minh. Cậu rất thích đọc sách và tìm hiểu về thế giới xung quanh. Mỗi ngày sau khi làm xong việc nhà, Minh lại chạy ra gốc cây đa đầu làng, lấy từ trong túi vải ra một cuốn sách cũ kỹ mà cậu mượn được từ người thủ thư già.

Thời gian trôi qua, Minh càng đọc càng say mê. Những trang sách mở ra cho cậu những cuộc phiêu lưu kỳ thú, những miền đất xa xôi mà cậu chưa từng đặt chân đến.

"Tri thức là sức mạnh," Minh thường lẩm nhẩm câu nói đó. Cậu mơ ước một ngày nào đó sẽ viết nên câu chuyện của riêng mình, để truyền cảm hứng cho những đứa trẻ khác cũng yêu thích việc đọc sách.

Mặt trời dần lặn, ánh hoàng hôn phủ một màu vàng ấm áp lên những trang giấy. Minh gấp sách lại, hít một hơi thật sâu không khí trong lành của buổi chiều tà, rồi mỉm cười bước về nhà. Cậu biết rằng ngày mai, một trang mới của cuốn sách lại mở ra chờ đón cậu.`;

// Lặp lại để có độ dài đủ để cuộn
const longContent = Array(20).fill(mockContent).join('\n\n---\n\n');

const Reader = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Typography states
    const [theme, setTheme] = useState('dark'); // 'light', 'dark', 'sepia'
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState('sans-serif'); // 'sans-serif', 'serif'
    
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    
    let lastScrollY = window.scrollY;

    useEffect(() => {
        // Tải cài đặt đã lưu
        const savedSettings = JSON.parse(localStorage.getItem('reader_settings')) || {};
        if (savedSettings.theme) setTheme(savedSettings.theme);
        if (savedSettings.fontSize) setFontSize(savedSettings.fontSize);
        if (savedSettings.fontFamily) setFontFamily(savedSettings.fontFamily);

        const fetchBook = async () => {
            const { data } = await supabase.from('books').select('*').eq('id', bookId).single();
            setBook(data);
            setLoading(false);
            
            // Khôi phục vị trí đọc
            setTimeout(() => {
                const progress = JSON.parse(localStorage.getItem('reading_progress')) || {};
                if (progress[bookId]) {
                    window.scrollTo(0, progress[bookId]);
                }
            }, 100);
        };
        fetchBook();
    }, [bookId]);

    // Lưu cài đặt khi có thay đổi
    useEffect(() => {
        localStorage.setItem('reader_settings', JSON.stringify({ theme, fontSize, fontFamily }));
    }, [theme, fontSize, fontFamily]);

    // Xử lý sự kiện cuộn (scroll)
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Lưu tiến độ đọc
            const progress = JSON.parse(localStorage.getItem('reading_progress')) || {};
            progress[bookId] = currentScrollY;
            localStorage.setItem('reading_progress', JSON.stringify(progress));

            // Tự động ẩn thanh công cụ
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowControls(false);
                setShowSettings(false);
            } else if (currentScrollY < lastScrollY) {
                setShowControls(true);
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [bookId]);

    const getThemeStyles = () => {
        switch(theme) {
            case 'dark': return 'bg-[#121212] text-zinc-300';
            case 'sepia': return 'bg-[#F4ECD8] text-[#5B4636]';
            case 'light': default: return 'bg-white text-zinc-900';
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#121212] text-zinc-400">Đang mở sách...</div>;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${getThemeStyles()}`}>
            {/* Thanh điều hướng Header */}
            <div className={`fixed top-0 left-0 right-0 p-4 transition-transform duration-300 z-50 flex justify-between items-center ${theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'sepia' ? 'bg-[#e8dcb8]' : 'bg-zinc-100'} shadow-md ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="font-bold truncate px-4 text-center max-w-[60%]">
                    {book?.title || 'Đang đọc'}
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-black/10'}`}>
                    <Type size={24} />
                </button>
                
                {/* Bảng Cài đặt Typography */}
                {showSettings && (
                    <div className={`absolute top-full right-4 mt-2 p-5 rounded-2xl shadow-2xl w-72 animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900'}`}>
                        <div className="mb-5">
                            <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-60">Màu nền</p>
                            <div className="flex gap-2">
                                <button onClick={() => setTheme('light')} className={`flex-1 py-2 font-bold text-sm bg-white text-black border ${theme === 'light' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-zinc-200'} rounded-xl shadow-sm`}>Sáng</button>
                                <button onClick={() => setTheme('sepia')} className={`flex-1 py-2 font-bold text-sm bg-[#F4ECD8] text-[#5B4636] border ${theme === 'sepia' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-[#d4c39f]'} rounded-xl shadow-sm`}>Giấy</button>
                                <button onClick={() => setTheme('dark')} className={`flex-1 py-2 font-bold text-sm bg-zinc-900 text-white border ${theme === 'dark' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-zinc-700'} rounded-xl shadow-sm`}>Tối</button>
                            </div>
                        </div>
                        <div className="mb-5">
                            <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-60 flex justify-between">
                                <span>Cỡ chữ</span> <span>{fontSize}px</span>
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="flex-1 py-2 font-bold text-lg bg-black/5 hover:bg-black/10 rounded-xl transition-colors">-</button>
                                <button onClick={() => setFontSize(f => Math.min(32, f + 2))} className="flex-1 py-2 font-bold text-lg bg-black/5 hover:bg-black/10 rounded-xl transition-colors">+</button>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-60">Kiểu chữ</p>
                            <div className="flex gap-2">
                                <button onClick={() => setFontFamily('sans-serif')} className={`flex-1 py-2 font-bold text-sm bg-black/5 rounded-xl font-sans ${fontFamily === 'sans-serif' ? 'bg-blue-500 text-white' : ''}`}>Sans-serif</button>
                                <button onClick={() => setFontFamily('serif')} className={`flex-1 py-2 font-bold text-sm bg-black/5 rounded-xl font-serif ${fontFamily === 'serif' ? 'bg-blue-500 text-white' : ''}`}>Serif</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Vùng nội dung chữ */}
            <div 
                className="max-w-2xl mx-auto px-6 pt-28 pb-32 cursor-pointer"
                style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily, lineHeight: 1.8 }}
                onClick={() => setShowControls(!showControls)}
            >
                <h1 className="text-3xl font-black mb-12 text-center leading-tight">{book?.title}</h1>
                <div className="whitespace-pre-line text-justify">
                    {book?.content || longContent}
                </div>
            </div>

            {/* Gọi DonateQR Component */}
            <DonateQR theme={theme} />
        </div>
    );
};

export default Reader;
