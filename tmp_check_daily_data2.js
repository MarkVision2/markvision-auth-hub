import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdAccount() {
    const { data, error } = await supabase.from('daily_data').select('ad_account_id').limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
}
checkAdAccount();
