// Full diagnostic to file - MedCannLab 2026
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const s = createClient(
    'https://itdjkfubfzmvmuxxjoae.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg'
);

async function run() {
    const lines = [];
    const log = (...args) => { const msg = args.join(' '); lines.push(msg); };

    log('=== TIER 0 FULL DIAGNOSTIC ===');
    log('Date:', new Date().toISOString());
    log('');

    // 1. Users
    const { data: users } = await s.from('users').select('id, name, type, payment_status').order('type');
    const bt = {};
    users.forEach(u => { bt[u.type] = (bt[u.type] || 0) + 1; });
    log('1. USERS:', users.length, '- By type:', JSON.stringify(bt));

    // 2. User roles
    const { data: roles } = await s.from('user_roles').select('user_id, role');
    const rids = new Set(roles.map(r => r.user_id));
    const missing = users.filter(u => !rids.has(u.id));
    log('');
    log('2. USER_ROLES:', roles.length, 'records');
    log('   Users WITHOUT roles:', missing.length);
    missing.forEach(m => log(`   - ${m.name} (${m.type}) [${m.id.slice(0, 8)}...]`));

    // 3. Chat
    const { count: cm } = await s.from('chat_messages').select('*', { count: 'exact', head: true });
    const { count: cr } = await s.from('chat_rooms').select('*', { count: 'exact', head: true });
    log('');
    log('3. CHAT_MESSAGES:', cm, '| CHAT_ROOMS:', cr);

    // Check for legacy table
    const { error: legErr, count: legCnt } = await s.from('chat_messages_legacy').select('*', { count: 'exact', head: true });
    if (legErr) log('   chat_messages_legacy: TABLE NOT FOUND');
    else log('   chat_messages_legacy:', legCnt, 'messages');

    // 4. Professionals payment
    const pros = users.filter(u => (u.type === 'professional' || u.type === 'profissional'));
    log('');
    log('4. PROFESSIONALS:');
    pros.forEach(p => log(`   - ${p.name} | pay: ${p.payment_status} [${p.id.slice(0, 8)}]`));

    const admins = users.filter(u => u.type === 'admin');
    log('');
    log('5. ADMINS:');
    admins.forEach(a => log(`   - ${a.name} | pay: ${a.payment_status} [${a.id.slice(0, 8)}]`));

    // 6. Appointments
    const { data: appts } = await s.from('appointments').select('status');
    const as2 = {};
    appts?.forEach(a => { as2[a.status] = (as2[a.status] || 0) + 1; });
    log('');
    log('6. APPOINTMENTS:', appts?.length, '| By status:', JSON.stringify(as2));

    // 7. Ghost doctor
    const { data: assessments } = await s.from('clinical_assessments').select('doctor_id').not('doctor_id', 'is', null);
    const dids = [...new Set(assessments?.map(a => a.doctor_id))];
    log('');
    log('7. UNIQUE DOCTOR_IDS:', dids.length);
    for (const did of dids) {
        const { data: doc } = await s.from('users').select('id, name').eq('id', did).maybeSingle();
        if (!doc) log(`   GHOST: ${did}`);
        else log(`   OK: ${doc.name} [${did.slice(0, 8)}]`);
    }

    // 8. Transactions
    const { count: tc } = await s.from('transactions').select('*', { count: 'exact', head: true });
    log('');
    log('8. TRANSACTIONS:', tc);

    // 9. Reports
    const { count: rc } = await s.from('clinical_reports').select('*', { count: 'exact', head: true });
    log('');
    log('9. CLINICAL_REPORTS:', rc);

    // 10. Subscription plans
    const { data: plans } = await s.from('subscription_plans').select('id, name, monthly_price, setup_fee');
    log('');
    log('10. SUBSCRIPTION_PLANS:');
    plans?.forEach(p => log(`   - ${p.name} | R$${p.monthly_price}/mo | Setup: R$${p.setup_fee || 0} [${p.id.slice(0, 8)}]`));

    // Write to file
    const output = lines.join('\n');
    fs.writeFileSync('scripts/diagnostic_output.txt', output, 'utf8');
    console.log(output);
}

run().catch(console.error);
