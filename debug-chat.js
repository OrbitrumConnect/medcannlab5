
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://itdjkfubfzmvmuxxjoae.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debug() {
    console.log('🔍 Debugging Supabase Data...');

    // 1. List latest messages to get a valid room_id
    const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        return;
    }

    console.log(`📨 Found ${messages.length} recent messages.`);

    if (messages.length > 0) {
        const lastMsg = messages[0];
        const roomId = lastMsg.room_id;
        console.log(`\nChecking Room ID: ${roomId}`);
        console.log(`Last Message: "${lastMsg.message}" from ${lastMsg.sender_id}`);

        // 2. Check participants for this room
        const { data: participants, error: partError } = await supabase
            .from('chat_participants')
            .select('*')
            .eq('room_id', roomId);

        if (partError) {
            console.error('❌ Error fetching participants:', partError);
        } else {
            console.log(`\n👥 Participants in room (${participants.length}):`);
            participants.forEach(p => console.log(` - User: ${p.user_id}, Role: ${p.role}`));
        }
    } else {
        console.log('⚠️ No messages found to trace room.');
    }

    // 3. Check if there are ANY rooms for the user '5b20ecec-ee1a-4a45-ba76-a8fa04dfe9f8' (from user logs)
    const userId = '5b20ecec-ee1a-4a45-ba76-a8fa04dfe9f8';
    console.log(`\n🔎 Checking participants for User ${userId}...`);
    const { data: userRooms, error: userRoomError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('user_id', userId);

    if (userRoomError) console.error('❌ Error fetching user rooms:', userRoomError);
    else console.log(`User is in ${userRooms.length} rooms.`);
}

debug();
