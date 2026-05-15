import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext"; // ✅ dùng context chung
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, ArrowLeft, Mail, Lock, User, Phone } from "lucide-react";

const SPRING = { type: "spring", stiffness: 300, damping: 30 };

// Input có icon trái
function Field({ name, type, placeholder, Icon, onChange }) {
    return (
        <div className="relative group">
            <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 pointer-events-none" />
            <input
                name={name} type={type} required onChange={onChange} placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
        </div>
    );
}

// Wrapper slide in/out theo chiều cao — tránh overlap
function Slide({ children }) {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
        >
            <div className="pb-3">{children}</div>
        </motion.div>
    );
}

export default function LoginSignup() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth(); // ✅ lấy từ context, không cần fetch thêm

    // Nếu đã đăng nhập thì redirect luôn
    if (user) {
        navigate("/", { replace: true });
        return null;
    }

    const [isLogin, setIsLogin] = useState(state?.mode !== "signup");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "", phone: "" });

    const onChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setError("");
    };

    const switchMode = (login) => { setIsLogin(login); setError(""); };

    const handleAuth = async (e) => {
        e.preventDefault();
        if (!isLogin && form.password !== form.confirmPassword)
            return setError("Mật khẩu xác nhận không khớp!");

        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
                if (error) throw error;
                navigate("/");
            } else {
                const role = form.email === "admin123@gmail.com" ? "Owner" : "Customer";
                const { data: { user }, error } = await supabase.auth.signUp({
                    email: form.email, password: form.password,
                    options: { data: { full_name: form.fullName, phone: form.phone, role } },
                });
                if (error) throw error;
                if (user) {
                    await supabase.from("profiles").insert([{
                        id: user.id, email: form.email, full_name: form.fullName, phone: form.phone, role, balance: 0,
                    }]);
                }
                alert("Tạo tài khoản thành công!");
                switchMode(true);
            }
        } catch (err) {
            setError(err.message.includes("credentials") ? "Email hoặc mật khẩu không chính xác." : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            {/* layout trên card để tự resize mượt khi field xuất hiện/ẩn */}
            <motion.div layout transition={SPRING}
                className="w-full max-w-sm bg-white rounded-[2.5rem] border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden p-6 md:p-8"
            >
                {/* Tab switcher */}
                <div className="relative flex bg-zinc-100 p-1 rounded-2xl mb-8">
                    <motion.div layoutId="tab" className="absolute inset-y-1 bg-white rounded-xl shadow-sm w-[calc(50%-4px)]"
                        animate={{ x: isLogin ? 0 : "100%" }} transition={SPRING}
                    />
                    <button onClick={() => switchMode(true)} className={`relative z-10 flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isLogin ? "text-blue-600" : "text-zinc-500"}`}>Đăng Nhập</button>
                    <button onClick={() => switchMode(false)} className={`relative z-10 flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider ${!isLogin ? "text-blue-600" : "text-zinc-500"}`}>Đăng Ký</button>
                </div>

                <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-5">
                    {isLogin ? "Đăng Nhập" : "Tạo Tài Khoản"}
                </h2>

                <form onSubmit={handleAuth} className="flex flex-col gap-3">
                    {/* Chỉ hiện khi Đăng Ký */}
                    <AnimatePresence initial={false}>
                        {!isLogin && <>
                            <Slide key="fullName"><Field name="fullName" type="text" placeholder="Họ và Tên" Icon={User} onChange={onChange} /></Slide>
                            <Slide key="phone">   <Field name="phone" type="tel" placeholder="Số điện thoại" Icon={Phone} onChange={onChange} /></Slide>
                        </>}
                    </AnimatePresence>

                    {/* Luôn hiện */}
                    <Field name="email" type="email" placeholder="Email" Icon={Mail} onChange={onChange} />
                    <Field name="password" type="password" placeholder="Mật khẩu" Icon={Lock} onChange={onChange} />

                    {/* Chỉ hiện khi Đăng Ký */}
                    <AnimatePresence initial={false}>
                        {!isLogin && (
                            <Slide key="confirmPassword">
                                <Field name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" Icon={Lock} onChange={onChange} />
                            </Slide>
                        )}
                    </AnimatePresence>

                    {/* Lỗi */}
                    <AnimatePresence>
                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-xs text-red-500 text-center"
                            >{error}</motion.p>
                        )}
                    </AnimatePresence>

                    <button type="submit"
                        className="w-full mt-1 bg-blue-600 text-white py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    >
                        {loading
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <>{isLogin ? <LogIn size={15} /> : <UserPlus size={15} />} {isLogin ? "Truy cập" : "Đăng ký"}</>
                        }
                    </button>
                </form>

                {/* Google + Back */}
                <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col gap-3">
                    <button
                        onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })}
                        className="w-full flex items-center justify-center gap-2 border border-zinc-200 py-3 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Tiếp tục với Google
                    </button>
                    <button onClick={() => navigate("/")}
                        className="flex items-center justify-center gap-1.5 text-zinc-400 text-[10px] uppercase tracking-widest hover:text-zinc-700 transition-colors font-black group"
                    >
                        <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                        Quay về trang chủ
                    </button>
                </div>
            </motion.div>
        </div>
    );
}