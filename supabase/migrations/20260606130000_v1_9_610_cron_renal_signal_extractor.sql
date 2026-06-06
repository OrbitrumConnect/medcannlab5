-- V1.9.610: cron que liga o pipeline do Sidecar Renal (auto-população das sugestões DRC).
--
-- DIAGNÓSTICO (06/06, empírico): a cadeia AEC → captation_extra → renal-signal-extractor →
-- renal_inline_suggestions → card FUNCIONA (Maria das Dores provou ponta-a-ponta, aprovada
-- pelo Dr. Ricardo 17/05), MAS faltava a última peça: **nada chamava o extrator**.
--   • Upstream OK: o Core (tradevision-core V1.9.303, linha ~6260) classifica a FALA DO PACIENTE
--     via GPT-4o-mini em `laboratorios_inline` e grava noa_logs interaction_type='captation_extra'.
--     Gated (userInput>300 chars + fase elegível + AEC ativa = ~10% dos turns) → raro, mas correto.
--     NÃO sofre poluição RAG (processa só lastUserMsg role='user', não o contexto injetado).
--   • Extrator OK: renal-signal-extractor (V1.9.307) varre captation_extra dos últimos 30 min,
--     regex creatinina/proteinúria + CKD-EPI 2021, escreve renal_inline_suggestions (pending),
--     idempotente (UNIQUE source_turn_id+creatinine), flag-gated (renal_inline_suggestions=true).
--     Read-only nos noa_logs, NÃO toca AEC FSM/Pipeline. Comentário do Edge: "invocação via pg_cron futuro".
--   • Faltava: o pg_cron. Esta migration cria.
--
-- ZERO REGRESSÃO: cron chama Edge decoplada/idempotente/read-only (mesmo padrão de
-- video-call-reminders-5min). */15 cobre a janela de 30 min do extrator com folga (overlap
-- absorvido pela idempotência). Sugestões nascem 'pending' → gated por validação médica.
-- Invocação manual pré-cron retornou success/0 erros/idempotente.
--
-- NOTA: isto liga o pipeline de LABS existente (já validado pelo Ricardo). A expansão pra
-- SINTOMAS PRECOCES (cálculo/IRA/dor lombar/disúria — Oportunidade A da reunião) é separada
-- e segue pendente de GO Ricardo + slug-test.

SELECT cron.schedule(
  'renal-signal-extractor-15min',
  '*/15 * * * *',
  $job$SELECT net.http_post(
    url := 'https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/renal-signal-extractor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_for_cron' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )$job$
);
