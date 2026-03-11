import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkProjectsAndClients() {
    console.log('--- AUDIT: Projects ---');
    const { data: projects } = await supabase.from('projects').select('id, name');
    console.log(projects);

    console.log('\n--- AUDIT: Clients Config ---');
    const { data: clients } = await supabase.from('clients_config').select('id, client_name, project_id');
    console.log(clients);

    console.log('\n--- AUDIT: Daily Data Unique Combinations ---');
    const { data: daily } = await supabase.from('daily_data').select('client_config_id, project_id');
    const unique = Array.from(new Set((daily || []).map(d => `${d.client_config_id} -> ${d.project_id}`)));
    console.log(unique);
}

checkProjectsAndClients();
