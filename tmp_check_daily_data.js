import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: cols, error } = await supabase.rpc('get_table_columns_by_name', { table_name: 'daily_data' });
    if (error) {
        // Fallback: just fetch 1 row
        const { data } = await supabase.from('daily_data').select('*').limit(1);
        console.log("fallback columns", data ? Object.keys(data[0]) : []);
    } else {
        console.log("rpc columns", cols);
    }
}
checkSchema();
