
-- Trigger: quando um novo usuário auth é criado, vincular ao registro existente na tabela users (se existir com mesmo email)
-- Isso resolve o fluxo de convite: profissional cria paciente → paciente se registra → vincula automaticamente

CREATE OR REPLACE FUNCTION public.fn_link_auth_to_existing_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id uuid;
  v_email text;
BEGIN
  v_email := NEW.email;
  
  -- Verificar se já existe um registro na tabela users com esse email (criado por profissional)
  SELECT id INTO v_existing_user_id
  FROM public.users
  WHERE email = v_email
    AND id != NEW.id
  LIMIT 1;
  
  IF v_existing_user_id IS NOT NULL THEN
    -- Atualizar o registro existente para usar o ID do auth
    -- Copiar dados do registro antigo para o novo ID
    INSERT INTO public.users (id, email, name, type, phone, cpf, gender, address, payment_status, trial_ends_at, invited_by, created_at, updated_at)
    SELECT 
      NEW.id,
      u.email,
      COALESCE(NEW.raw_user_meta_data->>'name', u.name),
      u.type,
      u.phone,
      u.cpf,
      u.gender,
      u.address,
      u.payment_status,
      u.trial_ends_at,
      u.invited_by,
      u.created_at,
      now()
    FROM public.users u
    WHERE u.id = v_existing_user_id
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, public.users.name),
      type = EXCLUDED.type,
      phone = COALESCE(EXCLUDED.phone, public.users.phone),
      cpf = COALESCE(EXCLUDED.cpf, public.users.cpf),
      gender = COALESCE(EXCLUDED.gender, public.users.gender),
      address = COALESCE(EXCLUDED.address, public.users.address),
      payment_status = EXCLUDED.payment_status,
      trial_ends_at = EXCLUDED.trial_ends_at,
      invited_by = EXCLUDED.invited_by,
      updated_at = now();
    
    -- Copiar roles do registro antigo para o novo ID
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, ur.role
    FROM public.user_roles ur
    WHERE ur.user_id = v_existing_user_id
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Remover o registro antigo (com ID temporário gerado pelo profissional)
    DELETE FROM public.user_roles WHERE user_id = v_existing_user_id;
    DELETE FROM public.users WHERE id = v_existing_user_id;
    
    RAISE LOG '[MedCannLab] Linked auth user % to existing patient record (old_id: %)', NEW.id, v_existing_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger no auth.users (AFTER INSERT) 
-- NOTA: Não podemos criar triggers em auth.users diretamente.
-- Em vez disso, vamos usar a abordagem de verificar no handle_new_user trigger existente.

-- Criar/atualizar a função que já é chamada quando um novo user é criado
-- Verificar se já existe um trigger handle_new_user
CREATE OR REPLACE FUNCTION public.fn_on_auth_user_created_link_existing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id uuid;
  v_email text;
  v_existing_type text;
  v_existing_invited_by uuid;
BEGIN
  v_email := NEW.email;
  
  -- Verificar se já existe um registro na tabela users com esse email
  SELECT id, type, invited_by INTO v_existing_user_id, v_existing_type, v_existing_invited_by
  FROM public.users
  WHERE email = v_email
    AND id != NEW.id
  LIMIT 1;
  
  IF v_existing_user_id IS NOT NULL THEN
    -- Migrar dados do registro pré-existente para o novo auth ID
    UPDATE public.users 
    SET id = NEW.id, updated_at = now()
    WHERE id = v_existing_user_id;
    
    -- Atualizar user_roles para o novo ID
    UPDATE public.user_roles
    SET user_id = NEW.id
    WHERE user_id = v_existing_user_id;
    
    RAISE LOG '[MedCannLab] ✅ Linked auth user % to pre-existing record (email: %, old_id: %)', NEW.id, v_email, v_existing_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_link_existing_user ON auth.users;

-- Criar trigger BEFORE o handle_new_user para fazer o link antes de tentar criar duplicata
CREATE TRIGGER trg_link_existing_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_on_auth_user_created_link_existing();
