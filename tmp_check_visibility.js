import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkTables() {
    console.log('--- Checking all public tables ---');
    // Hacky way to see what we can see
    const { data, error } = await supabase.rpc('get_tables_info'); // If it exists
    if (error) {
        const { data: d2, error: e2 } = await supabase.from('projects').select('id, name').limit(5);
        console.log('Projects test:', d2, e2?.message);
    } else {
        console.log('Tables:', data);
    }
}

checkTables();
