// Diagnostic script for Tier 0 fixes - MedCannLab 2026
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://itdjkfubfzmvmuxxjoae.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg'
);

async function diagnose() {
    console.log('=== TIER 0 DIAGNOSTIC ===\n');

    // 1. Users by type
    const { data: users } = await supabase.from('users').select('id, name, type, payment_status').order('type');
    const byType = {};
    users?.forEach(u => { byType[u.type] = (byType[u.type] || 0) + 1; });
    console.log('1. USERS BY TYPE:', JSON.stringify(byType));
    console.log(`   Total: ${users?.length}`);

    // 2. User roles
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    console.log(`\n2. USER_ROLES: ${roles?.length} records`);
    const roleUserIds = new Set(roles?.map(r => r.user_id));
    const usersWithoutRoles = users?.filter(u => !roleUserIds.has(u.id));
    console.log(`   Users WITHOUT roles: ${usersWithoutRoles?.length}`);
    usersWithoutRoles?.forEach(u => console.log(`   - ${u.name} (${u.type}) [${u.id.substring(0, 8)}]`));

    // 3. Chat messages
    const { count: chatMsgCount } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true });
    console.log(`\n3. CHAT_MESSAGES: ${chatMsgCount} messages`);

    // 4. Chat rooms
    const { count: chatRoomCount } = await supabase.from('chat_rooms').select('*', { count: 'exact', head: true });
    console.log(`   CHAT_ROOMS: ${chatRoomCount} rooms`);

    // 5. Professionals with payment_status = pending
    const pendingPros = users?.filter(u => u.type === 'professional' && u.payment_status === 'pending');
    console.log(`\n4. PROFESSIONALS WITH PENDING PAYMENT: ${pendingPros?.length}`);
    pendingPros?.forEach(p => console.log(`   - ${p.name} [${p.id.substring(0, 8)}]`));

    // 6. Admins with payment_status = pending  
    const pendingAdmins = users?.filter(u => u.type === 'admin' && u.payment_status === 'pending');
    console.log(`\n5. ADMINS WITH PENDING PAYMENT: ${pendingAdmins?.length}`);

    // 7. Appointments by status
    const { data: appts } = await supabase.from('appointments').select('status');
    const apptByStatus = {};
    appts?.forEach(a => { apptByStatus[a.status] = (apptByStatus[a.status] || 0) + 1; });
    console.log(`\n6. APPOINTMENTS BY STATUS:`, JSON.stringify(apptByStatus));

    // 8. Ghost doctor_id check
    const { data: assessments } = await supabase.from('clinical_assessments').select('doctor_id').not('doctor_id', 'is', null);
    const doctorIds = [...new Set(assessments?.map(a => a.doctor_id))];
    console.log(`\n7. UNIQUE DOCTOR_IDS IN ASSESSMENTS: ${doctorIds.length}`);
    for (const did of doctorIds) {
        const { data: doc } = await supabase.from('users').select('id, name').eq('id', did).maybeSingle();
        if (!doc) {
            console.log(`   🔴 GHOST DOCTOR_ID: ${did} (not in users table)`);
        }
    }

    // 9. Transactions
    const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
    console.log(`\n8. TRANSACTIONS: ${txCount}`);

    // 10. Clinical reports
    const { count: reportCount } = await supabase.from('clinical_reports').select('*', { count: 'exact', head: true });
    console.log(`\n9. CLINICAL_REPORTS: ${reportCount}`);

    // 11. Check RLS policies on chat_messages via a test
    console.log('\n10. CHAT_MESSAGES TABLE COLUMNS:');
    const { data: chatSample, error: chatErr } = await supabase.from('chat_messages').select('*').limit(1);
    if (chatErr) {
        console.log(`   ERROR: ${chatErr.message}`);
    } else {
        console.log(`   Sample: ${chatSample?.length} rows returned`);
        if (chatSample?.length > 0) {
            console.log(`   Columns: ${Object.keys(chatSample[0]).join(', ')}`);
        }
    }

    // Also check for legacy table
    const { count: legacyCount, error: legacyErr } = await supabase.from('chat_messages_legacy').select('*', { count: 'exact', head: true });
    if (legacyErr) {
        console.log(`\n   chat_messages_legacy: TABLE DOES NOT EXIST`);
    } else {
        console.log(`\n   chat_messages_legacy: ${legacyCount} messages`);
    }

    console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

diagnose().catch(console.error);
