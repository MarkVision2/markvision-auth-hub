import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iywmjdrghcbsicdwohmb.supabase.co";
const supabaseKey = "sb_publishable_1bGwBrKHmZrA17Pnout61A_GG2Ogbqf";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
    console.log('Checking projects table...');
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

    if (projectsError) {
        console.error('Error fetching projects:', projectsError);
    } else {
        console.log(`Found ${projects.length} projects:`);
        console.log(JSON.stringify(projects, null, 2));
    }

    console.log('\nChecking project_members table...');
    const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('*');

    if (membersError) {
        console.error('Error fetching project_members:', membersError);
    } else {
        console.log(`Found ${members.length} project members:`);
        console.log(JSON.stringify(members, null, 2));
    }
}

checkProjects();
