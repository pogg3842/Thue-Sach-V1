import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, Menu, User, Key, LayoutDashboard, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ setIsSidebarOpen }) => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);       // dropdown user
    const [search, setSearch] = useState("");           // ✅ state tìm kiếm
    const menuRef = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsOpen(false);
        navigate('/');
    };

    // ✅ Nhấn Enter → chuyển sang trang Category với query search
    const handleSearch = (e) => {
        if (e.key === "Enter" && search.trim()) {
            navigate(`/category?q=${encodeURIComponent(search.trim())}`);
            setSearch("");
        }
    };

    return (
        <nav className="sticky top-0 z-40 w-full flex items-center justify-between px-6 py-3 bg-white/90 backdrop-blur-md border-b border-zinc-100">

            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-3 md:hidden">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500 hover:bg-zinc-50 rounded-lg">
                    <Menu size={20} />
                </button>
                <Link to="/" className="text-sm font-bold tracking-tighter text-blue-700 uppercase">THUESACH</Link>
            </div>

            {/* Desktop: search bar */}
            <div className="hidden md:flex items-center bg-zinc-100 px-4 py-2 rounded-xl w-80 group focus-within:ring-2 ring-blue-100 transition-all">
                <Search size={14} className="text-zinc-400 shrink-0" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Tìm sách — nhấn Enter để tìm..."
                    className="bg-transparent border-none outline-none text-xs ml-2 w-full text-zinc-700 placeholder:text-zinc-400"
                />
                {/* Xoá nhanh */}
                {search && (
                    <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-600 ml-1">
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Right: auth area */}
            <div className="flex items-center gap-4">
                {loading ? (
                    <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                ) : !user ? (
                    <button
                        onClick={() => navigate('/auth')}
                        className="text-[10px] font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
                    >
                        Đăng nhập
                    </button>
                ) : (
                    <div className="relative flex items-center gap-3" ref={menuRef}>
                        {/* Tên + role */}
                        <div className="hidden sm:block text-right">
                            <p className="text-[11px] font-bold text-zinc-800 leading-none">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                            </p>
                            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">
                                {role?.toUpperCase() === "OWNER" ? "Quản trị viên" : "Thành viên"}
                            </span>
                        </div>

                        {/* Avatar button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg font-bold text-sm"
                        >
                            {user?.email?.[0].toUpperCase()}
                        </button>

                        {/* Dropdown menu */}
                        {isOpen && (
                            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-2 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-4 py-2 mb-1 border-b border-zinc-50 text-[11px] font-medium text-zinc-500 truncate">
                                    {user.email}
                                </div>
                                <div className="flex flex-col px-2 space-y-0.5">
                                    {role?.toUpperCase() === "OWNER" && (
                                        <Link to="/owner" onClick={() => setIsOpen(false)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-semibold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                                        >
                                            <LayoutDashboard size={14} /> Admin Dashboard
                                        </Link>
                                    )}
                                    <Link to="/profile" onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                                    >
                                        <User size={14} /> Hồ sơ cá nhân
                                    </Link>
                                    <Link to="/change-password" onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                                    >
                                        <Key size={14} /> Đổi mật khẩu
                                    </Link>
                                    <div className="h-px bg-zinc-100 my-1" />
                                    <button onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut size={14} /> ĐĂNG XUẤT
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;