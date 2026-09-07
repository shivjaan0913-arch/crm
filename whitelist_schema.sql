-- 1. Create Whitelist table
CREATE TABLE IF NOT EXISTS public.whitelist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS for Whitelist
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Whitelist viewable by everyone" ON whitelist FOR SELECT USING ( auth.role() = 'authenticated' );
CREATE POLICY "Whitelist insertable by admins" ON whitelist FOR INSERT WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Whitelist deletable by admins" ON whitelist FOR DELETE USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 3. Check Whitelist RPC (for frontend to verify securely before signup)
CREATE OR REPLACE FUNCTION public.check_whitelist(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.whitelist WHERE email = check_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DB Trigger to strictly enforce whitelist on signup at the database level
CREATE OR REPLACE FUNCTION public.enforce_whitelist()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.whitelist WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'Your email is not on the approved whitelist. Please contact the administrator.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists so this is safe to run multiple times
DROP TRIGGER IF EXISTS before_auth_user_created ON auth.users;

-- Attach trigger to auth.users
CREATE TRIGGER before_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_whitelist();
