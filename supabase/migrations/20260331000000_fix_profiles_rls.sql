-- 1. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Policy: Allow users to read their own profile (Fixes "Error fetching user role")
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 4. Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- 5. Policy: Allow Superadmins to see all profiles (Critical for Team Management)
-- To avoid recursion, we check the role directly. 
-- Note: In a production environment with many users, consider a more optimized check.
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
);

-- 6. Add a similar policy for project_members and projects if not already there, 
-- but ensuring we don't break the user's "NUCLEAR OPTION" (where RLS is disabled).
-- If RLS is DISABLED on those, we don't need policies there.
