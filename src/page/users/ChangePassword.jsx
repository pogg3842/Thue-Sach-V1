import React, { useState } from 'react';
import { Key, ShieldCheck, ArrowLeft, Lock } from 'lucide-react'; // Thêm icon Lock
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext'; // Cần lấy email user hiện tại

const ChangePassword = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Lấy thông tin user đang đăng nhập
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' }); // Thêm field 'old'
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        // 1. Kiểm tra khớp mật khẩu mới
        if (passwords.new !== passwords.confirm) {
            return setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
        }
        if (passwords.new.length < 6) {
            return setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // 2. XÁC THỰC MẬT KHẨU CŨ
            // Thử đăng nhập lại bằng email hiện tại và mật khẩu cũ người dùng vừa nhập
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwords.old,
            });

            if (signInError) {
                throw new Error("Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại.");
            }

            // 3. NẾU ĐÚNG MẬT KHẨU CŨ -> TIẾN HÀNH ĐỔI MẬT KHẨU MỚI
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (updateError) throw updateError;

            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setPasswords({ old: '', new: '', confirm: '' }); // Reset form
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 p-6 flex justify-center items-start pt-20">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-800 transition-colors mb-6 text-sm font-medium">
                    <ArrowLeft size={16} /> Quay lại
                </button>

                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Đổi mật khẩu</h1>
                <p className="text-zinc-500 text-sm mb-8">Bảo mật tài khoản của bạn</p>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                    {/* Ô NHẬP MẬT KHẨU CŨ */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-2">Mật khẩu hiện tại</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="password"
                                value={passwords.old}
                                onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-blue-100 focus:bg-white transition-all text-sm"
                                placeholder="Nhập mật khẩu cũ"
                                required
                            />
                        </div>
                    </div>

                    <div className="h-px bg-zinc-100 my-2" /> {/* Đường kẻ ngăn cách */}

                    {/* Ô NHẬP MẬT KHẨU MỚI */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-2">Mật khẩu mới</label>
                        <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-blue-100 focus:bg-white transition-all text-sm"
                                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-2">Xác nhận mật khẩu mới</label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-blue-100 focus:bg-white transition-all text-sm"
                                placeholder="Nhập lại mật khẩu mới"
                                required
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-2xl text-xs font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-zinc-900 hover:bg-black disabled:bg-zinc-300 text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200 transition-all active:scale-[0.98]"
                    >
                        {loading ? "Đang kiểm tra..." : "XÁC NHẬN ĐỔI MẬT KHẨU"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;