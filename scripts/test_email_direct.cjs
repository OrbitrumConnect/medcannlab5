// Test send-email Edge Function with full error details
const fs = require('fs');

async function test() {
    const url = 'https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/send-email';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            to: 'rrvalenca@gmail.com',
            template: 'welcome',
            data: { name: 'Dr. Ricardo', appUrl: 'https://medcannlab.com.br' }
        })
    });

    const text = await res.text();
    const result = `Status: ${res.status}\nHeaders: ${JSON.stringify(Object.fromEntries(res.headers))}\nBody: ${text}`;
    console.log(result);
    fs.writeFileSync('scripts/email_test_result.txt', result, 'utf8');
}

test().catch(e => console.error('FATAL:', e.message));
