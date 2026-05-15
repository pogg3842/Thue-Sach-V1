import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadBookCover } from "../../lib/storage";
import { X, BookOpen, User, Tag, FileText, DollarSign, Image } from "lucide-react";

function Field({ label, Icon, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">{label}</label>
            <div className="relative group">
                {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 pointer-events-none z-10" />}
                {children}
            </div>
        </div>
    );
}

const iCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all";

const BookFormModal = ({ onClose, editData }) => {
    const isEdit = !!editData;

    // ✅ Đầy đủ tất cả fields của bảng books
    const [form, setForm] = useState({
        title: editData?.title || "",
        author: editData?.author || "",
        category: editData?.category || "",
        description: editData?.description || "",
        price: editData?.price || "",
        status: editData?.status || "Available",
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // Xử lý ảnh: upload mới hoặc giữ URL cũ
            let image_url = editData?.image_url || null;
            if (imageFile) {
                image_url = await uploadBookCover(imageFile);
                if (!image_url) throw new Error("Upload ảnh thất bại, thử lại nhé.");
            }

            const payload = {
                title: form.title, author: form.author,
                category: form.category, description: form.description,
                price: Number(form.price), status: form.status,
                image_url,
            };

            // ✅ Insert hoặc Update tùy mode
            const { error } = isEdit
                ? await supabase.from("books").update(payload).eq("id", editData.id)
                : await supabase.from("books").insert([payload]);

            if (error) throw error;
            onClose(); // Realtime tự cập nhật bảng
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-zinc-100 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white"><BookOpen size={16} /></div>
                        <h2 className="font-black text-zinc-900 uppercase tracking-tight">
                            {isEdit ? "Chỉnh sửa sách" : "Thêm sách mới"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                        <X size={18} className="text-zinc-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                    <Field label="Tên sách" Icon={BookOpen}>
                        <input name="title" value={form.title} onChange={onChange} required placeholder="Nhập tên sách..." className={iCls} />
                    </Field>

                    <Field label="Tác giả" Icon={User}>
                        <input name="author" value={form.author} onChange={onChange} required placeholder="Tên tác giả..." className={iCls} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Thể loại" Icon={Tag}>
                            <input name="category" value={form.category} onChange={onChange} required placeholder="Tiểu thuyết..." className={iCls} />
                        </Field>
                        <Field label="Giá thuê (đ)" Icon={DollarSign}>
                            <input name="price" type="number" min="0" value={form.price} onChange={onChange} required placeholder="10000" className={iCls} />
                        </Field>
                    </div>

                    <Field label="Mô tả" Icon={FileText}>
                        <textarea
                            name="description" value={form.description} onChange={onChange}
                            rows={3} placeholder="Giới thiệu nội dung sách..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                        />
                    </Field>

                    {/* Trạng thái — toggle button */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Trạng thái</label>
                        <div className="flex gap-3">
                            {[
                                { value: "Available", label: "✅ Có sẵn" },
                                { value: "Rented", label: "📖 Đang thuê" },
                            ].map(({ value, label }) => (
                                <button key={value} type="button"
                                    onClick={() => setForm((f) => ({ ...f, status: value }))}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${form.status === value
                                            ? value === "Available"
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : "bg-orange-100 text-orange-600 border-orange-200"
                                            : "bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100"
                                        }`}
                                >{label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Upload ảnh */}
                    <Field label="Ảnh bìa" Icon={Image}>
                        <input type="file" accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer transition-all"
                        />
                    </Field>

                    {/* Preview ảnh cũ khi edit, chưa chọn ảnh mới */}
                    {isEdit && editData.image_url && !imageFile && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <img src={editData.image_url} alt="Ảnh hiện tại" className="h-16 w-12 rounded-lg object-cover" />
                            <p className="text-xs text-zinc-400">Ảnh hiện tại. Chọn file mới để thay.</p>
                        </div>
                    )}

                    {error && <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-4 rounded-xl">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50 transition-colors"
                        >Hủy</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white font-bold text-sm transition-all active:scale-[0.98]"
                        >{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm sách"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookFormModal;