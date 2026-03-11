import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkClients() {
    console.log('--- Checking for misconfigured clients ---');
    const { data, error } = await supabase
        .from('clients_config')
        .select('id, client_name, project_id, is_active')
        .is('project_id', null);

    if (error) console.error(error);
    else console.log('Clients with project_id = NULL:', data?.length);

    const { data: all } = await supabase.from('clients_config').select('project_id');
    const ids = all?.map(a => a.project_id);
    console.log('Unique project_ids in clients_config:', [...new Set(ids)]);
}

checkClients();
