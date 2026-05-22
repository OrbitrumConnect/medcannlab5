---
name: feedback_encryption_fallback_dev_em_producao_21_05
description: "encryption.ts usa fallback hardcoded 'default_secure_key_for_dev_only_32B' se VITE_ENCRYPTION_KEY não estiver no env. Débito condicional LGPD do chat médico-paciente — verificar o env do Vercel."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

`src/lib/encryption.ts:7` deriva a chave AES-256 de:
`import.meta.env.VITE_ENCRYPTION_KEY || 'default_secure_key_for_dev_only_32B'`.
O comentário logo acima (linha 5) diz *"In production, NEVER use a hardcoded fallback"* — mas o fallback está lá.

`VITE_ENCRYPTION_KEY` **não aparece em nenhum outro lugar do repo** (nem no `.env.example`). `encryptMessage`/`decryptMessage` são usados no chat médico-paciente (`useChatSystem.ts`).

**Risco 🟡 CONDICIONAL** — depende do env do Vercel (não visível no repo):
- Se `VITE_ENCRYPTION_KEY` está definida no Vercel → ok, falso alarme.
- Se NÃO está → o chat médico-paciente é cifrado com chave derivada de string pública (está no código). Cripto decorativa, não real. Categoria especial LGPD art. 11.

**Why:** achado por audit empírico 21/05 (Material B verificado por grep — o audit acertou). NÃO estava em nenhum diário/memory — é drift naturalizado real (diferente do Ricardo-UUID, que está documentado).

**How to apply:**
1. PRIMEIRO: verificar o env do Vercel (`VITE_ENCRYPTION_KEY`). Resolve a dúvida em 30 segundos — sem isso o resto é teórico.
2. Se não está definida: gerar chave forte, pôr no Vercel, declarar `VITE_ENCRYPTION_KEY=` (sem valor real) no `.env.example`.
3. `decryptMessage` é backward-compat (3 formatos: AES novo / ENC legacy base64 / plaintext). Trocar a chave quebra a leitura de mensagens cifradas com a chave antiga — hoje pré-PMF, volume ~zero, troca é barata; depois exige migração.
4. Trigger de fix obrigatório: 1º paciente externo OU auditoria LGPD.

Conecta com [[feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05]].
