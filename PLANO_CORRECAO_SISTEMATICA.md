# 🔧 PLANO DE CORREÇÃO SISTEMÁTICA - MEDCANLAB 3.0

## 🎯 OBJETIVO
Corrigir UMA funcionalidade por vez até funcionar 100%, eliminando "engenhocas" que geram expectativa e frustração.

---

## 📋 PRIORIZAÇÃO (DO MAIS CRÍTICO PARA O MENOS CRÍTICO)

### **🔥 PRIORIDADE 1 - FUNCIONALIDADES CRÍTICAS QUE DEVEM FUNCIONAR AGORA**

#### **1. Chat Clínico** ⚠️ **CRÍTICO**
**Problemas identificados:**
- ❌ Não mostra TODOS os pacientes (só os que têm sala)
- ❌ Salvamento automático como evolução pode não estar funcionando
- ❌ Botão "Salvar conversa" pode não estar visível ou funcionando

**O que fazer:**
1. ✅ Garantir que TODOS os pacientes apareçam (mesmo sem sala)
2. ✅ Criar sala automaticamente ao clicar em paciente sem sala
3. ✅ Testar salvamento automático de conversas como evolução
4. ✅ Verificar se botão de salvar está visível e funcionando
5. ✅ Testar integração completa: chat → evolução → aparecer na lista

**Status:** 🟡 EM CORREÇÃO

---

#### **2. Agendamento - IA Residente** ⚠️ **CRÍTICO**
**Problemas identificados:**
- ❌ IA promete "vou retornar com horários" mas não retorna
- ❌ IA não redireciona corretamente para página de agendamento
- ❌ Resposta genérica ao invés de ação concreta

**O que fazer:**
1. ✅ Corrigir `processAppointmentRequest` para redirecionar corretamente
2. ✅ IA deve informar horários E redirecionar imediatamente
3. ✅ Não prometer o que não vai fazer
4. ✅ Testar fluxo completo: paciente pergunta → IA redireciona → página funciona

**Status:** 🟡 EM CORREÇÃO (case 'appointment' adicionado ao switch)

---

#### **3. Agendamento - Página** ⚠️ **CRÍTICO**
**Problemas identificados:**
- ❓ Página existe mas não sabemos se salvamento funciona
- ❓ Validações podem não estar funcionando
- ❓ Notificações podem não estar sendo enviadas

**O que fazer:**
1. ✅ Testar salvamento completo de agendamento
2. ✅ Verificar validações (horários, datas, profissionais)
3. ✅ Testar criação de registro no banco
4. ✅ Verificar se aparece na lista de agendamentos

**Status:** 🔴 PRECISA TESTAR

---

#### **4. Evoluções Clínicas** ⚠️ **CRÍTICO**
**Problemas identificados:**
- ❌ Botão "Nova Evolução" funciona mas pode não aparecer imediatamente na lista
- ❌ Integração com chat pode não estar salvando automaticamente
- ❌ Evoluções podem não aparecer após salvar

**O que fazer:**
1. ✅ Testar salvamento completo
2. ✅ Verificar se aparece na lista imediatamente após salvar
3. ✅ Testar integração chat → evolução automática
4. ✅ Verificar RLS não está bloqueando

**Status:** 🟡 PARCIALMENTE FUNCIONAL

---

### **🟡 PRIORIDADE 2 - FUNCIONALIDADES IMPORTANTES**

#### **5. IA Residente - Respostas Gerais**
- ❌ Não segue todas as instruções
- ❌ Promete coisas que não cumpre
- ⚠️ Microfone tem problemas

#### **6. Biblioteca - Visualizar Documentos**
- ❌ Botão "Visualizar" não funciona para todos tipos
- ❓ URLs podem estar incorretas

#### **7. Cursos - Edição de Aulas**
- ✅ Aulas abrem (`LessonDetail`)
- ❓ Edição e salvamento funcionam?

---

### **🟢 PRIORIDADE 3 - FUNCIONALIDADES SECUNDÁRIAS**

#### **8. Fórum**
- ✅ Navegação funciona
- ❓ Criação de posts funciona?

#### **9. Mentoria**
- ✅ Modal existe
- ❓ Salvamento funciona?

---

## 🚀 PLANO DE AÇÃO IMEDIATO

### **FASE 1: CORRIGIR CHAT CLÍNICO (HOJE)**
1. ✅ Verificar se todos pacientes aparecem
2. ✅ Testar criação automática de salas
3. ✅ Testar salvamento como evolução
4. ✅ Verificar se evoluções aparecem na lista

### **FASE 2: CORRIGIR AGENDAMENTO (HOJE)**
1. ✅ Corrigir IA para redirecionar corretamente
2. ✅ Testar página de agendamento completa
3. ✅ Verificar salvamento no banco

### **FASE 3: TESTAR E CORRIGIR EVOLUÇÕES (HOJE)**
1. ✅ Testar salvamento manual
2. ✅ Testar salvamento automático do chat
3. ✅ Verificar aparecimento na lista

---

## ✅ CHECKLIST DE VALIDAÇÃO

Para cada funcionalidade, verificar:
- [ ] Interface renderiza corretamente
- [ ] Botões/cliques funcionam
- [ ] Dados são salvos no banco
- [ ] Dados aparecem após salvar
- [ ] Erros são tratados adequadamente
- [ ] Feedback visual funciona
- [ ] RLS não está bloqueando

---

## 🎯 META FINAL

**Todas as funcionalidades críticas funcionando 100% até o final do dia.**

**Quer que eu comece corrigindo o Chat Clínico primeiro?**

