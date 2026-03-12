import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKitarov() {
    console.log("=== Projects ===");
    const { data: p } = await supabase.from('projects').select('id, name');
    console.log(p);

    console.log("\n=== Clients Config ===");
    const { data: c } = await supabase.from('clients_config').select('id, client_name, project_id');
    console.log(c);

    console.log("\n=== Shared Visibility ===");
    const { data: v } = await supabase.from('client_config_visibility').select('*');
    console.log(v);

}

checkKitarov();
