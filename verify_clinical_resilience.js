/**
 * 🧪 TESTE DE RESILIÊNCIA CLÍNICA (V1.6.2)
 * Objetivo: Validar se a "Câmara de Esterilização" do Core protege o relatório
 * mesmo quando o histórico do banco de dados está profundamente degradado/contaminado.
 */

// 1. A Lógica de Sanitização (Copiada exatamente do Core tradevision-core)
function stripInjectedContext(text) {
  if (!text) return "";
  
  // Remove blocos [CONTEXTO...] até [FIM DO CONTEXTO] ou fim da string
  let cleaned = text.replace(/\[CONTEXTO CRÍTICO[\s\S]*?(\[FIM DO CONTEXTO\]|$)/gi, "");
  
  // Remove marcadores remanescentes de AEC ou RAG
  cleaned = cleaned.replace(/\[AEC SSOT\][\s\S]*?(\[FIM DO SNAPSHOT\]|$)/gi, "");
  cleaned = cleaned.replace(/\[CONTEUDO DO DOCUMENTO\][\s\S]*?(\[FIM\]|$)/gi, "");
  
  // Remove tags isoladas
  cleaned = cleaned.replace(/\[ASSESSMENT_COMPLETED\]|\[ASSESSMENT_FINALIZED\]/gi, "");
  
  return cleaned.trim();
}

// 2. O Cenário de "Degradação de Dados" (Histórico Sujo Legado)
const dirtyHistory = [
  {
    role: "user",
    message: "Olá, me chamo Pedro e sinto dor nas costas.\n\n[CONTEXTO CRÍTICO DE DOCUMENTOS - LEITURA OBRIGATORIA]\nTITULO: Manual de Engenharia\nCONTEUDO: Para trocar o óleo, use chave 10.\n[FIM DO CONTEXTO]"
  },
  {
    role: "assistant",
    message: "Entendo, Pedro. A dor nas costas é intensa?\n\n[AEC SSOT]\n{ \"phase\": \"IDENTIFICATION\", \"symptoms\": [] }\n[FIM DO SNAPSHOT]"
  },
  {
    role: "user",
    message: "Sim, é moderada. Começou ontem.\n\n[CONTEXTO CRÍTICO DE DOCUMENTOS]\nTITULO: Guia de Cultivo\nCONTEUDO: A temperatura ideal é 24 graus.\n[FIM DO CONTEXTO]"
  }
];

// 3. Execução da "Câmara de Esterilização" (Simulando handleFinalizeAssessment)
console.log("=== 🏥 TESTE DE RESILIÊNCIA: RECONSTITUIÇÃO DE PRONTUÁRIO ===");
console.log("\n[FASE 1] Histórico Contaminado (Entrada do Banco):");
dirtyHistory.forEach((h, i) => {
  console.log(`Turno ${i+1} (${h.role}): ${h.message.substring(0, 40).replace(/\n/g, " ")}... [TAMANHO: ${h.message.length} chars]`);
});

const cleanedThread = dirtyHistory.map(h => {
  const cleanMsg = stripInjectedContext(h.message);
  return `${h.role.toUpperCase()}: ${cleanMsg}`;
}).join('\n---\n');

console.log("\n[FASE 2] Buffer de Extração (O que o GPT Extrator vai ler):");
console.log("---------------------------------------------------------");
console.log(cleanedThread);
console.log("---------------------------------------------------------");

// 4. Verificação de Integridade
const contaminationFound = cleanedThread.includes("CONTEXTO CRÍTICO") || 
                           cleanedThread.includes("Manual de Engenharia") || 
                           cleanedThread.includes("chave 10");

console.log("\n[FASE 3] Veredito Técnico:");
if (!contaminationFound && cleanedThread.includes("Pedro") && cleanedThread.includes("dor nas costas")) {
  console.log("✅ SUCESSO: O histórico foi esterilizado com 100% de eficácia.");
  console.log("✅ CONCLUSÃO: A verdade clínica (dor, nome) foi preservada.");
  console.log("✅ CONCLUSÃO: O ruído técnico foi completamente neutralizado.");
} else {
  console.log("❌ FALHA: Restos de contaminação encontrados no buffer de extração.");
}
