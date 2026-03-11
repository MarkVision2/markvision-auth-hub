import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
    console.log('--- Fetching all recent daily_data AGAIN ---');
    const { data, error } = await supabase.from('daily_data').select('*').limit(10);
    console.log('Data:', JSON.stringify(data, null, 2));
}
check();
