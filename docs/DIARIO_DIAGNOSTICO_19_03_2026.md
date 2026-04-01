# 📋 DIÁRIO DIAGNÓSTICO — 19/03/2026
## Análise Cirúrgica: Supabase × Frontend × Segurança

**Data:** 19 de março de 2026  
**Método:** Security scan automatizado + queries diretas ao banco + auditoria de código

---

## 📊 NÚMEROS REAIS DO BANCO

| Métrica | Valor |
|---------|-------|
| **Tabelas no schema public** | 131 |
| **Tabelas com RLS ativo** | **131/131 (100%)** ✅ |
| **Tabelas com policies** | 131 (todas) |
| **Total de findings (security scan)** | 98 |
| **Erros CRÍTICOS** | **7** 🔴 |
| **Warnings** | 91 |
| **Usuários no banco** | 31 |
| **user_roles registros** | 37 (4 roles: paciente/profissional/admin/aluno) |

### Distribuição de Usuários (`public.users`)
| type | quantidade |
|------|-----------|
| paciente | 16 |
| profissional | 6 |
| admin | 5 |
| professional | 2 ⚠️ (inglês vs português) |
| patient | 1 ⚠️ |
| aluno | 1 |

### Distribuição de Roles (`public.user_roles`)
| role | quantidade |
|------|-----------|
| paciente | 24 |
| profissional | 8 |
| admin | 4 |
| aluno | 1 |

> ⚠️ **INCONSISTÊNCIA:** Existem 2 registros com `type='professional'` e 1 com `type='patient'` (em inglês) vs os demais em português. A função `has_role()` usa a tabela `user_roles` que está normalizada em português. Isso pode causar falhas de acesso para esses 3 usuários.

---

## 🔴 7 ERROS CRÍTICOS (Security Scan)

### 1. 🚨 PRIVILEGE ESCALATION — Qualquer usuário pode se tornar admin
**Tabela:** `users`  
**Problema:** A policy de UPDATE (`users_update`) permite `id = auth.uid()` sem restrição de colunas. Um usuário pode fazer `UPDATE users SET flag_admin = true, type = 'admin' WHERE id = auth.uid()`.  
**Fix:** Criar trigger ou policy que impeça alteração de `flag_admin`, `type`, `role` por não-admins.  
**Severidade:** 🔴🔴🔴 MÁXIMA

### 2. 🚨 PUBLIC_USER_DATA — Dados de profissionais legíveis por visitantes anônimos
**Tabela:** `user_profiles`  
**Problema:** Policy `Public profiles read` com `USING: true` para role `{public}`. Emails, CRM, nomes de 31 usuários expostos sem autenticação.  
**Fix:** Trocar para `USING (auth.uid() IS NOT NULL)` + scoping.  
**Severidade:** 🔴🔴🔴 MÁXIMA

### 3. 🚨 CLINICAL ASSESSMENTS — Avaliações sem médico visíveis a todos
**Tabela:** `clinical_assessments`  
**Problema:** Policy com `(doctor_id IS NULL)` expõe toda avaliação sem médico atribuído a qualquer autenticado. Atualmente TODAS as 3 avaliações têm `doctor_id = NULL`.  
**Fix:** Remover cláusula `(doctor_id IS NULL)` da policy.  
**Severidade:** 🔴🔴 ALTA

### 4. 🚨 ASSESSMENT_SHARING — Sem verificação de identidade
**Tabela:** `assessment_sharing`  
**Problema:** Policies de Ricardo/Eduardo verificam `shared_with_*` e consentimento, mas NÃO verificam `auth.uid()`. Qualquer autenticado satisfaz a condição.  
**Fix:** Adicionar `auth.uid() = '<uuid_do_medico>'` em cada policy.  
**Severidade:** 🔴🔴 ALTA

### 5. 🚨 9 TABELAS MÉDICAS — USING(true) para authenticated
**Tabelas:** `abertura_exponencial`, `interacoes_ia`, `dados_imre_coletados`, `avaliacoes_renais`, `contexto_longitudinal`, `desenvolvimento_indiciario`, `fechamento_consensual`, `pacientes`, `permissoes_compartilhamento`  
**Problema:** SELECT com `USING: true` para `{authenticated}`. Qualquer logado vê PII de todos os pacientes.  
**Fix:** Restringir a `paciente_id = auth.uid()` ou via `check_professional_patient_link()`.  
**Severidade:** 🔴🔴 ALTA

### 6. 🚨 9 TABELAS — Profissional vê TUDO sem vínculo
**Tabelas:** `imre_assessments`, `renal_exams`, `patient_lab_results`, `patient_conditions`, `patient_exam_requests`, `prescriptions`, `epilepsy_events`, `wearable_devices`, `ai_saved_documents`  
**Problema:** Policies checam `type = 'professional'` mas NÃO verificam vínculo paciente-profissional.  
**Fix:** Adicionar `check_professional_patient_link(auth.uid(), patient_id)` nas policies.  
**Severidade:** 🔴🔴 ALTA

### 7. 🚨 CHAT_MESSAGES_LEGACY — Mensagens legadas expostas
**Tabela:** `chat_messages_legacy`  
**Problema:** `USING: true` para authenticated. Emails, nomes, CRM e conteúdo de mensagens legadas visíveis a todos.  
**Fix:** Restringir a participantes do canal ou depreciar a tabela.  
**Severidade:** 🔴 MÉDIA

---

## ⚠️ WARNINGS RELEVANTES (91 total)

| Categoria | Quantidade | Impacto |
|-----------|-----------|---------|
| `function_search_path_mutable` | 80 | Baixo — funções sem `SET search_path`. Pode ser explorado em cenários avançados |
| `rls_policy_always_true` | 7 | Médio — INSERT/UPDATE/DELETE com `WITH CHECK (true)` |
| `extension_in_public` | 1 | Baixo — extensão no schema public |
| `leaked_password_protection` | 1 | Médio — proteção contra senhas vazadas desabilitada |
| `notifications INSERT aberto` | 1 | Médio — qualquer autenticado pode enviar notificação a qualquer usuário |
| `conversation_ratings` exposta | 1 | Baixo — relações pac-prof visíveis |

---

## ✅ O QUE ESTÁ CORRETO

1. **100% das tabelas com RLS ativo** — nenhuma tabela desprotegida
2. **`user_roles` separada** — conforme best practice (não no profiles)
3. **`has_role()` function** — SECURITY DEFINER, correta
4. **`check_professional_patient_link()`** — existe e funciona, mas não é usada em todas as policies
5. **`create_chat_room_for_patient()`** — RPC idempotente ✅
6. **Edge Functions deployadas** — `wisecare-session`, `extract-document-text`
7. **Chat system** — `chat_rooms` + `chat_participants` + `chat_messages` com policies funcionais
8. **Trigger `sync_user_roles_from_profile()`** — mapeia roles em português ✅
9. **Views migradas para SECURITY INVOKER** — 30 views corrigidas previamente
10. **Frontend compila sem erros** — preview funcional

---

## 🔄 INCONSISTÊNCIAS BANCO ↔ CÓDIGO

### 1. Tipos de Usuário Mistos (PT vs EN)
- Banco: `'paciente'`, `'profissional'`, `'admin'`, `'aluno'` (maioria)
- Mas 3 registros usam: `'professional'(2)`, `'patient'(1)`
- `sync_user_roles_from_profile()` mapeia ambos → `user_roles` correto
- **Mas** policies antigas na tabela `users` usam `type = 'patient'` (inglês)
- **Risco:** Esses 3 usuários podem ter comportamento inconsistente

### 2. Tabelas Legadas Ativas
- `chat_messages_legacy` — dados antigos expostos, deveria ser deprecada
- `private_chats` / `private_messages` — coexistem com `chat_rooms` / `chat_messages`
- `profiles` vs `user_profiles` vs `users` — 3 tabelas com dados de identidade

### 3. DRC/Nôa — Gaps confirmados
- ❌ Nôa não conecta ao KnowledgeBase para respostas
- ❌ Sem RPC `calculate_ckd_stage`
- ✅ `patient_lab_results` existe e tem estrutura correta
- ✅ `renalCalculations.ts` existe no frontend com CKD-EPI 2021

---

## 🎯 PLANO CIRÚRGICO PARA SELAR

### FASE 1 — Bloqueadores Críticos (migração SQL única)
**Prioridade:** IMEDIATA  
**Esforço:** ~2h

| # | Ação | Tabela(s) |
|---|------|-----------|
| 1 | Criar trigger que bloqueia UPDATE de `flag_admin`, `type`, `role` por não-admins | `users` |
| 2 | Substituir `Public profiles read` por policy autenticada com scoping | `user_profiles` |
| 3 | Remover `(doctor_id IS NULL)` da policy de SELECT | `clinical_assessments` |
| 4 | Adicionar `auth.uid()` check nas policies de Ricardo/Eduardo | `assessment_sharing` |
| 5 | Substituir `USING(true)` por `paciente_id = auth.uid() OR has_role('admin')` | 9 tabelas médicas |
| 6 | Adicionar `check_professional_patient_link()` | 9 tabelas de acesso profissional |
| 7 | Deprecar ou restringir `chat_messages_legacy` | `chat_messages_legacy` |

### FASE 2 — Normalização (clean-up)
**Prioridade:** ALTA  
**Esforço:** ~1h

| # | Ação |
|---|------|
| 1 | Normalizar `type` dos 3 registros mistos (EN→PT) |
| 2 | Adicionar `search_path` às ~80 funções (em lotes) |
| 3 | Habilitar leaked password protection |
| 4 | Restringir INSERT de notifications |

### FASE 3 — Features DRC
**Prioridade:** MÉDIA  
**Esforço:** ~4-6h

| # | Ação |
|---|------|
| 1 | Conectar Nôa ao KnowledgeBase |
| 2 | Criar RPC `calculate_ckd_stage` |
| 3 | Script de entrevista DRC guiada |

---

## 📈 NÍVEL ATUAL

| Dimensão | Score | Nota |
|----------|-------|------|
| **Infraestrutura** | 90% | RLS 100%, roles correto, RPCs existem |
| **Segurança** | 55% | 7 erros críticos impedem produção |
| **Features Clínicas** | 70% | Chat, avaliações, prontuários funcionais; DRC pendente |
| **Integrações** | 60% | WiseCare OK; Stripe/Resend mock |
| **Frontend** | 85% | Compila, sem erros de console, rotas funcionais |
| **GLOBAL** | **~65%** | Precisa da Fase 1 para ir a 85%+ |

---

## ✅ VEREDITO

> **O app NÃO está pronto para produção** devido aos 7 erros críticos de segurança. A infraestrutura está sólida (RLS 100%, roles, RPCs), mas as policies permissivas anulam essa proteção. A Fase 1 (uma única migração SQL) resolve os bloqueadores e leva o sistema a ~85%. As Fases 2 e 3 são polimento e features.

**Próxima ação recomendada:** Executar migração SQL da Fase 1.

---

*Gerado automaticamente via security scan + queries diretas ao Supabase em 19/03/2026*
