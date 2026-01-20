const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log(`Checking connection to ${supabaseUrl}...`);
    try {
        // Check 1: Scans Table
        const { error: scansError } = await supabase.from('scans').select('count', { count: 'exact', head: true });
        if (scansError) {
            console.log('⚠️  "scans" table check FAILED: ' + scansError.message);
        } else {
            console.log('✅ "scans" table exists.');
        }

        // Check 2: Drugs Table (EMDEX)
        const { error: drugsError } = await supabase.from('drugs').select('count', { count: 'exact', head: true });
        if (drugsError) {
            console.log('⚠️  "drugs" table MISSING (You need to run 20260120120000_migrate_emdex.sql)');
        } else {
            console.log('✅ "drugs" table exists.');
        }

    } catch (e) {
        console.error('❌ Unexpected error:', e.message);
    }
}

checkConnection();
