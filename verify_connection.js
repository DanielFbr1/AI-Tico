
import { createClient } from '@supabase/supabase-js';
// dotenv removed, using --env-file

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key defined:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('proyectos').select('*').limit(1);
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Connected to Supabase.');
            console.log('Data sample:', data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

test();
