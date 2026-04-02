import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iywmjdrghcbsicdwohmb.supabase.co";
const supabaseKey = "sb_publishable_1bGwBrKHmZrA17Pnout61A_GG2Ogbqf";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log('Searching for Аксис (Aksis) in profiles and other tables...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        const found = profiles?.filter(p => JSON.stringify(p).includes('Аксис') || JSON.stringify(p).includes('Aksis'));
        console.log('Found in profiles:', found?.length);
    }

    const { data: leads } = await supabase.from('leads').select('client_name').limit(100);
    const leadsNames = [...new Set(leads?.map(l => l.client_name))];
    console.log('Unique client names in leads:', leadsNames);
}

checkProfiles();
