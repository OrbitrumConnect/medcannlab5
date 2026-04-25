#!/usr/bin/env node
// ============================================================================
// RLS AUDIT GATE — V1.9.50
//
// Roda scripts/audit_rls_gate.sql contra o banco via Supabase Management API
// e classifica resultado em FAIL/WARN/OK_INFO.
//
// Exit code:
//   0 — nenhum FAIL (deploy pode prosseguir)
//   1 — pelo menos 1 FAIL ou erro de execução (CI falha)
//
// Variáveis de ambiente requeridas:
//   SUPABASE_ACCESS_TOKEN  — PAT pessoal (sbp_...) com acesso ao project
//   SUPABASE_PROJECT_REF   — ref do project (ex: itdjkfubfzmvmuxxjoae)
//
// Uso local:
//   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=... node scripts/audit_rls_gate.js
//
// Uso CI: ver .github/workflows/deploy-and-test.yml job rls-audit
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!PAT || !PROJECT_REF) {
  console.error('❌ SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF são obrigatórios');
  process.exit(1);
}

const sqlPath = path.join(__dirname, 'audit_rls_gate.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

let results;
try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ Management API retornou ${res.status}: ${text}`);
      process.exit(1);
    }

    results = JSON.parse(text);
    if (!Array.isArray(results)) {
      console.error('❌ Resposta não é array:', JSON.stringify(results).slice(0, 500));
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Erro ao executar audit_rls_gate.sql:', e.message);
    process.exit(1);
  }

  const fails = results.filter(r => r.severity === 'FAIL');
  const warns = results.filter(r => r.severity === 'WARN');
  const oks   = results.filter(r => r.severity === 'OK_INFO');

  // Imprime cabeçalho
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  RLS AUDIT GATE — V1.9.50');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Project: ${PROJECT_REF}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log(`  FAIL: ${fails.length}  |  WARN: ${warns.length}  |  OK_INFO: ${oks.length}`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  // FAIL — bloqueia deploy
  if (fails.length > 0) {
    console.log('\n🛑 FAIL — issues que BLOQUEIAM deploy:\n');
    fails.forEach(r => {
      console.log(`  [${r.check_id}] ${r.object}`);
      console.log(`     ${r.detail}\n`);
    });
  }

  // WARN — não bloqueia, mas anota
  if (warns.length > 0) {
    console.log('\n⚠️  WARN — issues anotadas (não bloqueiam deploy):\n');
    warns.slice(0, 10).forEach(r => {
      console.log(`  [${r.check_id}] ${r.object}`);
      console.log(`     ${r.detail.slice(0, 120)}\n`);
    });
    if (warns.length > 10) {
      console.log(`  ... (+${warns.length - 10} mais — ver SQL output completo se relevante)\n`);
    }
  }

  // OK_INFO — confirmação positiva
  if (oks.length > 0) {
    console.log('\n✅ OK_INFO — confirmações positivas:\n');
    oks.forEach(r => {
      console.log(`  [${r.check_id}] ${r.object} — ${r.detail.slice(0, 100)}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  if (fails.length === 0) {
    console.log('  ✅ NENHUMA FAIL DETECTADA — deploy autorizado');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log(`  🛑 ${fails.length} FAIL(s) DETECTADA(s) — deploy BLOQUEADO`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
