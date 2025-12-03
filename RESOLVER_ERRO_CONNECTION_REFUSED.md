# 🔧 RESOLVER ERRO: ERR_CONNECTION_REFUSED
## MedCannLab 3.0

---

## ❌ **ERRO**

```
ERR_CONNECTION_REFUSED
A conexão com localhost foi recusada.
```

---

## ✅ **SOLUÇÃO: INICIAR SERVIDOR**

O servidor de desenvolvimento não está rodando. Siga estes passos:

---

## 🚀 **PASSO A PASSO**

### **1. Abrir Terminal** (1 min)

1. No VS Code, pressione: `Ctrl + '` (abre terminal)
2. Ou: Menu → Terminal → New Terminal

### **2. Navegar para o Projeto** (se necessário)

```bash
cd "C:\Users\Ricardo_Valenca\Nova Noa\medcanlab3.0"
```

### **3. Iniciar Servidor** (2-3 min)

```bash
npm run dev
```

**Aguarde até ver:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## ✅ **VERIFICAR**

### **URL Correta:**
- ✅ **http://localhost:3000** ← Use esta URL!
- ❌ Não use: `localhost:5173` (porta padrão do Vite)
- ✅ Porta configurada: **3000** (ver `vite.config.ts`)

---

## 🐛 **SE AINDA DER ERRO**

### **Erro: "port 3000 already in use"**

**Solução 1:** Matar processo na porta 3000
```bash
# Windows PowerShell
netstat -ano | findstr :3000
# Anote o PID (última coluna)
taskkill /PID <PID> /F
```

**Solução 2:** Usar outra porta
```bash
npm run dev -- --port 3001
```

### **Erro: "Cannot find module"**

**Solução:** Instalar dependências
```bash
npm install
```

### **Erro: "EADDRINUSE"**

**Solução:** Porta já está em uso
- Feche outros servidores
- Ou use outra porta (ver acima)

---

## 📋 **CHECKLIST**

- [ ] Terminal aberto
- [ ] Navegou para o diretório do projeto
- [ ] Executou `npm run dev`
- [ ] Viu mensagem "ready in xxx ms"
- [ ] Acessou: **http://localhost:3000**
- [ ] Servidor está rodando

---

## 🎯 **PRÓXIMOS PASSOS**

Após o servidor iniciar:

1. ✅ Acesse: **http://localhost:3000**
2. ✅ Verifique login/cadastro
3. ✅ Teste conexão com Supabase
4. ✅ Execute script SQL no Supabase (se ainda não executou)

---

## 📊 **RESUMO**

```
1. Abrir terminal (Ctrl + ')
   ↓
2. Executar: npm run dev
   ↓
3. Aguardar: "ready in xxx ms"
   ↓
4. Acessar: http://localhost:3000
   ↓
✅ SUCESSO!
```

---

**Status:** 🟡 **Servidor não está rodando. Execute `npm run dev` no terminal!**

**URL Correta:** **http://localhost:3000**

