import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function findClient() {
    console.log('--- Searching for client "Китаров" ---');
    const { data, error } = await supabase
        .from('clients_config')
        .select('id, client_name, project_id, ad_account_id')
        .ilike('client_name', '%Китаров%');

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Result:', JSON.stringify(data, null, 2));
    }
}

findClient();
