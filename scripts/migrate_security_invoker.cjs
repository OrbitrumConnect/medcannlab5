// Execute SECURITY INVOKER migration via Supabase Management API
const fs = require('fs');

const PROJECT_REF = 'itdjkfubfzmvmuxxjoae';
const ACCESS_TOKEN = 'sbp_bf1779e61b5e314829b3505cb2f4460173636e53';

// List of all views to migrate
const views = [
    'v_kpi_basic', 'v_dashboard_advanced_kpis', 'v_doctor_dashboard_kpis',
    'v_attendance_kpis_today', 'v_ai_quality_metrics',
    'v_appointments_json', 'v_appointments_unified', 'v_next_appointments',
    'v_chat_inbox', 'v_chat_user_profiles', 'v_unread_messages_kpi',
    'v_clinical_reports', 'v_paciente_completo', 'v_contexto_longitudinal',
    'v_interacoes_recentes', 'v_patient_prescriptions', 'v_patient_renal_profile',
    'v_renal_monitoring_kpis', 'v_renal_trend', 'v_scope_patients',
    'patient_assessments', 'eduardo_shared_assessments', 'ricardo_shared_assessments',
    'active_subscriptions', 'v_checkout_with_points',
    'users_compatible', 'v_user_points_balance', 'view_current_ranking_live',
    'v_prescriptions_queue', 'v_auth_activity'
];

async function run() {
    const lines = [];
    const log = (...args) => { const msg = args.join(' '); lines.push(msg); console.log(msg); };

    log('=== SECURITY INVOKER MIGRATION ===');
    log('Date:', new Date().toISOString());
    log(`Views to migrate: ${views.length}`);
    log('');

    let success = 0;
    let failed = 0;

    for (const view of views) {
        const sql = `ALTER VIEW public.${view} SET (security_invoker = on);`;

        try {
            const res = await fetch(
                `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTI5MCwiZXhwIjoyMDc2NzQxMjkwfQ.ah3Qfel7dN2x6Iyd1tY9evQaMR0OX8LpRZJXPvzr1fg',
                    }
                }
            );
            // REST API doesn't support DDL. Need to use the management API
        } catch (e) { }
    }

    // Use the Supabase Management API to run SQL
    log('Using Management API to execute DDL...');

    const allSql = views.map(v => `ALTER VIEW public.${v} SET (security_invoker = on);`).join('\n');

    const res = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ query: allSql })
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        log(`API Error (${res.status}): ${errText}`);

        // Try individual queries
        log('');
        log('Trying individual ALTER VIEW statements...');

        for (const view of views) {
            const sql = `ALTER VIEW public.${view} SET (security_invoker = on);`;

            const r = await fetch(
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

            if (r.ok) {
                log(`  ✅ ${view} → SECURITY INVOKER`);
                success++;
            } else {
                const errText = await r.text();
                log(`  ❌ ${view}: ${errText.slice(0, 100)}`);
                failed++;
            }
        }
    } else {
        const data = await res.json();
        log('All views migrated in batch!');
        log('Response:', JSON.stringify(data).slice(0, 200));
        success = views.length;
    }

    log('');
    log(`=== RESULTS: ${success} success, ${failed} failed ===`);

    fs.writeFileSync('scripts/security_invoker_results.txt', lines.join('\n'), 'utf8');
}

run().catch(e => console.error('FATAL:', e.message));
