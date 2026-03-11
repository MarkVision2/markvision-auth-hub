import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function deepAudit() {
    console.log('--- DEEP AUDIT: Projects & Clients ---');

    // 1. All Projects
    const { data: projects } = await supabase.from('projects').select('*');
    console.log('Projects:', projects);

    // 2. All Clients Configs with their project mapping
    const { data: clients } = await supabase.from('clients_config').select('id, client_name, project_id');
    console.log('Clients Mapping:', clients);

    // 3. Daily Data sample to see project_id
    const { data: daily } = await supabase.from('daily_data').select('id, date, client_config_id, project_id, spend').limit(10);
    console.log('Daily Data Sample (with project_id):', daily);
}

deepAudit();
