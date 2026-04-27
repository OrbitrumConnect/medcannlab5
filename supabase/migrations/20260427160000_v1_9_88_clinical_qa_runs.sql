-- V1.9.88 - Observability Clinic Layer
-- Tabela imutavel para auditoria dos runs de validacao QA (metodo V1.9.85 cristalizado).
--
-- Origem: Bloco K do diario 27/04 + memoria feedback_metodo_validacao_producao.
-- Princ. 8: liga o que ja existe (workflow manual) em produto persistido.
--
-- Cada row = 1 execucao do metodo de 5 etapas (logs + banco + codigo +
-- classificacao 🟢🟡🟠🔴 + review humano/GPT) sobre 1 report clinico.
--
-- NAO bate com clinical_reports (que sao os relatorios em si).
-- NAO bate com institutional_trauma_log (que sao incidentes).
-- Esta tabela = camada de QA/observabilidade clinica.

CREATE TABLE IF NOT EXISTS public.clinical_qa_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text REFERENCES public.clinical_reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Quando + quem rodou
  ran_at timestamptz NOT NULL DEFAULT now(),
  ran_by text NOT NULL DEFAULT 'manual',
    -- valores aceitos: 'manual' | 'auto-trigger' | 'cron' | 'claude' | 'gpt-review'

  -- Evidencias cruzadas (3 dimensoes do metodo)
  log_findings jsonb DEFAULT '{}'::jsonb,
  db_findings jsonb DEFAULT '{}'::jsonb,
  code_findings jsonb DEFAULT '{}'::jsonb,

  -- Achados classificados (Bloco K do diario 27/04)
  green_facts jsonb DEFAULT '[]'::jsonb,
    -- 🟢 fato verificado via SQL/grep/git
  yellow_hypotheses jsonb DEFAULT '[]'::jsonb,
    -- 🟡 hipotese plausivel mas nao validada em prod
  orange_interpretations jsonb DEFAULT '[]'::jsonb,
    -- 🟠 leitura subjetiva, com vies possivel
  red_blindspots jsonb DEFAULT '[]'::jsonb,
    -- 🔴 angulo cego reconhecido (ex: mobile, performance, edge cases)

  -- Veredito final
  verdict text,
    -- valores aceitos: 'aprovado' | 'parcial' | 'regressao' | 'investigacao'
  verdict_score smallint,
    -- 0-100 (0 = falha total, 100 = aprovado sem ressalvas)
  notes text,

  -- Versoes do sistema na hora do run
  system_version text,
    -- ex: 'V1.9.86', 'V1.9.87' — extraido de metadata.system_version

  -- Metadados livres
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indices para queries comuns
CREATE INDEX idx_clinical_qa_runs_report ON public.clinical_qa_runs(report_id);
CREATE INDEX idx_clinical_qa_runs_ran_at ON public.clinical_qa_runs(ran_at DESC);
CREATE INDEX idx_clinical_qa_runs_verdict ON public.clinical_qa_runs(verdict);
CREATE INDEX idx_clinical_qa_runs_user ON public.clinical_qa_runs(user_id);

-- RLS: tabela auditavel, apenas leitura por admins/doctors envolvidos
ALTER TABLE public.clinical_qa_runs ENABLE ROW LEVEL SECURITY;

-- Admins veem tudo
CREATE POLICY "qa_runs_admin_select"
  ON public.clinical_qa_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Doctors veem QA dos reports vinculados a eles
CREATE POLICY "qa_runs_doctor_select"
  ON public.clinical_qa_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_reports cr
      WHERE cr.id = clinical_qa_runs.report_id
        AND (cr.doctor_id = auth.uid() OR cr.professional_id = auth.uid())
    )
  );

-- Pacientes veem QA dos seus proprios reports
CREATE POLICY "qa_runs_patient_select"
  ON public.clinical_qa_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_reports cr
      WHERE cr.id = clinical_qa_runs.report_id
        AND cr.patient_id = auth.uid()
    )
  );

-- Apenas service_role insere (escrita controlada — auditoria imutavel)
CREATE POLICY "qa_runs_service_insert"
  ON public.clinical_qa_runs FOR INSERT
  TO service_role WITH CHECK (true);

-- SEM UPDATE / SEM DELETE: auditoria imutavel.
-- Para corrigir: insert nova row com referencia em metadata.supersedes.

COMMENT ON TABLE public.clinical_qa_runs IS
  'V1.9.88 Observability Clinic Layer — auditoria dos runs de validacao QA (metodo V1.9.85). Imutavel apos insert.';

COMMENT ON COLUMN public.clinical_qa_runs.green_facts IS
  '🟢 Fatos verificados via SQL/grep/git nesta sessao. Confiavel.';
COMMENT ON COLUMN public.clinical_qa_runs.yellow_hypotheses IS
  '🟡 Hipoteses arquiteturalmente coerentes mas nao validadas em producao real.';
COMMENT ON COLUMN public.clinical_qa_runs.orange_interpretations IS
  '🟠 Leitura subjetiva com vies possivel. Tratar como ponto de partida.';
COMMENT ON COLUMN public.clinical_qa_runs.red_blindspots IS
  '🔴 Angulos cegos reconhecidos (ex: mobile, perf, edge cases). Assumir possivel erro.';
