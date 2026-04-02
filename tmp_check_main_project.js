import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iywmjdrghcbsicdwohmb.supabase.co";
const supabaseKey = "sb_publishable_1bGwBrKHmZrA17Pnout61A_GG2Ogbqf";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject() {
    const targetId = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";
    console.log(`Checking project with ID ${targetId}...`);
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', targetId)
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Project found:', JSON.stringify(project, null, 2));
    }
}

checkProject();
