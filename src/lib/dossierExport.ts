/**
 * dossierExport — geração de PDF do dossiê de pesquisa Nôa Matrix.
 *
 * V1.9.390 (F3-A.1 Sprint 2 — 20/05/2026): primeira versão ultra-mínima.
 * Cliente-side puro, sem schema banco, sem persistência. Médico clica
 * "Fechar como dossiê" → HTML renderizado → window.print() → PDF.
 *
 * Princípio "polir não inventar":
 *  - reusa messages já em state do ResearchChat
 *  - reusa cards selecionados (já em selectedIds Set do NoaMatrixView)
 *  - reusa attachedPubmed array já em state do NoaMatrixView
 *  - reusa patientName + patientPseudonym já em usePatientLongitudinal
 *  - window.print() do browser (sem dependência jsPDF/puppeteer)
 *
 * Memory: project_visao_final_eixo_pesquisa_19_05 (F3 = fechar dossiê).
 * Pedro 20/05 ~14h30 BRT: validar empíricamente se médico clica.
 *
 * Roadmap parqueado:
 *  - V1.9.390-A → F3-A.2 persistência (schema physician_research_dossiers + RLS)
 *  - V1.9.391 → F4 fórum publicação (depende Ricardo + 3 bloqueios)
 *  - V1.9.392 → F3-C draft tese/artigo
 */

export interface DossierMessage {
  id: string
  role: 'user' | 'noa-matrix'
  content: string
  timestamp: Date
  isFailsafe?: boolean
}

export interface DossierCard {
  id: string
  type: string
  title: string
  subtitle?: string
  body: string
  timestamp?: number
}

export interface DossierPubMedArticle {
  pmid: string
  title: string
  authors: string[]
  journal: string
  pubdate: string
  evidenceLevel?: string
  url: string
}

export interface DossierData {
  /** Nome real do médico (autor do dossiê) */
  physicianName: string
  /** Email do médico (rastreabilidade) */
  physicianEmail?: string
  /** Pseudônimo do paciente (LGPD-friendly). Ex: "#6ACF" */
  patientPseudonym?: string | null
  /** Cards selecionados pelo médico pra Matrix (relatórios, racionalidades, etc.) */
  selectedCards: DossierCard[]
  /** Papers PubMed anexados na sessão */
  attachedPapers: DossierPubMedArticle[]
  /** Mensagens da sessão Matrix */
  messages: DossierMessage[]
  /** Data/hora da geração */
  generatedAt: Date
}

const escapeHtml = (s: string): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  } as any)[c])

const formatTimestamp = (d: Date): string =>
  d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatTime = (d: Date): string =>
  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const CATEGORY_LABEL: Record<string, string> = {
  'case': 'Caso Marcado',
  'note': 'Notas do Médico',
  'pinned-search': 'Busca Favoritada',
  'patient-report': 'Relatório Longitudinal',
  'patient-rationality': 'Racionalidade Aplicada',
  'pubmed-article': 'Paper PubMed',
  'kb-document': 'Documento da Base de Conhecimento',
}

/** V1.9.398 — máximo de caracteres do conteúdo de um doc da Base exibido no PDF.
 *  O texto completo (até 8k) vai pro contexto da Matrix e fica no snapshot jsonb;
 *  o PDF mostra só um trecho pra não virar parede de texto acadêmico.
 *  Condensar o PDF NÃO perde auditabilidade — o full text continua no jsonb. */
const KB_DOC_PREVIEW_CHARS = 600

/** Renderiza o corpo de um card do §1. Para 'kb-document' condensa o conteúdo
 *  (cabeçalho + trecho + nota); demais tipos mantêm o corpo completo. */
function renderCardBody(c: DossierCard): string {
  const toHtml = (s: string) => escapeHtml(s).replace(/\n/g, '<br>')
  if (c.type !== 'kb-document') return toHtml(c.body)
  const raw = String(c.body ?? '')
  const marker = 'Conteúdo:\n'
  const idx = raw.indexOf(marker)
  const head = idx >= 0 ? raw.slice(0, idx + marker.length) : ''
  const content = (idx >= 0 ? raw.slice(idx + marker.length) : raw).trim()
  if (content.length <= KB_DOC_PREVIEW_CHARS) return toHtml(head + content)
  const preview = content.slice(0, KB_DOC_PREVIEW_CHARS).trimEnd() + '…'
  const note = '\n\n— Trecho exibido. O documento foi usado como contexto da sessão; '
    + 'o texto completo está preservado no registro do dossiê.'
  return toHtml(head + preview + note)
}

/**
 * Gera HTML completo do dossiê pronto pra print/PDF.
 * Estrutura 4 seções: cabeçalho institucional, corpus marcado, literatura, reflexão Matrix.
 */
export function generateDossierHTML(data: DossierData): string {
  const {
    physicianName,
    physicianEmail,
    patientPseudonym,
    selectedCards,
    attachedPapers,
    messages,
    generatedAt,
  } = data

  const dateLong = generatedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = formatTime(generatedAt)
  const patientLabel = patientPseudonym ? `Paciente #${patientPseudonym}` : 'Múltiplos casos'

  // §1. Casos e racionalidades marcadas (excluindo papers, que vão em §2)
  const corpusCards = selectedCards.filter((c) => c.type !== 'pubmed-article')
  const corpusBlock = corpusCards.length > 0
    ? corpusCards.map((c) => `
      <div class="card">
        <div class="card-header">
          <span class="card-type">${escapeHtml(CATEGORY_LABEL[c.type] || c.type)}</span>
          ${c.subtitle ? `<span class="card-subtitle">${escapeHtml(c.subtitle)}</span>` : ''}
        </div>
        <div class="card-title">${escapeHtml(c.title)}</div>
        <div class="card-body">${renderCardBody(c)}</div>
      </div>
    `).join('')
    : '<p class="empty">Nenhum item marcado nesta sessão.</p>'

  // §2. Literatura anexada (papers PubMed)
  const papersBlock = attachedPapers.length > 0
    ? attachedPapers.map((p) => {
        const authorsShort = p.authors.slice(0, 3).join(', ') + (p.authors.length > 3 ? ' et al.' : '')
        return `
          <div class="paper">
            <div class="paper-header">
              <span class="paper-pmid">PMID ${escapeHtml(p.pmid)}</span>
              ${p.evidenceLevel ? `<span class="paper-evidence">${escapeHtml(p.evidenceLevel)}</span>` : ''}
            </div>
            <div class="paper-title">${escapeHtml(p.title)}</div>
            <div class="paper-meta">${escapeHtml(authorsShort)} · ${escapeHtml(p.journal)} · ${escapeHtml(p.pubdate)}</div>
            <a class="paper-link" href="${escapeHtml(p.url)}" target="_blank">${escapeHtml(p.url)}</a>
          </div>
        `
      }).join('')
    : '<p class="empty">Nenhum paper anexado nesta sessão.</p>'

  // §3. Reflexão estruturada (conversa Matrix)
  const reflectionBlock = messages.length > 0
    ? messages.map((m) => {
        const speaker = m.role === 'user' ? physicianName : 'Nôa Matrix'
        const roleClass = m.role === 'user' ? 'msg-user' : 'msg-matrix'
        return `
          <div class="msg ${roleClass}">
            <div class="msg-header">
              <strong>${escapeHtml(speaker)}</strong>
              <span class="msg-time">${formatTime(m.timestamp)}</span>
            </div>
            <div class="msg-body">${escapeHtml(m.content).replace(/\n/g, '<br>')}</div>
          </div>
        `
      }).join('')
    : '<p class="empty">Nenhuma conversa ainda nesta sessão.</p>'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Dossiê de Pesquisa Nôa Matrix — ${escapeHtml(physicianName)} — ${escapeHtml(dateLong)}</title>
<style>
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1a1a1a;
  line-height: 1.55;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  font-size: 11px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 3px solid #00C16A;
  padding-bottom: 14px;
  margin-bottom: 20px;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-mark {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #00C16A 0%, #6b21a8 100%);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 22px;
  border-radius: 8px;
  letter-spacing: -1px;
}
.brand-text h1 { margin: 0; font-size: 16px; color: #00C16A; letter-spacing: -0.3px; }
.brand-text p { margin: 2px 0 0 0; font-size: 9px; color: #666; letter-spacing: 0.3px; text-transform: uppercase; }
.meta { text-align: right; font-size: 10px; color: #555; line-height: 1.5; }
.meta strong { color: #1a1a1a; }

h2 {
  font-size: 13px;
  color: #00C16A;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
  margin-top: 22px;
  margin-bottom: 12px;
  letter-spacing: 0.2px;
  text-transform: uppercase;
}

.card {
  background: #f9faf9;
  border-left: 3px solid #00C16A;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
}
.card-header {
  display: flex; gap: 8px; align-items: center;
  font-size: 9px;
  margin-bottom: 4px;
  color: #555;
}
.card-type {
  background: #00C16A; color: white;
  padding: 1px 6px; border-radius: 3px;
  font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px;
}
.card-subtitle { color: #888; font-size: 9px; }
.card-title { font-weight: 600; font-size: 11px; margin-bottom: 3px; color: #1a1a1a; }
.card-body { font-size: 10px; color: #444; line-height: 1.5; }

.paper {
  background: #f5f9f6;
  border: 1px solid #d4e8dc;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
}
.paper-header {
  display: flex; gap: 8px;
  font-size: 9px;
  margin-bottom: 4px;
}
.paper-pmid {
  background: #6b21a8; color: white;
  padding: 1px 6px; border-radius: 3px;
  font-weight: 600; font-family: monospace;
}
.paper-evidence {
  background: #fef3c7; color: #92400e;
  padding: 1px 6px; border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase; font-size: 8px;
}
.paper-title { font-weight: 600; font-size: 11px; margin-bottom: 3px; }
.paper-meta { font-size: 9px; color: #666; margin-bottom: 4px; }
.paper-link { font-size: 9px; color: #6b21a8; text-decoration: none; word-break: break-all; }

.msg {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
}
.msg-user { background: #e8f4fd; border-left: 3px solid #2563eb; }
.msg-matrix { background: #f0e6f7; border-left: 3px solid #6b21a8; }
.msg-header {
  display: flex; justify-content: space-between;
  font-size: 10px;
  margin-bottom: 4px;
}
.msg-header strong { color: #1a1a1a; }
.msg-time { color: #888; font-size: 9px; }
.msg-body { font-size: 10.5px; color: #1a1a1a; line-height: 1.55; }

.empty {
  color: #999; font-style: italic; font-size: 10px;
  padding: 8px 10px;
}

/* V1.9.399 — nota declarativa sob o título de seção (tom Z2 estrutural) */
.section-note {
  color: #888; font-style: italic; font-size: 9px;
  margin: -4px 0 12px 2px;
  line-height: 1.5;
}

.footer {
  margin-top: 28px;
  border-top: 2px solid #00C16A;
  padding-top: 12px;
  font-size: 9px;
  color: #555;
  line-height: 1.6;
}
.footer .legal {
  font-style: italic;
  color: #888;
  margin-top: 6px;
  font-size: 8.5px;
  line-height: 1.5;
}

@media print {
  body { font-size: 10.5px; }
  .card, .paper, .msg { page-break-inside: avoid; }
}
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-mark">M</div>
      <div class="brand-text">
        <h1>Dossiê de Pesquisa Nôa Matrix</h1>
        <p>MedCannLab Research · Chat Z2 estrutural · não-diretivo</p>
      </div>
    </div>
    <div class="meta">
      <div><strong>Médico:</strong> ${escapeHtml(physicianName)}</div>
      ${physicianEmail ? `<div>${escapeHtml(physicianEmail)}</div>` : ''}
      <div><strong>Objeto:</strong> ${escapeHtml(patientLabel)}</div>
      <div><strong>Gerado em:</strong> ${escapeHtml(formatTimestamp(generatedAt))} BRT</div>
    </div>
  </div>

  <h2>§1. Corpus marcado — Casos, Racionalidades e Documentos</h2>
  <p class="section-note">Material que o médico marcou como contexto da sessão. Nem todo item é necessariamente invocado na reflexão da §3.</p>
  ${corpusBlock}

  <h2>§2. Literatura anexada — PubMed</h2>
  ${papersBlock}

  <h2>§3. Reflexão estruturada — Conversa Nôa Matrix</h2>
  ${reflectionBlock}

  <div class="footer">
    <div>
      <strong>Dossiê de pesquisa estruturada gerado pela Nôa Matrix (Z2 não-diretiva).</strong>
      Este documento organiza reflexão clínica do médico autor sobre corpus marcado e literatura
      anexada. Não constitui diagnóstico, prescrição, conduta ou recomendação terapêutica.
      Interpretação clínica e decisões médicas são responsabilidade exclusiva do médico autor.
    </div>
    <div class="legal">
      Plataforma MedCannLab 3.0 · Sistema cognitivo Z2 (estrutural não-decisional) ·
      Identificação de paciente pseudonimizada (LGPD art. 12) ·
      PDF gerado localmente pelo navegador; o snapshot do dossiê é persistido com
      acesso restrito ao médico autor (RLS).
    </div>
  </div>
</body>
</html>`
}

/**
 * Abre janela print do navegador com o HTML do dossiê.
 * Usuário decide salvar como PDF, imprimir, cancelar etc.
 */
export function exportDossierToPDF(data: DossierData): void {
  const html = generateDossierHTML(data)
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) {
    // Popup blocked — fallback download como HTML
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dossie-noa-matrix-${data.generatedAt.toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  // Aguarda render antes de chamar print
  w.onload = () => {
    setTimeout(() => {
      try { w.print() } catch { /* user pode cancelar */ }
    }, 400)
  }
}
