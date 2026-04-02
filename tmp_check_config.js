import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iywmjdrghcbsicdwohmb.supabase.co";
const supabaseKey = "sb_publishable_1bGwBrKHmZrA17Pnout61A_GG2Ogbqf";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking clients_config...');
    const { data: clients, error: clientsError } = await supabase
        .from('clients_config')
        .select('*');

    if (clientsError) {
        console.error('Error fetching clients_config:', clientsError);
    } else {
        console.log(`Found ${clients.length} clients in clients_config:`);
        console.log(JSON.stringify(clients, null, 2));
    }
}

checkSchema();
