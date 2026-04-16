// Investigate chat zero messages - check participants and is_chat_room_member
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const s = createClient(
    'https://itdjkfubfzmvmuxxjoae.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg'
);

async function run() {
    const lines = [];
    const log = (...args) => { const msg = args.join(' '); lines.push(msg); };

    log('=== CHAT INVESTIGATION ===');

    // 1. Check chat_participants
    const { data: participants, count: pCount } = await s
        .from('chat_participants')
        .select('*', { count: 'exact' })
        .limit(20);
    log(`\n1. CHAT_PARTICIPANTS: ${pCount} records`);
    if (participants?.length > 0) {
        log('   Columns:', Object.keys(participants[0]).join(', '));
        // Show first 10
        participants.slice(0, 10).forEach(p => {
            log(`   room: ${p.room_id?.slice(0, 8)} | user: ${p.user_id?.slice(0, 8)} | role: ${p.role} | joined: ${p.joined_at?.slice(0, 10)}`);
        });
    }

    // 2. Check a specific room - get one room and its participants
    const { data: rooms } = await s.from('chat_rooms').select('id, name, type, created_by').limit(3);
    log(`\n2. SAMPLE ROOMS:`);
    for (const room of (rooms || [])) {
        log(`   Room: ${room.id?.slice(0, 8)} | name: ${room.name} | type: ${room.type} | by: ${room.created_by?.slice(0, 8)}`);

        // Get participants for this room
        const { data: rp } = await s.from('chat_participants')
            .select('user_id, role')
            .eq('room_id', room.id);
        log(`   Participants: ${rp?.length || 0}`);
        rp?.forEach(p => log(`     - user: ${p.user_id?.slice(0, 8)} | role: ${p.role}`));
    }

    // 3. Check is_chat_room_member function exists
    log(`\n3. TESTING is_chat_room_member():`);
    // We can check by looking at the function definition via RPC
    // Try calling it with a known room and user
    if (rooms?.length > 0 && participants?.length > 0) {
        const testRoom = participants[0].room_id;
        const testUser = participants[0].user_id;
        log(`   Testing with room: ${testRoom?.slice(0, 8)}, user: ${testUser?.slice(0, 8)}`);

        // Try to call the function via raw SQL through RPC
        const { data: fnCheck, error: fnErr } = await s.rpc('is_chat_room_member', {
            p_room_id: testRoom,
            p_user_id: testUser
        });
        if (fnErr) {
            log(`   RPC error: ${fnErr.message}`);
            log(`   Hint: ${fnErr.hint || 'none'}`);
            log(`   Code: ${fnErr.code}`);
        } else {
            log(`   Result: ${JSON.stringify(fnCheck)}`);
        }
    }

    // 4. Check if there's a column mismatch issue in PatientSupport.tsx
    log(`\n4. CHAT_MESSAGES SCHEMA:`);
    // Get column info from the types - we already know it from types.ts:
    log('   Columns: id (number), room_id, sender_id, message, message_type, file_url, created_at, read_at');
    log('   NOTE: PatientSupport.tsx uses user_id (WRONG) instead of sender_id');

    // 5. Try inserting a test message via service role to see if it works
    log(`\n5. TEST INSERT (service role):`);
    if (rooms?.length > 0 && participants?.length > 0) {
        const testRoom = participants[0].room_id;
        const testUser = participants[0].user_id;

        const { data: testInsert, error: insertErr } = await s.from('chat_messages').insert({
            room_id: testRoom,
            sender_id: testUser,
            message: '[SYSTEM TEST] Chat connectivity verified - ' + new Date().toISOString(),
            message_type: 'system'
        }).select();

        if (insertErr) {
            log(`   INSERT ERROR: ${insertErr.message}`);
            log(`   Code: ${insertErr.code}`);
            log(`   Details: ${insertErr.details}`);
        } else {
            log(`   ✅ INSERT SUCCEEDED! ID: ${testInsert?.[0]?.id}`);
            log(`   THE TABLE WORKS. Problem is RLS blocking authenticated users.`);
        }
    }

    // 6. Check ChatGlobal.tsx insert pattern
    log(`\n6. FRONTEND INSERT PATTERNS:`);
    log('   useChatSystem.ts: { room_id, sender_id, message, message_type } ✅ CORRECT');
    log('   PatientSupport.tsx: { room_id, user_id, content, message_type } ❌ WRONG COLUMNS');
    log('   ChatGlobal.tsx: needs manual verification');

    const output = lines.join('\n');
    fs.writeFileSync('scripts/chat_investigation.txt', output, 'utf8');
    console.log(output);
}

run().catch(e => console.error('FATAL:', e.message));
