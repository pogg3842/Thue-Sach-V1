import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// 1. Tạo Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hàm lấy role từ bảng profiles
        const getRole = async (userId) => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                // Cập nhật role, nếu không có thì mặc định là USER
                setRole(data?.role || 'USER');
            } catch (error) {
                console.error("Lỗi lấy role:", error);
                setRole('USER');
            } finally {
                setLoading(false);
            }
        };

        // Kiểm tra session khi load trang lần đầu
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                getRole(currentUser.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        // Lắng nghe sự kiện đăng nhập/đăng xuất/đổi mật khẩu
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                getRole(currentUser.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// 2. CHỖ QUAN TRỌNG NHẤT: Export hàm useAuth để các file khác gọi được
export const useAuth = () => {
    return useContext(AuthContext);
};