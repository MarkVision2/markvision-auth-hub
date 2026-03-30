import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * A non-persisting Supabase client used for administrative tasks 
 * like creating new users without signing out the current admin.
 */
export const createAdminClient = () => {
  return createClient<Database>(
    SUPABASE_URL as string, 
    SUPABASE_PUBLISHABLE_KEY as string, 
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
};
