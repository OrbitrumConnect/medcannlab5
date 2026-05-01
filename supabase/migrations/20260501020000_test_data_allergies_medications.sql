-- TEST DATA — populating allergies/medications/birth_date pra validar V1.9.112-A1
-- (Sinopse clínica Analisar Paciente)
-- Aplicada via Management API em 2026-05-01 ~01h BRT.
--
-- CONTEXTO
-- V1.9.112-A1 adicionou bloco "Sinopse clínica" ao topo do painel Analisar
-- Paciente, mostrando alergias + medicações + idade quando preenchidos.
-- Tabela users.allergies, .medications, .birth_date estavam todas NULL pra
-- todos os pacientes — bloco não renderizava.
--
-- Pra Pedro validar visualmente, populamos 2 pacientes teste:
-- - passosmir4 (Pedro, df6cee2d) — conta de teste própria
-- - Carolina Campello (5c98c123) — conta teste do Ricardo
--
-- IMPACTO: zero produção (ambas são contas de teste interno).
--
-- NOTA: gender NÃO foi atualizado por bug histórico de schema —
-- 2 check constraints conflitantes em users.gender:
-- - Constraint 1: ['male', 'female', 'other', 'prefer_not_to_say']
-- - Constraint 2: ['M', 'F', 'Outro']
-- Interseção = SOMENTE NULL. Bug latente pra V1.9.114 futuro
-- (consolidar single check constraint).

BEGIN;

UPDATE public.users
SET allergies = 'Penicilina, frutos do mar',
    medications = 'Losartana 50mg/dia (hipertensão)',
    birth_date = '1985-03-22'
WHERE id = 'df6cee2d-2697-47eb-9ae2-f4d439df711f';

UPDATE public.users
SET allergies = 'Dipirona, poeira',
    medications = 'Vitamina D 2000UI/dia',
    birth_date = '1990-07-15'
WHERE id = '5c98c123-83f9-4e66-9fb7-3f05a5431cc0';

COMMIT;
