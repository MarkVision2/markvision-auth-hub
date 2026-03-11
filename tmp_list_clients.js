import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function listClients() {
    console.log('--- Listing all clients ---');
    const { data, error } = await supabase
        .from('clients_config')
        .select('id, client_name, project_id')
        .eq('is_active', true);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Clients:', JSON.stringify(data, null, 2));
    }
}

listClients();
