
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://itdjkfubfzmvmuxxjoae.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debug() {
    console.log('🔍 Checking messages...');

    const targetRoomId = 'd61bd400-cf2c-4b37-97d0-fa7cfa157e01';

    const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', targetRoomId);

    console.log(`📨 Messages found: ${messages ? messages.length : 0}`);
    if (messages) messages.forEach(m => console.log(` - ${m.message}`));
}

debug();
