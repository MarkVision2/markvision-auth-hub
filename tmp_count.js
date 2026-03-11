import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
    const { count, error } = await supabase.from('daily_data').select('*', { count: 'exact', head: true });
    console.log('daily_data row count:', count);
    console.log('error:', error?.message);
}
check();
