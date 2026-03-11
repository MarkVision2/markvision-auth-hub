import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkMembers() {
    console.log('--- Checking project_members and profiles ---');
    const { data: members, error: mErr } = await supabase.from('project_members').select('*').limit(5);
    console.log('Members:', members, mErr?.message);

    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, role').limit(5);
    console.log('Profiles:', profiles, pErr?.message);
}

checkMembers();
