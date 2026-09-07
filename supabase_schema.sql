-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profiles mapped to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING ( auth.role() = 'authenticated' );
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile, Admins can update any." ON profiles FOR UPDATE USING ( auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- Workers table
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    address TEXT,
    salary NUMERIC,
    contact_info TEXT,
    worker_type TEXT NOT NULL, -- Maid, Cook, Nanny, etc.
    other_details TEXT,
    status TEXT DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on workers
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers are viewable by everyone logged in." ON workers FOR SELECT USING ( auth.role() = 'authenticated' );
CREATE POLICY "Workers insertable by admins only." ON workers FOR INSERT WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Workers updatable by admins only." ON workers FOR UPDATE USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- Packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packages are viewable by everyone logged in." ON packages FOR SELECT USING ( auth.role() = 'authenticated' );
CREATE POLICY "Packages insertable by admins only." ON packages FOR INSERT WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Packages updatable by admins only." ON packages FOR UPDATE USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_contact TEXT,
    customer_address TEXT,
    booking_date DATE NOT NULL,
    service_datetime TIMESTAMP WITH TIME ZONE,
    service_booked TEXT NOT NULL,
    package_id UUID REFERENCES public.packages(id),
    package_amount NUMERIC,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    worker_id UUID REFERENCES public.workers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookings are viewable by everyone" ON bookings FOR SELECT USING ( auth.role() = 'authenticated' );
CREATE POLICY "Bookings insertable by everyone" ON bookings FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );
CREATE POLICY "Bookings updatable by everyone" ON bookings FOR UPDATE USING ( auth.role() = 'authenticated' );


-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'User'), coalesce(new.raw_user_meta_data->>'role', 'employee'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Dummy data for packages
INSERT INTO public.packages (name, amount, description) VALUES
('Silver', 0, 'Silver tier service package'),
('Gold', 0, 'Gold tier service package'),
('Diamond', 0, 'Premium diamond service package') ON CONFLICT DO NOTHING;