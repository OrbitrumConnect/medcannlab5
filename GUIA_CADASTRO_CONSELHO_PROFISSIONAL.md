# 📋 Guia: Cadastro de Conselho Profissional

## ✅ Implementação Completa

### Campos Adicionados na Tabela `users`

Os seguintes campos foram adicionados com sucesso:

1. **`council_type`** (TEXT, nullable)
   - Tipo do conselho profissional
   - Valores: `CRM`, `CFN`, `CRP`, `CRF`, `CRO`

2. **`council_number`** (TEXT, nullable)
   - Número do registro no conselho
   - Exemplo: `12345` (sem hífen)

3. **`council_state`** (TEXT, nullable)
   - Estado do conselho (para conselhos regionais)
   - Exemplo: `SP`, `RJ`, `MG`, etc.

4. **`crm`** (TEXT, nullable) - Campo legado
   - Sincronizado automaticamente quando `council_type = 'CRM'`

5. **`cro`** (TEXT, nullable) - Campo legado
   - Sincronizado automaticamente quando `council_type = 'CRO'`

## 🎯 Funcionalidades Implementadas

### 1. Formulário de Cadastro Atualizado

**Arquivo**: `src/pages/Login.tsx`

- ✅ Campos de conselho aparecem **apenas** quando o tipo de usuário é "Profissional"
- ✅ Campo obrigatório: Tipo de Conselho (dropdown)
- ✅ Campo obrigatório: Número do Registro
- ✅ Campo obrigatório: Estado (apenas para conselhos regionais: CRM, CRO, CRP, CRF)
- ✅ Validação: Campos são obrigatórios para profissionais

### 2. Tipos de Conselho Suportados

- **CRM** - Conselho Regional de Medicina
- **CFN** - Conselho Federal de Nutrição
- **CRP** - Conselho Regional de Psicologia
- **CRF** - Conselho Regional de Farmácia
- **CRO** - Conselho Regional de Odontologia

### 3. Sincronização Automática

**Arquivo**: `database/ADICIONAR_CAMPOS_CONSELHO_PROFISSIONAL.sql`

- ✅ Trigger automático sincroniza `crm` quando `council_type = 'CRM'`
- ✅ Trigger automático sincroniza `cro` quando `council_type = 'CRO'`
- ✅ Mantém compatibilidade com código legado

### 4. Salvamento no Banco de Dados

**Arquivo**: `src/contexts/AuthContext.tsx`

- ✅ Dados salvos no `auth.users` (metadata)
- ✅ Dados salvos na tabela `users` (registro completo)
- ✅ Sincronização automática de campos legados

## 📝 Como Usar

### Para Profissionais

1. **Selecione "Profissional"** como tipo de usuário
2. **Selecione o Conselho** (CRM, CFN, CRP, CRF, CRO)
3. **Digite o Número do Registro** (sem hífen)
4. **Selecione o Estado** (apenas para conselhos regionais)

### Exemplos

**Médico:**
- Conselho: CRM
- Número: 123456
- Estado: SP

**Nutricionista:**
- Conselho: CFN
- Número: 789012
- Estado: (não necessário - conselho federal)

**Psicólogo:**
- Conselho: CRP
- Número: 345678
- Estado: RJ

## 🔍 Verificação

Para verificar se os campos foram criados corretamente:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('council_type', 'council_number', 'council_state', 'crm', 'cro')
ORDER BY column_name;
```

## 🎨 Interface do Usuário

### Campos Visíveis

Os campos de conselho profissional aparecem **automaticamente** quando:
- O usuário seleciona "Profissional" como tipo
- Está na tela de **criação de conta** (não no login)

### Validação

- ✅ Tipo de conselho: **obrigatório** para profissionais
- ✅ Número do registro: **obrigatório** para profissionais
- ✅ Estado: **obrigatório** apenas para conselhos regionais (CRM, CRO, CRP, CRF)
- ✅ Estado: **não necessário** para conselhos federais (CFN)

## 🔄 Próximos Passos

1. **Testar o cadastro** de um profissional
2. **Verificar** se os dados são salvos corretamente
3. **Validar** a sincronização automática dos campos legados
4. **Adicionar mais conselhos** se necessário (CRN, CRBM, etc.)

## 📊 Estrutura de Dados

```typescript
interface ProfessionalUser {
  id: string
  email: string
  name: string
  type: 'professional'
  council_type: 'CRM' | 'CFN' | 'CRP' | 'CRF' | 'CRO'
  council_number: string
  council_state?: string // Opcional para conselhos federais
  crm?: string // Sincronizado automaticamente se council_type = 'CRM'
  cro?: string // Sincronizado automaticamente se council_type = 'CRO'
}
```

## ✅ Checklist de Implementação

- [x] Script SQL criado e executado
- [x] Campos adicionados na tabela `users`
- [x] Formulário atualizado com campos de conselho
- [x] Validação implementada
- [x] Sincronização automática de campos legados
- [x] Salvamento no banco de dados
- [x] Interface condicional (apenas para profissionais)

## 🎉 Resultado

Agora o sistema diferencia corretamente cada categoria profissional através do número do conselho, permitindo:

- ✅ Identificação precisa do tipo de profissional
- ✅ Validação de registro profissional
- ✅ Diferenciação entre médicos, nutricionistas, psicólogos, etc.
- ✅ Compatibilidade com código legado (CRM/CRO)

