import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function audit() {
    console.log('--- Auditing clients_config and daily_data ---');
    const { data: clients } = await supabase.from('clients_config').select('id, client_name, project_id');
    console.log('Clients:', JSON.stringify(clients, null, 2));

    const { data: daily } = await supabase.from('daily_data').select('id, date, project_id, client_config_id').order('date', { ascending: false }).limit(10);
    console.log('Recent Daily Data Rows:', JSON.stringify(daily, null, 2));
}

audit();
