-- 🧠 Optimized SQL Schema for SiPetto (Supabase / Prisma)

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Roles
INSERT INTO public.roles (name) VALUES ('Admin'), ('UMKM'), ('Owner') ON CONFLICT (name) DO NOTHING;

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Role Permissions (Mapping)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Profiles Table (Linked to auth.users)
-- We store email and full_name as cache for visibility in Prisma without schema joins
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Removed physical REFERENCES to avoid Prisma multi-schema issues
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL, 
    password VARCHAR(255), -- Back for manual auth
    full_name VARCHAR(255), 
    business_name VARCHAR(255), -- Fill in Step 2 (UMKM Setup)
    phone_number VARCHAR(20), 
    address TEXT, 
    avatar_url TEXT, 
    bio TEXT, 
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Trigger Supabase: Auto-create Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nama'), -- Flexible key support
    (SELECT id FROM public.roles WHERE name = 'UMKM' LIMIT 1) -- Assign 'UMKM' as default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Automatic Updated At trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime 


-- 6. Categories Table (Master Data Kategorisasi)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('pengeluaran', 'pemasukan')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, name, type)
);

-- 7. Payment Methods (Master Data Metode Pembayaran)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 'Tunai', 'Transfer', 'Digital'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, name)
);

-- 8. Transaction Groups (HEADER / SESI PENCATATAN)
-- Bertindak sebagai koleksi transaksi dalam satu inputan (Grouping)
CREATE TABLE IF NOT EXISTS public.transaction_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_number VARCHAR(100) UNIQUE, -- Nomor Nota / Referensi TRX-XXXX
    transaction_date DATE DEFAULT CURRENT_DATE,
    total_income NUMERIC(15, 2) DEFAULT 0,
    total_expense NUMERIC(15, 2) DEFAULT 0,
    net_balance NUMERIC(15, 2) DEFAULT 0, -- Income - Expense
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transaction Items (DETAIL / MULTI INPUT HYBRID)
-- Mendukung baris berbeda tipe (Pendapatan & Pengeluaran) dalam satu nota
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.transaction_groups(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    type VARCHAR(20) CHECK (type IN ('INCOME', 'EXPENSE')) NOT NULL,
    name VARCHAR(255), -- Keterangan Item
    amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Transaction Attachments
CREATE TABLE IF NOT EXISTS public.transaction_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.transaction_groups(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Trigger: Advance Total Group Calculator
CREATE OR REPLACE FUNCTION update_group_financials()
RETURNS TRIGGER AS $$
DECLARE
    target_group_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_group_id := OLD.group_id;
    ELSE
        target_group_id := NEW.group_id;
    END IF;

    UPDATE public.transaction_groups
    SET 
        total_income = (SELECT COALESCE(SUM(amount), 0) FROM public.transaction_items WHERE group_id = target_group_id AND type = 'INCOME'),
        total_expense = (SELECT COALESCE(SUM(amount), 0) FROM public.transaction_items WHERE group_id = target_group_id AND type = 'EXPENSE'),
        net_balance = (
            (SELECT COALESCE(SUM(amount), 0) FROM public.transaction_items WHERE group_id = target_group_id AND type = 'INCOME') - 
            (SELECT COALESCE(SUM(amount), 0) FROM public.transaction_items WHERE group_id = target_group_id AND type = 'EXPENSE')
        )
    WHERE id = target_group_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_financials ON public.transaction_items;
CREATE TRIGGER trg_update_financials
AFTER INSERT OR UPDATE OR DELETE ON public.transaction_items
FOR EACH ROW EXECUTE FUNCTION update_group_financials();

-- 🔒 RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage Categories" ON public.categories FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Manage Payment Methods" ON public.payment_methods FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Manage Groups" ON public.transaction_groups FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Manage Items via Group" ON public.transaction_items 
FOR ALL USING (EXISTS (SELECT 1 FROM public.transaction_groups g WHERE g.id = group_id AND g.profile_id = auth.uid()));

-- 6b. Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, name)
);

-- RLS untuk Product Categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product categories are viewable by everyone" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Manage own product categories" ON public.product_categories FOR ALL USING (auth.uid() = profile_id);

-- 12. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    price_selling NUMERIC(15, 2) NOT NULL DEFAULT 0,
    price_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_products_modtime ON public.products;
CREATE TRIGGER update_products_modtime 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS untuk Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Manage own products" ON public.products FOR ALL USING (auth.uid() = profile_id);

-- 📊 LANGKAH INTEGRASI FINAL (PENTING):
/*
1. Jalankan SQL ini di Supabase SQL Editor.
2. 'npx prisma db pull' untuk sinkronisasi schema.prisma.
3. API POS tinggal mengirim 1 Object Header & List Items ke satu endpoint saja.
*/


-- 📊 URUT PENGERJAAN FINAL:
/*
1. DATABASE: Run SQL ini di Supabase editor (Fresh Restart jika perlu karena ada penghapusan tabel lama).
2. PRISMA: Jalankan 'npx prisma db pull' & 'npx prisma generate'.
3. API KASIR (Multi-input):
   - Buat satu endpoint POST /api/transactions yang menerima payload 'Header' dan array 'Items'.
   - Gunakan Prisma Transaction ($transaction) untuk insert Group dan Items dalam satu proses aman.
4. UI POS / KASIR:
   - Form dinamis (Repeater) untuk input banyak item sekaligus.
5. REPORTING:
   - Dashboard sekarang membaca data langsung dari 'transaction_groups' untuk performa maksimal.
*/
