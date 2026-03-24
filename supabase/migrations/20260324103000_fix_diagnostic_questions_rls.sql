-- Fix RLS policies for diagnostic_questions to allow all authenticated users to manage questions
-- The previous policies required a user_roles table entry which may not exist

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admins to insert questions" ON public.diagnostic_questions;
DROP POLICY IF EXISTS "Allow admins to update questions" ON public.diagnostic_questions;
DROP POLICY IF EXISTS "Allow admins to delete questions" ON public.diagnostic_questions;

-- Create permissive policies for all authenticated users
CREATE POLICY "Allow authenticated users to insert questions"
ON public.diagnostic_questions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update questions"
ON public.diagnostic_questions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete questions"
ON public.diagnostic_questions
FOR DELETE
TO authenticated
USING (true);
