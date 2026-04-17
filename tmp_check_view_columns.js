import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkView() {
  const { data, error } = await supabase.from('service_analytics_view').select('*').limit(1);
  if (error) {
    console.error('Error fetching view:', error);
  } else {
    console.log('Columns in service_analytics_view:', Object.keys(data[0] || {}));
  }
}

checkView();
