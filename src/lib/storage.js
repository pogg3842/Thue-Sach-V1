import { supabase } from "./supabase";

export const uploadBookCover = async (file) => {
    try {
        // Tạo tên file duy nhất bằng timestamp để tránh trùng lặp
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        // 1. Upload file lên bucket 'book-covers'
        const { error: uploadError } = await supabase.storage
            .from('book-covers')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Lấy URL công khai của ảnh
        const { data } = supabase.storage
            .from('book-covers')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Lỗi upload ảnh:', error.message);
        return null;
    }
};