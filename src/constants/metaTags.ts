/**
 * Meta-Tags utilizadas para comunicação assíncrona blindada entre a IA (LLM)
 * e o Backend/Edge Functions, permitindo gatilhos sem quebrar parses JSON.
 */
export const META_TAGS = {
  /** Tag crítica que sinaliza sucesso e aciona a Extração SOAP na Edge Function */
  ASSESSMENT_COMPLETED: '[ASSESSMENT_COMPLETED]',
  
  /** Tag que alerta o sistema que houve um encerramento, porém não natural ou incompleto */
  ASSESSMENT_FINALIZED: '[ASSESSMENT_FINALIZED]',

  /** Comando de injeção que dita o fim da sessão de roteamento */
  FINALIZE_SESSION: '[FINALIZE_SESSION]'
};

export function hasAssessmentCompleted(text: string): boolean {
  if (!text) return false;
  return text.includes(META_TAGS.ASSESSMENT_COMPLETED) || text.includes(META_TAGS.ASSESSMENT_FINALIZED);
}

export function stripClinicalTags(text: string): string {
  if (!text) return '';
  return text
    .replace(META_TAGS.ASSESSMENT_COMPLETED, '')
    .replace(META_TAGS.ASSESSMENT_FINALIZED, '')
    .replace(META_TAGS.FINALIZE_SESSION, '')
    .trim();
}
