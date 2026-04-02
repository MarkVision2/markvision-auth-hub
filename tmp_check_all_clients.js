import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iywmjdrghcbsicdwohmb.supabase.co";
const supabaseKey = "sb_publishable_1bGwBrKHmZrA17Pnout61A_GG2Ogbqf";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllClients() {
    console.log('Checking ALL clients_config rows...');
    const { data: clients, error } = await supabase
        .from('clients_config')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${clients.length} clients:`);
        clients.forEach(c => {
            console.log(`- ${c.client_name} (ID: ${c.id}, project_id: ${c.project_id}, is_active: ${c.is_active})`);
        });
    }
}

checkAllClients();
