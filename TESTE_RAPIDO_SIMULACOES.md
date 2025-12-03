# ⚡ Teste Rápido - Sistema de Simulações

## 🚀 Passo a Passo Rápido

### 1. Iniciar Servidor
```bash
npm run dev
```

### 2. Acessar Dashboard do Aluno
- URL: `http://localhost:5173/app/ensino/aluno/dashboard`
- Ou: `http://localhost:5173/app/aluno-dashboard`

### 3. Ir para Aba "Simulações"
- Clique na aba "Simulações" no dashboard

### 4. Selecionar e Iniciar
- **Sistema:** Qualquer (ex: Sistema Respiratório)
- **Tipo:** Entrevista Clínica Geral
- **Clicar:** "Iniciar Simulação de Paciente"

### 5. Verificar Resposta Inicial
**Esperado:**
```
Olá doutor. Me chamo Paciente Simulado, tenho 45 anos. Estou sentindo Dor há alguns dias.
```

### 6. Fazer Perguntas
- "Onde você sente a dor?"
- "Quando começou?"
- "Como é a dor?"

**Esperado:** IA responde como **paciente**, não como Nôa

### 7. Finalizar
- Digite: "Finalizar entrevista"

**Esperado:** Feedback estruturado com pontuação AEC

## ✅ Checklist Rápido

- [ ] Chat abre automaticamente
- [ ] Mensagem inicial vem como "paciente"
- [ ] IA responde como paciente durante entrevista
- [ ] Finalizar funciona
- [ ] Feedback é gerado

## 🐛 Se Algo Der Errado

1. **Abrir Console do Navegador** (F12)
2. **Verificar logs:**
   - Procure por: `🎭 Simulação de paciente iniciada`
   - Procure por erros em vermelho
3. **Verificar se mensagem contém:** "Vou iniciar uma simulação"

## 📝 Comandos para Testar

### Comando 1: Iniciar Simulação
```
Vou iniciar uma simulação de paciente com questão no Sistema Respiratório. Você será o profissional de saúde e eu serei o paciente. Faça a entrevista clínica usando a metodologia Arte da Entrevista Clínica. Ao final da entrevista, vou avaliar sua performance de acordo com os critérios da AEC. Vamos começar?
```

### Comando 2: Finalizar
```
Finalizar entrevista
```

