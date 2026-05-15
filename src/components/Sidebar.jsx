import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  BookOpen,
  Heart,
  X,
  Settings,
  Archive,
  BookMarked,
} from "lucide-react";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  // LẤY TẤT CẢ TỪ CONTEXT: user, role, loading
  const { user, role, loading } = useAuth();

  const publicMenu = [
    { to: "/", label: "Trang chủ", icon: <Home size={18} /> },
    { to: "/category", label: "Thể loại", icon: <BookOpen size={18} /> },
    { to: "/favourite", label: "Yêu thích", icon: <Heart size={18} /> },
    { to: "/my-rentals", label: "Đang thuê", icon: <Archive size={18} /> },
  ];

  const adminMenu = [
    { to: "/owner", label: "Quản lý Kho", icon: <BookMarked size={18} /> },
    { to: "/settings", label: "Cấu hình hệ thống", icon: <Settings size={18} /> }
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 w-64 bg-white p-6 z-50 transition-transform duration-300 border-r border-zinc-100
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 `}
      >
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-16 h-12 object-contain hover:rotate-6 transition-transform" />
            <div className="leading-none">
              <h1 className="text-lg font-bold text-blue-700 tracking-tighter">THUESACH</h1>
              <p className="text-[9px] font-bold text-zinc-600 tracking-[0.2em]">THƯ VIỆN CỦA BẠN</p>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-zinc-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-100px)] justify-between">
          <nav className="space-y-1">
            {publicMenu.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={location.pathname === item.to}
                setIsOpen={setIsOpen}
              />
            ))}

            {/* DÙNG BIẾN LOADING TỪ CONTEXT */}
            {loading ? (
              <div className="pt-6 mt-6 border-t border-blue-700/10 animate-pulse">
                <div className="h-3 bg-zinc-200 rounded w-24 mx-4 mb-5"></div>
                <div className="h-10 bg-zinc-50 rounded-xl mb-1"></div>
              </div>
            ) : (
              // DÙNG ROLE TỪ CONTEXT
              role?.toUpperCase() === "OWNER" && (
                <div className="pt-6 mt-6 border-t border-blue-700/10 animate-in fade-in duration-300">
                  <p className="text-[10px] font-black px-4 mb-4 text-blue-700 uppercase tracking-[0.2em]">
                    Quản trị viên
                  </p>
                  {adminMenu.map((item) => (
                    <NavItem
                      key={item.to}
                      {...item}
                      active={location.pathname === item.to}
                      setIsOpen={setIsOpen}
                    />
                  ))}
                </div>
              )
            )}
          </nav>

          <div className="mx-2 pt-4 border-t border-zinc-100">
            <div className="px-4 space-y-1 text-center">
              <p className="text-[10px] text-zinc-600 uppercase font-bold mb-2">Liên hệ hỗ trợ</p>
              <p className="text-[10px] text-zinc-400 truncate">xuanduc241@gmail.com</p>
              <p className="text-[10px] text-zinc-400">0963 436 779</p>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-40 md:hidden" />
      )}
    </>
  );
};

const NavItem = ({ to, icon, label, active, setIsOpen }) => (
  <Link
    to={to}
    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold"
        : "text-zinc-600 hover:bg-zinc-50 hover:translate-x-1"
      }`}
  >
    <span className={`${active ? "" : "group-hover:scale-110 text-blue-600"} transition-transform`}>
      {icon}
    </span>
    <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
  </Link>
);

export default Sidebar;