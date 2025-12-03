# 🔒 Guia: Revogar Permissões Irrestritas de Admin

## ⚠️ Problema Identificado

Foram encontradas políticas RLS que dão acesso **irrestrito** aos admins para ver e gerenciar **TODAS** as avaliações clínicas:

```sql
CREATE POLICY "Admin pode ver todas as avaliações"
  ON clinical_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );
```

**Isso viola a privacidade dos pacientes!** ❌

---

## ✅ Solução

### Passo 1: Verificar Políticas Atuais

Execute primeiro o script de verificação:

```sql
-- Arquivo: database/VERIFICAR_POLITICAS_ASSESSMENTS.sql
```

Isso mostrará:
- Todas as políticas existentes
- Quais são perigosas (🔴)
- Quais são seguras (✅)

### Passo 2: Revogar Permissões

Execute o script de revogação:

```sql
-- Arquivo: database/REVOGAR_PERMISSOES_ADMIN_ASSESSMENTS.sql
```

Este script:
- ✅ Remove políticas perigosas
- ✅ Cria políticas restritivas
- ✅ Protege privacidade dos pacientes

---

## 🔐 Novas Políticas (Restritivas)

### O que admins PODEM fazer:
1. ✅ Ver avaliações de **seus próprios pacientes** (`doctor_id = admin.id`)
2. ✅ Ver avaliações **compartilhadas explicitamente** (com consentimento)
3. ✅ Criar avaliações para **seus pacientes**
4. ✅ Atualizar avaliações de **seus pacientes**

### O que admins NÃO PODEM fazer:
1. ❌ Ver **todas** as avaliações
2. ❌ Ver avaliações de outros profissionais
3. ❌ Deletar avaliações (apenas marcar como canceladas)
4. ❌ Acessar dados sem consentimento

---

## 📋 Checklist de Segurança

Após executar os scripts:

- [ ] Políticas perigosas removidas
- [ ] Políticas restritivas criadas
- [ ] RLS habilitado
- [ ] Teste de segurança executado
- [ ] Admins só veem seus pacientes

---

## 🧪 Teste de Segurança

Após executar, teste como admin:

```sql
-- Como admin, tentar ver todas as avaliações
SELECT COUNT(*) 
FROM clinical_assessments;

-- Deve retornar apenas avaliações:
-- 1. Onde admin é o doctor_id
-- 2. Compartilhadas explicitamente
-- 3. Não todas as avaliações do sistema
```

---

## 📊 Políticas Finais Esperadas

| Tipo | Política | Acesso |
|------|----------|--------|
| Paciente | Ver próprias avaliações | ✅ Próprias |
| Profissional | Ver avaliações de pacientes | ✅ Seus pacientes |
| Admin | Ver avaliações de pacientes | ✅ Seus pacientes OU compartilhadas |
| Admin | Gerenciar avaliações | ✅ Apenas seus pacientes |

---

## ⚠️ Importante

**Nunca mais criar políticas que dão acesso irrestrito!**

Sempre use:
- `doctor_id = auth.uid()` para profissionais
- `patient_id = auth.uid()` para pacientes
- Compartilhamento explícito para admins

---

**Status**: 🔒 **Segurança Restaurada**  
**Próximo**: Executar scripts de revogação

