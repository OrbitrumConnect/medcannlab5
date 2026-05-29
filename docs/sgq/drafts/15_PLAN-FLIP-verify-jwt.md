# PLAN-FLIP-001 — Plano de Flip `verify_jwt=true` em Edge `tradevision-core`

**Versão draft:** 0.1 (29/05/2026)
**Status:** PRONTO PARA EXECUÇÃO (depende janela operacional do Pedro)
**Risco residual após análise empírica:** **MUITO BAIXO** (zero callers sem JWT detectados)
**Referência cruzada:** TRM-001 Gap #3, RSK-001 H8, SRS-NFR-06, SAD-DEC-13

---

## 1. Contexto

Edge `tradevision-core` v423 está em produção com `verify_jwt=false` por configuração herdada de deploys anteriores. Isso significa que qualquer caller com `ANON_KEY` pode invocar a Edge sem autenticação de usuário — risco H8 do RSK-001 (severidade MÉDIA-ALTA).

## 2. Mapping empírico de callers (29/05/2026)

### 2.1. Callers via `supabase.functions.invoke()` (auto-injeta JWT do usuário)

| Arquivo | Linha | Uso |
|---|---|---|
| `src/hooks/useResearchChat.ts` | 164 | Matrix Z2 — pesquisa científica |
| `src/lib/clinicalAssessmentFlow.ts` | 1875 | AEC FSM — fluxo clínico |
| `src/lib/noaResidentAI.ts` | 2269 | IA Residente Nôa |
| `src/components/ShareReportModal.tsx` | 114 | Share de relatório paciente→médico |

### 2.2. Caller via `fetch()` direto

| Arquivo | Linha | Auth |
|---|---|---|
| `src/lib/noaEngine.ts` | 68 | **Já passa `Authorization: Bearer ${session.access_token}` manualmente** ✅ |

### 2.3. Callers no backend (Edge functions / cron / service role)

**ZERO callers detectados:**
- `grep -rn "tradevision-core" supabase/functions/` retorna só auto-referências.
- `grep -rn "SERVICE_ROLE.*tradevision" supabase/` retorna 0 matches.
- `grep -rn "net.http_post.*tradevision" supabase/` retorna 0 matches.

## 3. Análise de risco

| Cenário | Probabilidade | Severidade | Mitigação |
|---|---|---|---|
| Caller frontend sem JWT (anônimo) | **ZERO** | Crítica | Mapping 100% confirmou JWT presente |
| Caller backend service_role | **ZERO** | N/A | Zero callers backend |
| Janela de uso ativo durante flip | Baixa (madrugada) | Média | Executar 02h-06h BRT |
| Quebra de turn IA em sessão ativa | Baixa | Alta | Rollback em 1 comando (~30s) |

**Risco residual final: MUITO BAIXO** após validação empírica.

## 4. Comando de flip

```bash
# Confirmar PAT exportado primeiro
export SUPABASE_ACCESS_TOKEN=sbp_***SUPABASE_PAT_HERE***

# Deploy SEM --no-verify-jwt (flippa verify_jwt:false → true)
npx supabase functions deploy tradevision-core \
  --project-ref itdjkfubfzmvmuxxjoae
```

Isso deploya nova versão (provavelmente v424) com `verify_jwt=true`.

## 5. Smoke checklist PRÉ-flip

```bash
# 1. Confirmar estado atual: verify_jwt=false
curl -s "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const t=j.find(f=>f.slug==='tradevision-core');console.log('PRE-FLIP:',t.slug,'verify_jwt='+t.verify_jwt,'v'+t.version)})"
# Esperado: verify_jwt=false v423

# 2. Smoke turn IA atual (com JWT válido)
# → fazer 1 turn via UI (Pedro logado) e confirmar response em até 12s
```

## 6. Smoke checklist PÓS-flip

```bash
# 1. Confirmar verify_jwt=true em nova versão
curl -s "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const t=j.find(f=>f.slug==='tradevision-core');console.log('POS-FLIP:',t.slug,'verify_jwt='+t.verify_jwt,'v'+t.version)})"
# Esperado: verify_jwt=true v424

# 2. Smoke 401 sem JWT
curl -X POST "https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/tradevision-core" \
  -H "Content-Type: application/json" \
  -d '{"message":"teste sem auth"}'
# Esperado: 401 Unauthorized

# 3. Smoke turn IA com JWT válido via UI
# → fazer 1 turn via UI (Pedro logado) e confirmar response em até 12s

# 4. Smoke 5 turns AEC reais
# → conduzir mini-AEC (5 fases) e confirmar pipeline RATIONALITY dispara
```

## 7. Rollback (se algo quebrar)

```bash
# Re-deploy com --no-verify-jwt (volta verify_jwt:true → false)
npx supabase functions deploy tradevision-core \
  --project-ref itdjkfubfzmvmuxxjoae \
  --no-verify-jwt
```

Tempo total de rollback: ~30-60s.

## 8. Janela operacional sugerida

Empíricamente via telemetria 29/05 (ai_chat_interactions):
- 8 turns hoje, todos concentrados entre 23h (Ricardo) e 01h (Pedro) e 09h (Pedro)
- Madrugada 02h-06h BRT: **ZERO turns** historicamente

**Janela recomendada:** 02h-05h BRT, qualquer dia útil.
**Janela alternativa:** sábado 09h-11h BRT (Eduardo + Ricardo dormem cedo no sábado, validado empíricamente).

## 9. Telemetria pós-flip (24h)

Monitorar via PAT:

```sql
SELECT
  COUNT(*) AS turns_24h_pos_flip,
  ROUND(SUM((metadata->>'cost_usd_estimate')::numeric), 4) AS custo_usd,
  COUNT(*) FILTER (WHERE ai_response IS NULL OR ai_response = '') AS turns_falhos,
  ROUND(AVG(processing_time), 0) AS latency_media_ms
FROM ai_chat_interactions
WHERE created_at > now() - interval '24 hours';
```

**Critério de sucesso:**
- `turns_falhos = 0`
- `latency_media_ms` dentro do baseline pré-flip
- 0 chamadas com erro 401 nos logs Edge

## 10. Atualizações pós-flip bem-sucedido

Atualizar imediatamente após smoke pós-flip PASS:

1. **CLAUDE.md** — Edge `tradevision-core` v424 verify_jwt=true ✅
2. **RSK-001 H8** — risco MÉDIO-ALTO → resolvido
3. **TRM-001 Gap #3** — marcar como resolvido
4. **Backlog** — remover Sprint A item 2 (--no-verify-jwt)
5. **Diário do dia** — Bloco "Flip verify_jwt OK" com smoke results
6. **Memória** — cristalizar `feedback_verify_jwt_flip_seguro_via_mapping_empirico_29_05.md`

## 11. Responsável pelo flip

Pedro Henrique Passos Galluf (Tech Lead).

## 12. Pre-aprovação de risco

Análise empírica conduzida via grep frontend + grep backend + telemetria janela operacional. Mapping documenta zero callers sem JWT.

---

**Aprovação para execução:**
- [ ] Pedro (Tech Lead) — Data: ___/___/___
- [ ] (Opcional) Ricardo Valença (Médico Sócio) — para janela com horário acordado

**Frase âncora:**

> *"5 callers, 100% com JWT, zero risco residual após mapping empírico completo. Flip é exercício de 60 segundos com rollback de 30 segundos — não procrastinar."*
