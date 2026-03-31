-- Add missing columns to help store team member metadata in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS office text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_days text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_hours text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.specialty IS 'Doctor specialization (Surgeon, Therapist, etc.)';
COMMENT ON COLUMN public.profiles.office IS 'Assigned cabinet or office number';
COMMENT ON COLUMN public.profiles.working_days IS 'Array of short day names (Пн, Вт, etc.)';
COMMENT ON COLUMN public.profiles.working_hours IS 'Time range string (e.g. 09:00 - 18:00)';
