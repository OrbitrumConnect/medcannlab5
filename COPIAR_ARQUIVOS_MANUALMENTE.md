# 📋 COPIAR ARQUIVOS DA VERSÃO ATUALIZADA - INSTRUÇÕES

## 🎯 **OBJETIVO**

Copiar arquivos da versão mais atualizada (`c:\Med-Cann-Lab-3.0-main`) para o repositório atual, preservando os arquivos novos que criamos.

---

## ✅ **ARQUIVOS A PRESERVAR (NÃO COPIAR)**

Estes arquivos são NOVOS e devem ser mantidos:
- ✅ `IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql` - SQL completo que criamos
- ✅ `PLANO_IMPLEMENTACAO_IMRE_5.0.md` - Plano de implementação
- ✅ `EXECUTAR_IMRE_AGORA.md` - Guia de execução
- ✅ `PANORAMA_COMPLETO_APP_19_11_2025.md` - Panorama completo
- ✅ `RESUMO_ATUALIZACAO_19_11_2025.md` - Resumo de atualização
- ✅ `LIMPAR_CACHE_NAVEGADOR.md` - Guia de cache
- ✅ `COMPARACAO_VERSOES_ANALISE.md` - Análise comparativa

---

## 📁 **ARQUIVOS A COPIAR**

### **Opção 1: Copiar Tudo (Recomendado)**

1. Abra o Windows Explorer
2. Navegue até: `c:\Med-Cann-Lab-3.0-main`
3. Selecione TODOS os arquivos e pastas (Ctrl+A)
4. Exclua da seleção:
   - `node_modules` (se houver)
   - `.git` (se houver)
   - Os arquivos listados acima (para preservar)
5. Copie (Ctrl+C)
6. Vá para: `C:\Users\phpg6\OneDrive\Área de Trabalho\MedCannLabFinal`
7. Cole e substitua (Ctrl+V → Substituir todos)

### **Opção 2: Copiar Pastas Específicas**

Copiar estas pastas da versão atualizada:
- ✅ `src/` - Código fonte completo
- ✅ `public/` - Arquivos públicos
- ✅ `database/` - Scripts de banco
- ✅ `docs/` - Documentação
- ✅ `scripts/` - Scripts auxiliares
- ✅ `assistant_documents/` - Documentos do assistente

### **Opção 3: Usar Git (Recomendado para Desenvolvedores)**

```bash
# Adicionar remote da versão atualizada
git remote add noaesperanza https://github.com/noaesperanza/Med-Cann-Lab-3.0.git

# Fazer fetch
git fetch noaesperanza

# Ver diferenças
git diff main noaesperanza/main

# Mesclar (se necessário)
git merge noaesperanza/main --no-commit
```

---

## 🔍 **VERIFICAÇÃO APÓS CÓPIA**

Após copiar, verifique:

1. ✅ Arquivos novos preservados (listados acima)
2. ✅ `src/` atualizado
3. ✅ `package.json` atualizado (se houver diferenças)
4. ✅ `vite.config.ts` mantém porta 3000
5. ✅ `index.html` mantém meta tags anti-cache

---

## ⚠️ **ATENÇÃO**

- **NÃO** sobrescreva os arquivos novos que criamos
- **VERIFIQUE** se há conflitos antes de substituir
- **FAÇA BACKUP** se necessário

---

## 🚀 **APÓS COPIAR**

1. Verificar se tudo está funcionando
2. Testar o app (`npm run dev`)
3. Fazer commit das atualizações
4. Push para os repositórios

---

**Status**: ⏳ Aguardando cópia manual ou confirmação

