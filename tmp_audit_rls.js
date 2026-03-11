import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkRLS() {
    console.log('--- Checking RLS Policies ---');
    // We can't query pg_policies directly via anon key easily unless there's an RPC
    // But we can try to see if we can see data from OTHER projects

    const { data: projects, error: pErr } = await supabase.from('projects').select('id, name');
    console.log('Detected projects:', projects?.map(p => p.name));

    const { data: allData, error: dErr } = await supabase.from('daily_data').select('project_id');
    console.log('Unique project_ids in daily_data (visible to current key):', [...new Set(allData?.map(d => d.project_id))]);
}

checkRLS();
