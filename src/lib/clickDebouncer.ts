/**
 * V1.9.140-C — Click debouncer estritamente local.
 *
 * Aplicação: anti-clique-duplo em botões críticos (Solicitar Videochamada).
 * Sem state global, sem sync com banco, sem state machine.
 * Apenas timestamp em memória do componente que usa.
 *
 * Uso:
 *   const debouncer = useRef(createClickDebouncer(2000)).current
 *   const onClick = () => {
 *     if (!debouncer()) return  // ignora se clicou < 2s atrás
 *     ...
 *   }
 */
export function createClickDebouncer(delayMs: number = 2000) {
  let lastClick = 0
  return (): boolean => {
    const now = Date.now()
    if (now - lastClick < delayMs) return false
    lastClick = now
    return true
  }
}
