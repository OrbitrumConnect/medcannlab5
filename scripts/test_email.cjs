// Test send-email Edge Function
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
    'https://itdjkfubfzmvmuxxjoae.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg'
);

async function test() {
    console.log('=== TEST: send-email Edge Function ===');

    // Test 1: Send with template
    console.log('\n1. Testing welcome template...');
    const { data: data1, error: err1 } = await s.functions.invoke('send-email', {
        body: {
            to: 'rrvalenca@gmail.com',
            template: 'welcome',
            data: {
                name: 'Dr. Ricardo',
                appUrl: 'https://medcannlab.com.br'
            }
        }
    });

    if (err1) {
        console.log('ERROR:', err1.message);
        // Try to get more details
        console.log('Details:', JSON.stringify(err1));
    } else {
        console.log('SUCCESS:', JSON.stringify(data1));
    }

    console.log('\n=== TEST COMPLETE ===');
}

test().catch(e => console.error('FATAL:', e.message));
