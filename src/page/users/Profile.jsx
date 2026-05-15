import React, { useState, useEffect } from 'react';
import { User, Phone, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    // Lấy dữ liệu hiện tại từ Database
    useEffect(() => {
        const getProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, phone')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFormData({
                        full_name: data.full_name || '',
                        phone: data.phone || ''
                    });
                }
            } catch (error) {
                console.error("Lỗi lấy profile:", error);
            }
        };
        getProfile();
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. Cập nhật bảng profiles
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Cập nhật metadata của Auth (để Navbar hiển thị tên mới ngay lập tức)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: formData.full_name }
            });

            if (authError) throw authError;

            setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 p-6 flex justify-center items-start pt-20">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-800 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Quay lại
                </button>

                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Hồ sơ cá nhân</h1>
                <p className="text-zinc-500 text-sm mb-8">Cập nhật thông tin hiển thị của bạn</p>

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-2">Họ và tên</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-blue-100 focus:bg-white transition-all text-sm"
                                placeholder="Nhập tên của bạn"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-2">Số điện thoại</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-blue-100 focus:bg-white transition-all text-sm"
                                placeholder="Nhập số điện thoại"
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
                        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                    >
                        {loading ? "Đang lưu..." : <><Save size={18} /> Lưu thay đổi</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;