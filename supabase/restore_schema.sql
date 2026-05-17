-- =============================================================================
-- ThueSach — Khôi phục schema Supabase (PostgreSQL)
-- =============================================================================
-- HƯỚNG DẪN:
--   1. Tạo project Supabase mới → SQL Editor → dán & chạy toàn bộ script này
--   2. Dashboard → Authentication: bật Email + Google OAuth
--      Redirect URLs: http://localhost:5173 (và domain production)
--   3. Dashboard → API: copy Project URL + anon/publishable key
--   4. Cập nhật .env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
--   5. Chạy app: đăng ký, xem sách, yêu thích, admin CRUD (/owner)
--
-- LƯU Ý: Script thiết kế chạy MỘT LẦN trên database trống.
--
-- Nếu lần chạy trước BỊ LỖI giữa chừng: bỏ comment block CLEANUP bên dưới,
-- chạy block đó một lần, rồi chạy lại TOÀN BỘ script từ đầu.
-- =============================================================================

-- =============================================================================
-- CLEANUP (chỉ dùng khi cần chạy lại sau lỗi — bỏ /* và */ để kích hoạt)
-- =============================================================================
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_owner() CASCADE;
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP TYPE IF EXISTS public.rental_status CASCADE;
DROP TYPE IF EXISTS public.profile_role CASCADE;
DROP TYPE IF EXISTS public.book_status CASCADE;
*/

-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2. ENUM types (khớp frontend)
-- -----------------------------------------------------------------------------
-- BookFormModal: 'Available' | 'Rented'
CREATE TYPE public.book_status AS ENUM ('Available', 'Rented');

-- LoginSignup: 'Owner' | 'Customer'  — AuthContext so sánh toUpperCase() === 'OWNER'
CREATE TYPE public.profile_role AS ENUM ('Owner', 'Customer');

-- Chuẩn bị trang /my-rentals
CREATE TYPE public.rental_status AS ENUM ('pending', 'active', 'returned', 'cancelled');

-- -----------------------------------------------------------------------------
-- 3. Helper: cập nhật updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Bảng profiles (liên kết auth.users)
-- -----------------------------------------------------------------------------
-- Cột dùng bởi: LoginSignup (insert), AuthContext (role), Profile (full_name, phone)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  role        public.profile_role NOT NULL DEFAULT 'Customer',
  balance     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_role_idx ON public.profiles (role);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Bảng books
-- -----------------------------------------------------------------------------
-- Cột dùng bởi: Home, category, BookFormModal, InventoryManager, BookDetailModal
CREATE TABLE public.books (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  status       public.book_status NOT NULL DEFAULT 'Available',
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX books_created_at_idx ON public.books (created_at DESC);
CREATE INDEX books_category_idx ON public.books (category);
CREATE INDEX books_status_idx ON public.books (status);

CREATE TRIGGER books_set_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Bảng favorites
-- -----------------------------------------------------------------------------
-- Cột dùng bởi: BookCard, Home, category, favourite (.select('book_id, books (*)'))
CREATE TABLE public.favorites (
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  book_id     UUID NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

CREATE INDEX favorites_user_id_idx ON public.favorites (user_id);
CREATE INDEX favorites_book_id_idx ON public.favorites (book_id);

-- -----------------------------------------------------------------------------
-- 7. Bảng rentals (chuẩn bị /my-rentals — chưa có API frontend)
-- -----------------------------------------------------------------------------
CREATE TABLE public.rentals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  book_id      UUID NOT NULL REFERENCES public.books (id) ON DELETE RESTRICT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  total_price  NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  status       public.rental_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rentals_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX rentals_user_status_idx ON public.rentals (user_id, status);
CREATE INDEX rentals_book_id_idx ON public.rentals (book_id);

CREATE TRIGGER rentals_set_updated_at
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. Helper: kiểm tra quản trị viên (role = Owner)
-- Phải tạo SAU bảng profiles — PostgreSQL validate tham chiếu khi CREATE FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'Owner'::public.profile_role
  );
$$;

-- -----------------------------------------------------------------------------
-- 9. Trigger: tự tạo profile khi user đăng ký (Email hoặc Google OAuth)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.profile_role;
BEGIN
  -- Logic khớp LoginSignup.jsx: admin123@gmail.com → Owner, còn lại Customer
  assigned_role := CASE
    WHEN NEW.email = 'admin123@gmail.com' THEN 'Owner'::public.profile_role
    WHEN (NEW.raw_user_meta_data->>'role') = 'Owner' THEN 'Owner'::public.profile_role
    WHEN (NEW.raw_user_meta_data->>'role') = 'Customer' THEN 'Customer'::public.profile_role
    ELSE 'Customer'::public.profile_role
  END;

  INSERT INTO public.profiles (id, email, full_name, phone, role, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    assigned_role,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Xóa trigger cũ nếu tồn tại (an toàn khi chạy lại trong dev)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 10. Row Level Security — profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 11. Row Level Security — books
-- -----------------------------------------------------------------------------
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Home & category: anon + authenticated đều đọc được catalog
CREATE POLICY "books_select_public"
  ON public.books FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "books_insert_owner"
  ON public.books FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "books_update_owner"
  ON public.books FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "books_delete_owner"
  ON public.books FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- -----------------------------------------------------------------------------
-- 12. Row Level Security — favorites
-- -----------------------------------------------------------------------------
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 13. Row Level Security — rentals
-- -----------------------------------------------------------------------------
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rentals_select_own"
  ON public.rentals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "rentals_insert_own"
  ON public.rentals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "rentals_update_own"
  ON public.rentals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "rentals_select_owner_all"
  ON public.rentals FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "rentals_update_owner_all"
  ON public.rentals FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "rentals_delete_owner_all"
  ON public.rentals FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- -----------------------------------------------------------------------------
-- 14. Grants (Supabase PostgREST)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 15. Storage — bucket book-covers (storage.js: covers/{filename})
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Đọc ảnh công khai (getPublicUrl)
CREATE POLICY "book_covers_select_public"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'book-covers');

-- Chỉ Owner upload / sửa / xóa (BookFormModal)
CREATE POLICY "book_covers_insert_owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'book-covers'
    AND public.is_owner()
  );

CREATE POLICY "book_covers_update_owner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'book-covers' AND public.is_owner())
  WITH CHECK (bucket_id = 'book-covers' AND public.is_owner());

CREATE POLICY "book_covers_delete_owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'book-covers' AND public.is_owner());

-- -----------------------------------------------------------------------------
-- 16. Realtime — Home.jsx & InventoryManager.jsx lắng nghe postgres_changes
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;

-- =============================================================================
-- Hoàn tất. Kiểm tra nhanh:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
--   SELECT * FROM storage.buckets WHERE id = 'book-covers';
-- =============================================================================
