# 🧪 Teste do Modo Dev Vivo

## 📋 Checklist de Testes

### 1. Pré-requisitos
- [ ] SQL executado no Supabase (`CREATE_DEV_VIVO_TABLES.sql`)
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Backend rodando e acessível
- [ ] Usuário logado como admin com `flag_admin = true`

### 2. Teste de Ativação
```
Comando: "ativar dev vivo"
Esperado: ✅ Modo Dev Vivo ativado com sucesso!
Verificar: Sessão criada no banco (dev_vivo_sessions)
```

### 3. Teste de Diagnóstico
```
Comando: "mostrar diagnóstico"
Esperado: Informações do sistema (rota, componente, erros, etc.)
Verificar: Dados sendo coletados corretamente
```

### 4. Teste de Histórico
```
Comando: "histórico de mudanças"
Esperado: Lista de mudanças (pode estar vazia)
Verificar: Query ao banco funcionando
```

### 5. Teste de Rollback
```
Comando: "rollback última mudança"
Esperado: Confirmação ou mensagem de "nenhuma mudança"
Verificar: Rollback funcionando (se houver mudanças)
```

### 6. Teste de Desativação
```
Comando: "desativar dev vivo"
Esperado: ✅ Modo Dev Vivo desativado com sucesso!
Verificar: Sessão marcada como inativa no banco
```

---

## 🔍 Verificações no Banco

```sql
-- Ver sessões
SELECT * FROM dev_vivo_sessions ORDER BY created_at DESC LIMIT 5;

-- Ver mudanças
SELECT * FROM dev_vivo_changes ORDER BY created_at DESC LIMIT 10;

-- Ver auditoria
SELECT * FROM dev_vivo_audit ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### Erro: "Acesso negado"
- Verificar se usuário tem `flag_admin = true`
- Verificar se tipo é 'admin'

### Erro: "Sessão não ativa"
- Ativar modo dev vivo primeiro
- Verificar se sessão não expirou

### Erro: "Token não disponível"
- Fazer login novamente
- Verificar autenticação Supabase

