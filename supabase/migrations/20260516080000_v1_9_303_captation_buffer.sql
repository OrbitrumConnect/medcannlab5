-- ==============================================================================
-- V1.9.303 — Captation Buffer (preserva fala paciente além da pergunta literal)
-- ==============================================================================
--
-- Contexto: Maria das Dores 15/05 — paciente real 86a despejou histórico completo
-- (DRC desde 2021, creatinina 1.61, proteinúria 1924 mg/g, não diálise, controle
-- alimentar + medicação) na resposta da PRIMEIRA pergunta "o que te trouxe aqui hoje".
-- Sistema (Verbatim First V1.9.86 em hard-lock COMPLAINT_LIST) capturou só a
-- última parte ("espuma da urina") como queixa principal. Resto foi DESCARTADO
-- ou mal-classificado em lista_indiciaria embolada.
--
-- Ricardo (médico real) identificou empíricamente: "a gente aceitou muito
-- relatório teste sem conferi realmente todo e agora tenho visto que nem sempre
-- coloca os dados na pergunta certa".
--
-- Solução V1.9.303:
-- - Detector na edge tradevision-core: input > 300 chars + fase IDENT/COMPLAINT* →
--   chama GPT-4o-mini classificador → persiste em captation_buffer
-- - Escriba V1.9.84 lê buffer + usa pra preencher campos do JSON final
--
-- AEC FSM intocada. Perguntas intocadas. Verbatim First intocado.
-- Pipeline V1.9.95 intocado. Só o ESCRIBA ganha contexto adicional.
--
-- Anti-regressão:
-- - Coluna NOVA, default '[]' (rows antigos não quebram)
-- - Falha silenciosa: se GPT classificador falhar, buffer fica vazio,
--   escriba funciona como antes (idempotente)
-- - Threshold 300 chars protege custo (<10% turns ativam classificador)
-- ==============================================================================

ALTER TABLE public.clinical_assessments
  ADD COLUMN IF NOT EXISTS captation_buffer JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.clinical_assessments.captation_buffer IS
  'V1.9.303 — Array de tópicos extras capturados quando paciente despeja >300
   chars na resposta de uma pergunta AEC. Cada item:
   {turn_id, raw_text, classification, confidence, from_phase, captured_at}.
   Categorias de classificação:
   - hpp_doencas_cronicas (DRC, cardiopatia, autoimune crônica)
   - laboratorios_inline (creatinina, eGFR, proteinúria, valores)
   - cirurgias_previas (cesárea, varizes, vesícula)
   - comorbidades (anemia, labirintopatia, dor crônica)
   - medicacoes_atuais (Prelone, Forxiga, etc)
   - queixa_lateral (sintoma secundário não-principal)
   - outros (catchall)
   Escriba V1.9.84 final lê buffer + distribui nos campos certos do JSON estruturado.';

-- Índice pra queries do escriba (busca por assessment_id rápido)
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_captation_buffer
  ON public.clinical_assessments USING gin (captation_buffer)
  WHERE jsonb_array_length(captation_buffer) > 0;

COMMENT ON INDEX public.idx_clinical_assessments_captation_buffer IS
  'V1.9.303 — Índice parcial GIN: só indexa assessments com buffer não-vazio.
   Otimiza queries do escriba V1.9.84 quando precisa enriquecer relatório.';
