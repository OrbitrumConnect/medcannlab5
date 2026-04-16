# 🛡️ PROTOCOLO TITÃ DE BLINDAGEM (SAFETY PROTOCOL)

**Versão:** 1.0 (Titan 3.2)  
**Objetivo:** Prevenir a erosão de código e exclusões acidentais causadas por IAs (AI Code Erosion).

---

## 1. O Escudo de Integridade (Type Check)
Toda alteração estrutural ou de tipos deve ser validada pelo compilador antes do commit.
- **Ação:** Execute `npx tsc --noEmit` ou `npm run lint`.
- **Regra:** Se o compilador reportar erros de "Missing Export" ou "Type Mismatch" em arquivos não relacionados (como o erro 500 de hoje), a IA **DEVE** reverter a limpeza excessiva e restaurar as pontes de compatibilidade.

## 2. O Escudo Cirúrgico (Atomic Refactoring)
Evite a reescrita total de arquivos grandes ( > 100 linhas).
- **Ação:** Priorize o uso de `replace_file_content` (chunks) em vez de `write_to_file`.
- **Regra:** A IA deve listar as funções que serão mantidas e garantir que a exclusão de "código morto" não quebre dependências invisíveis (ex: importações dinâmicas ou metadados).

## 3. O Escudo de Regressão (Manual/Auto Checks)
Antes de declarar o "Selamento", verifique as 3 Pontes de Identidade:
1. **Normalização**: `normalizeUserType` deve aceitar tanto PT quanto EN.
2. **Triggers**: O banco deve ter o gatilho `on_auth_user_created` ativo.
3. **Audit**: Logs de IA devem ser persistidos antes da resposta.

## 4. O Escudo de Contexto (Livro Magno)
Novas sessões de IA devem ser ancoradas no **Livro Magno** e nos **Diários de Bordo**.
- **Ação:** Informe à nova IA: *"Leia docs/LIVRO_MAGNUM_OPUS_UNIVERSAL_TITAN_3_1.md antes de alterar a governança de dados"*.

---

**Selo de Segurança:** 🛡️ **TITAN GRADE A**  
**Data de Ativação:** 28 de Março de 2026  
**Governança:** MedCannLab Backend Authority
