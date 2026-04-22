# 📓 Diário 22/04/2026 — Renderer Rico Soberano + Ações no Relatório

## Contexto
Após a auditoria do Profile e Score Pipeline (ver `DIARIO_22_04_2026_AUDITORIA_PROFILE_E_SCORES.md`),
o Pedro identificou que o modal de revisão de relatório no Dashboard do Paciente (`PatientAnalytics`)
estava simplificado (texto puro), enquanto a tela de `ClinicalReports` mantinha o renderer rico
com bordas verticais coloridas, ícones ▲/▼, e seções por etapa AEC.

> **Decisão de Pedro (registrada como regra imutável):**
> O modo visual da foto (renderer rico em ClinicalReports) é **MASTER e SOBERANO**.
> Pode apenas ser **melhorado**, **nunca quebrado ou simplificado**.

## Mudanças Implementadas

### 1. Componente reutilizável `RichClinicalReportView`
- **Arquivo novo:** `src/components/RichClinicalReportView.tsx`
- Extraído da estética soberana de `ClinicalReports.tsx` (linhas 1056-1263).
- Renderiza, na ordem AEC canônica:
  1. Queixa Principal (verde)
  2. Lista Indiciária (azul, com tags de intensidade)
  3. Desenvolvimento da Queixa (roxo, com ▲ Melhora / ▼ Piora)
  4. História / Anamnese legada (âmbar)
  5. História Patológica Pregressa (laranja)
  6. História Familiar — materno + paterno (rosa)
  7. Hábitos de Vida (teal)
  8. Perguntas Objetivas (ciano)
  9. Consenso (índigo)
  10. **Avaliação** (âmbar) — restaurada
  11. **Plano** (verde) — restaurado
- Usa `unwrapAecContent` (agora exportado) para suportar tanto o formato legado quanto o
  Pipeline Master v2 (`content.raw.content.*`).
- Estado vazio padronizado com `AlertCircle` âmbar.

### 2. Exportação de `unwrapAecContent`
- **Arquivo:** `src/lib/clinicalScoreCalculator.ts`
- Função promovida de `function` interna para `export function`, permitindo que o renderer
  rico desempacote a estrutura nested em runtime sem duplicar lógica.

### 3. Modal unificado em `PatientAnalytics.tsx`
- Modal substituído pelo `RichClinicalReportView` (mesmo visual da foto soberana).
- Largura aumentada de `max-w-2xl` → `max-w-3xl` para acomodar a densidade rica.
- Footer com **5 ações** (4 + Fechar):
  - **Copiar** (texto plano).
  - **Baixar** (`.txt` estruturado, gerado via Blob).
  - **WhatsApp** (deep link `https://wa.me/?text=...` — só para visão paciente).
  - **Enviar para Médico** (reabre o seletor `showDoctorSelect` existente — só para visão paciente).
  - **Fechar**.
- Modo profissional (`isProfessionalView`) oculta WhatsApp e Enviar para Médico (mantém Copiar/Baixar/Fechar).

### 4. Avaliação e Plano explicitamente renderizados
- Antes: ausentes no modal do Dashboard.
- Agora: blocos finais sempre renderizados quando o backend mapeou esses campos (`content.assessment` / `content.plan`).

## Arquivos Editados
- `src/lib/clinicalScoreCalculator.ts` — exportou `unwrapAecContent`
- `src/components/RichClinicalReportView.tsx` — **NOVO**
- `src/components/PatientAnalytics.tsx` — imports + modal substituído + ações

## Validação
- `npx tsc --noEmit` → sem erros nos arquivos editados.
- Compatibilidade preservada: `getAecReportModalPayload` continua sendo usado no card de
  histórico (linha 816) e no `handleCopyReport`, garantindo que **nada foi quebrado**.
- Score pipeline (auditoria anterior) continua funcionando — `enrichReportWithScores` usa o
  mesmo `unwrapAecContent`.

## Auditoria Pós-Implementação
- ✅ Modal antigo (texto puro) removido — substituído sem perder nenhuma seção.
- ✅ Renderer rico agora é **única fonte visual** (ClinicalReports.tsx pode ser refatorado
  no futuro para também usar o componente, eliminando duplicação).
- ✅ Ações (Baixar/WhatsApp/Médico) respeitam `isProfessionalView`.
- ✅ Avaliação e Plano restaurados.
- ✅ `unwrapAecContent` lida com 3 formatos: top-level, `raw.content`, `raw`.
- ✅ Sem novos warnings TypeScript.

## Próximos passos sugeridos (não executados)
1. Refatorar `ClinicalReports.tsx` para também usar `RichClinicalReportView` (DRY).
2. Adicionar export PDF (jsPDF) ao botão Baixar como variante.
3. Pré-selecionar médico vinculado quando o paciente clica "Enviar para Médico".
