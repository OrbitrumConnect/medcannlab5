// Execute RLS policy creation via Management API
const fs = require('fs');

const PROJECT_REF = 'itdjkfubfzmvmuxxjoae';
const ACCESS_TOKEN = 'sbp_bf1779e61b5e314829b3505cb2f4460173636e53';

async function run() {
    const sql = fs.readFileSync('database/scripts/CREATE_MISSING_RLS_POLICIES_25-02-2026.sql', 'utf8');

    console.log('=== CREATING RLS POLICIES FOR 6 TABLES ===');

    const res = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ query: sql })
        }
    );

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text.slice(0, 500)}`);

    fs.writeFileSync('scripts/rls_policies_results.txt', `Status: ${res.status}\n${text}`, 'utf8');

    if (res.ok) {
        console.log('\n✅ ALL RLS POLICIES CREATED!');
    } else {
        console.log('\n❌ Some policies may have failed. Check results file.');
    }
}

run().catch(e => console.error('FATAL:', e.message));
