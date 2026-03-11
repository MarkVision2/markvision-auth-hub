import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkUserRoles() {
    console.log('--- Checking user_roles and other possible tables ---');
    const { data, error } = await supabase.from('user_roles').select('*').limit(5);
    console.log('user_roles:', data, error?.message);

    const { data: pList } = await supabase.from('projects').select('id, name').limit(5);
    console.log('Sample Projects:', pList);

    const { data: cList } = await supabase.from('clients_config').select('id, client_name, project_id').limit(5);
    console.log('Sample Clients:', cList);
}

checkUserRoles();
