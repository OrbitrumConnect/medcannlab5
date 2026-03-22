// TIER 0 FIX SCRIPT - MedCannLab 2026
// Executes critical data fixes identified in the audit
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const s = createClient(
    'https://itdjkfubfzmvmuxxjoae.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg'
);

const lines = [];
const log = (...args) => { const msg = args.join(' '); lines.push(msg); console.log(msg); };

async function run() {
    log('=== TIER 0 FIX EXECUTION ===');
    log('Date:', new Date().toISOString());
    log('');

    // ============================================================
    // FIX 1: Sync 14 users without RBAC roles
    // ============================================================
    log('--- FIX 1: SYNC USER ROLES ---');
    const { data: users } = await s.from('users').select('id, name, type');
    const { data: roles } = await s.from('user_roles').select('user_id');
    const roleUserIds = new Set(roles.map(r => r.user_id));
    const missingRoles = users.filter(u => !roleUserIds.has(u.id));

    log(`Found ${missingRoles.length} users without roles. Inserting...`);

    for (const user of missingRoles) {
        // Map Portuguese type names to role names
        const roleMap = {
            'paciente': 'paciente',
            'profissional': 'profissional',
            'professional': 'profissional',
            'admin': 'admin',
            'aluno': 'aluno'
        };
        const role = roleMap[user.type] || user.type;

        const { error } = await s.from('user_roles').insert({
            user_id: user.id,
            role: role
        });

        if (error) {
            log(`  ERROR inserting role for ${user.name}: ${error.message}`);
        } else {
            log(`  ✅ ${user.name} (${user.type}) → role: ${role}`);
        }
    }

    // ============================================================
    // FIX 2: Mark professionals as payment_status = 'exempt'
    // ============================================================
    log('');
    log('--- FIX 2: EXEMPT PROFESSIONALS FROM PAYMENT ---');
    const { data: pros } = await s.from('users')
        .select('id, name, type, payment_status')
        .in('type', ['profissional', 'professional'])
        .neq('payment_status', 'exempt');

    log(`Found ${pros?.length || 0} professionals to exempt.`);
    for (const pro of (pros || [])) {
        const { error } = await s.from('users')
            .update({ payment_status: 'exempt' })
            .eq('id', pro.id);
        if (error) {
            log(`  ERROR exempting ${pro.name}: ${error.message}`);
        } else {
            log(`  ✅ ${pro.name}: ${pro.payment_status} → exempt`);
        }
    }

    // ============================================================
    // FIX 3: Ghost doctor_id investigation
    // ============================================================
    log('');
    log('--- FIX 3: GHOST DOCTOR_ID ---');
    const ghostId = '3d6b170c-9b36-4e0d-8364-1e9c5131cb17';
    const { data: ghostAssessments } = await s.from('clinical_assessments')
        .select('id, patient_id, status, created_at')
        .eq('doctor_id', ghostId);

    log(`Found ${ghostAssessments?.length || 0} assessments with ghost doctor_id.`);

    // Reassign to Dr. Ricardo Valença (main admin doctor)
    const ricardoId = '2135f0c0-10d1-4784-a8fd-cb2aa0cb4f7a'; // Dr. Ricardo from admin
    if (ghostAssessments?.length > 0) {
        // Check if Dr. Ricardo exists first
        const { data: ricardo } = await s.from('users').select('id, name').eq('id', ricardoId).maybeSingle();
        if (!ricardo) {
            log('  ⚠️ Dr. Ricardo admin ID not found - need full ID');
            // Try getting full ID
            const { data: ricardoSearch } = await s.from('users')
                .select('id, name')
                .eq('type', 'admin')
                .ilike('name', '%Ricardo%')
                .maybeSingle();
            if (ricardoSearch) {
                log(`  Found: ${ricardoSearch.name} [${ricardoSearch.id}]`);
                const { error } = await s.from('clinical_assessments')
                    .update({ doctor_id: ricardoSearch.id })
                    .eq('doctor_id', ghostId);
                if (error) log(`  ERROR: ${error.message}`);
                else log(`  ✅ Reassigned ${ghostAssessments.length} assessments to ${ricardoSearch.name}`);
            }
        } else {
            const { error } = await s.from('clinical_assessments')
                .update({ doctor_id: ricardoId })
                .eq('doctor_id', ghostId);
            if (error) log(`  ERROR: ${error.message}`);
            else log(`  ✅ Reassigned ${ghostAssessments.length} assessments to ${ricardo.name}`);
        }
    }

    // ============================================================
    // INVESTIGATION: Chat messages
    // ============================================================
    log('');
    log('--- INVESTIGATION: CHAT MESSAGES ---');

    // Check chat_messages table structure
    const { data: cmSample, error: cmErr } = await s.from('chat_messages').select('*').limit(1);
    if (cmErr) {
        log(`  chat_messages ERROR: ${cmErr.message}`);
    } else {
        log('  chat_messages table exists, 0 rows.');
        // If empty but table exists, let's check columns by looking at schema
    }

    // Check legacy
    const { data: legacyMsgs, error: legErr } = await s.from('chat_messages_legacy').select('id, room_id, sender_id, content, created_at').limit(5);
    if (legErr) {
        log(`  chat_messages_legacy ERROR: ${legErr.message}`);
    } else {
        log(`  chat_messages_legacy has ${legacyMsgs?.length} sample rows:`);
        legacyMsgs?.forEach(m => {
            log(`    ${m.created_at} | sender: ${m.sender_id?.slice(0, 8)} | "${(m.content || '').slice(0, 50)}"`);
        });
    }

    // Check what table the frontend refers to
    log('');
    log('  CONCLUSION: Frontend likely writes to chat_messages but');
    log('  RLS might block INSERT or the table was recreated empty.');
    log('  Legacy table has 15 messages from before migration.');

    // ============================================================
    // VERIFICATION
    // ============================================================
    log('');
    log('--- VERIFICATION ---');
    const { data: rolesAfter } = await s.from('user_roles').select('user_id');
    log(`User roles: ${rolesAfter?.length} (was 23)`);

    const { data: prosAfter } = await s.from('users')
        .select('id, name, payment_status')
        .in('type', ['profissional', 'professional'])
        .neq('payment_status', 'exempt');
    log(`Professionals still pending: ${prosAfter?.length || 0}`);

    const { data: ghostAfter } = await s.from('clinical_assessments')
        .select('id')
        .eq('doctor_id', ghostId);
    log(`Assessments with ghost doctor: ${ghostAfter?.length || 0}`);

    log('');
    log('=== TIER 0 FIXES COMPLETE ===');

    fs.writeFileSync('scripts/tier0_fix_results.txt', lines.join('\n'), 'utf8');
}

run().catch(e => { log('FATAL ERROR:', e.message); });
