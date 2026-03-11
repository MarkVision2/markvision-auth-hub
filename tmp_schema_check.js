import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkSchema() {
    console.log('--- Fetching daily_data ---');
    const { data: dd, error: errDd } = await supabase.from('daily_data').select('*').limit(1);
    console.log('daily_data error:', errDd?.message);
    console.log('daily_data sample:', dd);

    console.log('--- Fetching daily_metrics ---');
    const { data: dm, error: errDm } = await supabase.from('daily_metrics').select('*').limit(1);
    console.log('daily_metrics error:', errDm?.message);
    console.log('daily_metrics sample:', dm);
}

checkSchema();
