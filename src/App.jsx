import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Import bộ não trung tâm
import Home from "./page/Home";
import Category from "./page/category";
import Favourite from "./page/favourite";
import LoginSignup from "./LoginSignup";
import Profile from './page/users/Profile';
import ChangePassword from './page/users/ChangePassword';
import InventoryManager from './page/admin/InventoryManager'; // THÊM trang quản lý kho

// ─── BỘ LỌC BẢO VỆ ĐƯỜNG DẪN ───

// 1. Chỉ dành cho người đã đăng nhập (User chung)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Đang load thì chờ tí
  return user ? children : <Navigate to="/auth" />; // Chưa đăng nhập thì đá sang trang Login
};

// 2. Chỉ dành cho Quản trị viên (Owner)
const OwnerRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  // Nếu có user VÀ role là OWNER thì mới cho vào, không thì đá về Home
  return user && role?.toUpperCase() === "OWNER" ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      {/* Đường dẫn công khai */}
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<LoginSignup />} />
      <Route path="/category" element={<Category />} />

      {/* Đường dẫn cần đăng nhập mới vào được */}
      <Route path="/favourite" element={<ProtectedRoute><Favourite /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      {/* ĐƯỜNG DẪN RIÊNG CHO QUẢN TRỊ VIÊN */}
      <Route path="/owner" element={<OwnerRoute><InventoryManager /></OwnerRoute>} />
    </Routes>
  );
}

export default App;