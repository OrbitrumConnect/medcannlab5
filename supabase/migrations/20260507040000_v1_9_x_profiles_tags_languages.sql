-- V1.9.x — Profile profissional: tags + languages
-- ====================================================================
-- Adiciona 2 colunas TEXT em profiles para vitrine do profissional editar
-- áreas de atuação (tags) e idiomas atendidos (languages).
--
-- Formato comma-separated (mais simples que JSONB pra UX de input single-line).
-- Frontend parseia: "Nefrologia, Dor, Inflamação" → ['Nefrologia', 'Dor', 'Inflamação'].
--
-- Renderização: Modal Ver Perfil em PatientAppointments.tsx renderiza
-- condicionalmente (V1.9.149 princípio: dados vazios não viram placeholder fake).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS — re-rodar não muda nada.
-- Já aplicado via PAT em produção 07/05/2026 ~16h35 BRT.
-- Sem regressão: profiles continua funcionando com colunas vazias (NULL default).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tags TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT;

COMMENT ON COLUMN public.profiles.tags IS
  'V1.9.x: áreas de atuação separadas por vírgula (ex: Nefrologia, Dor, Inflamação). Renderiza como chips no modal Ver Perfil.';

COMMENT ON COLUMN public.profiles.languages IS
  'V1.9.x: idiomas atendidos separados por vírgula (ex: Português, Inglês).';
