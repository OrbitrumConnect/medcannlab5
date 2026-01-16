-- SCRIPT DE CORREÇÃO DE INTEGRIDADE (O "FIX" FINAL)
-- Objetivo: Ligar os usuários aos seus papéis e clínicas para que o sistema funcione 100%.

-- 1. PROMOVER O DESENVOLVEDOR (VOCÊ) A SUPER-ADMIN
-- Garante que você veja absolutamente tudo.
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    jsonb_set(raw_user_meta_data, '{type}', '"admin"'),
    '{flag_admin}', 'true'
)
WHERE email = 'phpg69@gmail.com';

-- 2. TENTAR PROMOVER DR. RICARDO E EDUARDO (Se existirem com esses emails)
-- Ajusta para que eles sejam reconhecidos como Médicos e Admins
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    jsonb_set(raw_user_meta_data, '{type}', '"admin"'), -- Ou 'professional', mas admin garante visão total
    '{role}', '"master"'
)
WHERE email IN ('ricardo.valenca@medcann.com', 'eduardo.faveret@medcann.com');

-- 3. VINCULAR CLÍNICAS AOS MÉDICOS REAIS
-- Isso faz a agenda funcionar. O sistema saberá que a Clínica X é do Usuário Y.

-- Vincula Clínica Ricardo ao usuário Ricardo (Busca pelo nome ou email)
UPDATE public.clinics
SET doctor_id = (SELECT id FROM auth.users WHERE email = 'ricardo.valenca@medcann.com' LIMIT 1)
WHERE name ILIKE '%Ricardo%' AND doctor_id IS NULL;

-- Vincula Clínica Eduardo ao usuário Eduardo
UPDATE public.clinics
SET doctor_id = (SELECT id FROM auth.users WHERE email = 'eduardo.faveret@medcann.com' LIMIT 1)
WHERE name ILIKE '%Eduardo%' AND doctor_id IS NULL;

-- 4. ATIVAR PERFIL PROFISSIONAL
-- Garante que eles existam na tabela de perfis públicos
INSERT INTO public.profiles (user_id, email, name, type)
SELECT id, email, raw_user_meta_data->>'name', 'professional'
FROM auth.users
WHERE email IN ('ricardo.valenca@medcann.com', 'eduardo.faveret@medcann.com')
ON CONFLICT DO NOTHING;

-- 5. CORRIGIR STATUS DOS AGENDAMENTOS
-- Se houver agendamentos "presos", libera eles.
UPDATE public.appointments
SET status = 'confirmed'
WHERE status = 'scheduled' AND created_at < NOW() - INTERVAL '1 day';

-- FIM DO SCRIPT DE CORREÇÃO
