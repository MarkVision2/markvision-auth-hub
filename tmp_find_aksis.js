import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iywmjdrghcbsicdwohmb.supabase.co";
const supabaseKey = "sb_publishable_1bGwBrKHmZrA17Pnout61A_GG2Ogbqf";

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAksis() {
    console.log('Searching for Аксис (Aksis) in clients_config...');
    const { data: clients, error } = await supabase
        .from('clients_config')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        const aksis = clients.filter(c => c.client_name && (c.client_name.includes('Аксис') || c.client_name.includes('Aksis')));
        if (aksis.length > 0) {
            console.log('Found Aksis:', JSON.stringify(aksis, null, 2));
        } else {
            console.log('Aksis not found in existing 2 rows.');
            console.log('Full list of client names:', clients.map(c => c.client_name).join(', '));
        }
    }
}

findAksis();
