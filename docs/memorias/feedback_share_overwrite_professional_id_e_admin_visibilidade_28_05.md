---
name: share-overwrite-professional-id-e-admin-visibilidade-28-05
description: "Validado empíricamente 28/05 via smoke AEC + PAT: SHARE de clinical_reports faz OVERWRITE em professional_id/doctor_id (não APPEND). Ricardo (médico original) sai desses campos quando paciente compartilha pra Eduardo. MAS Ricardo continua vendo o report novo via is_admin() (role=admin transparente, NÃO via appointments). RLS policy 'Reports access' tem UUIDs hardcoded (Eduardo f4a62265 + Pedro admin + Ricardo admin alt 99286e6f) + caminho via professional_id/doctor_id/patient_id — ZERO caminho via appointments. Memória clínica preservada em reports antigos (7 pré-22/05 ainda têm Ricardo como professional_id). Comportamento histórico MUDOU: report 8f4876e9 26/04 tem shared_with=[Ricardo, 5a9ada8b] (multi-share funcionou) → hoje virou overwrite (1 só no array). Não sei quando mudou. Lacuna latente: profissional puro (role=profissional sem admin) perde visibilidade dos reports gerados PÓS-share-pra-outro-médico mesmo com appointments históricos."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🔐 Share clinical_reports = OVERWRITE professional_id + admin visibilidade transparente — empírico 28/05

## Regra (cristalizada via smoke AEC 28/05 manhã)

Quando paciente compartilha relatório via UI:
1. `shared_with` recebe **APENAS o novo destinatário** (não preserva anteriores)
2. `professional_id` e `doctor_id` são **OVERWRITTEN** pra novo destinatário
3. `shared_by` = ID do paciente
4. Médico anterior **sai dos campos diretos** mas mantém acesso via outros caminhos (admin, reports antigos)

**Why**: validado empíricamente 28/05 — paciente d5e01ead (Pedro-teste) tinha 11 appointments com Ricardo (2135f0c0) + 7 reports antigos com `professional_id=Ricardo`. Compartilhou report `ef7b33d9` pra Eduardo (f4a62265). Resultado no banco: `professional_id=Eduardo`, `doctor_id=Eduardo`, `shared_with=[Eduardo]`. Ricardo sumiu desses 3 campos no report novo.

**How to apply**: 
- Antes de codar feature que dependa de "quem é o médico atual do paciente": NÃO confiar APENAS em `clinical_reports.professional_id` do report mais recente — pode ser destinatário de share, não médico de tratamento ativo
- Pra resolver "médico de tratamento ativo": cruzar com `appointments.status='scheduled'` mais recente OU criar campo dedicado (não existe hoje)
- Memória clínica do médico antigo continua nos reports antigos (não foi deletada) — paciente "volta pro médico antigo" funciona via `professional_id` dos reports pré-share

## Comportamento histórico MUDOU em algum momento

Report `8f4876e9` (26/04) tem `shared_with=[Ricardo, 5a9ada8b]` — **multi-share funcionou** (preservou os 2). Hoje virou overwrite (`[Eduardo]` só). Não rastreei quando/qual versão mudou. Pode ter sido:
- Mudança intencional UI (botão "compartilhar pra outro" agora substitui em vez de adicionar)
- Mudança código service que escreve no campo
- Mudança comportamento RLS

Vale rastrear se for relevante restaurar multi-share futuramente.

## RLS policy `Reports access` (caminhos de acesso ao report)

```sql
is_admin()                                    -- caminho admin transparente
OR auth.uid() IN [
    '17345b36-...'  -- Pedro admin
    'f62c3f62-...'  -- ???
    '99286e6f-...'  -- Ricardo admin alternativo
    'f4a62265-...'  -- Eduardo (HARDCODED, anti-pattern)
  ]
OR professional_id = auth.uid()
OR doctor_id = auth.uid()
OR patient_id = auth.uid()
```

**Achados**:
1. ⚠️ Eduardo está HARDCODED na policy (não-escalável quando entrar 3º médico)
2. Ricardo (rrvalenca, UUID 2135f0c0, `role=admin`) vê todos os reports via `is_admin()` — transparente pra ele
3. **NÃO HÁ caminho via `appointments`** — só via os 5 caminhos acima

## Lacuna latente (não te afeta hoje, vai afetar quando 3º médico entrar)

**Cenário futuro**: 3º médico profissional puro (role=profissional, não admin) tem 11 appointments com paciente. Paciente compartilha report novo pra 4º médico. 

→ 3º médico **NÃO vê o report novo** porque:
- Não é admin (não passa em `is_admin()`)
- Não está hardcoded na whitelist
- Foi sobrescrito em `professional_id`/`doctor_id`
- Não está em `shared_with`
- Policy NÃO consulta `appointments`

**Trigger empírico pra desparquear**:
- 3º médico profissional puro entrar no sistema
- Cenário acima reproduzir empíricamente
- Decisão: adicionar caminho via `appointments` na policy OR aceitar limitação

## Casos onde admin visibility transparente PODE confundir

Quando médico admin (Ricardo, Eduardo) vê report compartilhado pra OUTRO admin:
- Ricardo abre o report `ef7b33d9` — VÊ, mas NÃO foi pra ele
- Pode interpretar como "o paciente quer minha opinião" quando paciente compartilhou pra Eduardo apenas
- UX hoje não diferencia "destinatário direto" vs "visualização admin"

**Mitigação UX possível** (não-codada): no header do report mostrar "Compartilhado com: Dr. Eduardo Faveret" pra médicos não-destinatários verem que NÃO é caso pra eles.

## Conexões

- [[project_eduardo_faveret_no_app_sharing_validado_27_05]] — share validado 27/05 entre contas
- [[project_referral_multidisciplinar_sidecar_parqueado_28_05]] — feature referral que dependeria de "médico ativo" (NÃO confundir com professional_id)
- [[feedback_dual_write_contract_jsonb_vs_tabela_18_05]] — outro contrato implícito não-formalizado

## Frase âncora

> *"Share faz overwrite, não append. Médico antigo mantém acesso via admin role ou reports antigos. Memória clínica histórica preservada em campos imutáveis (signed reports antigos). Quando 3º médico profissional puro entrar, lacuna RLS-sem-appointments materializa — aí desparquea caminho via appointments."*
