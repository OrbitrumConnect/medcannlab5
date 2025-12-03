# 📰 Guia de Gestão de Notícias - MedCannLab 3.0

## 🎯 Visão Geral

Sistema completo de gestão de notícias para a plataforma MedCannLab, permitindo criar, editar e publicar notícias sobre Cannabis Medicinal, Pesquisa Clínica, Metodologia AEC e outros temas relevantes.

---

## 🚀 Como Acessar

### Rota de Produção
**URL**: `/app/admin/news`

**Acesso**: Apenas administradores e profissionais autorizados

**Navegação**:
1. Faça login como admin ou profissional
2. Acesse o dashboard administrativo
3. Navegue até "Gestão de Notícias" ou acesse diretamente: `/app/admin/news`

---

## 📋 Funcionalidades

### 1. **Criar Nova Notícia**
- Clique em "Nova Notícia"
- Preencha os campos obrigatórios:
  - Título
  - Resumo
  - Categoria
  - Autor
  - Data
- Campos opcionais:
  - Conteúdo completo
  - Tempo de leitura
  - Impacto (Alto, Médio, Baixo)
  - URL da imagem
  - Tags
  - Fonte
  - URL externa

### 2. **Editar Notícia**
- Clique no ícone de edição (lápis) na notícia desejada
- Modifique os campos necessários
- Salve as alterações

### 3. **Publicar/Rascunho**
- Selecione "Publicado" para tornar a notícia visível
- Selecione "Rascunho" para manter privada

### 4. **Filtrar por Categoria**
- Use os filtros no topo para visualizar notícias por categoria:
  - Todas
  - Cannabis Medicinal
  - Pesquisa Clínica
  - Metodologia AEC
  - Regulamentação
  - Nefrologia
  - Clínica
  - Pesquisa
  - Farmacologia

### 5. **Excluir Notícia**
- Clique no ícone de lixeira
- Confirme a exclusão

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Criar a Tabela

Execute o script SQL em `database/CREATE_NEWS_ITEMS_TABLE.sql` no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `CREATE_NEWS_ITEMS_TABLE.sql`
4. Execute o script

### Passo 2: Verificar Permissões

O script já configura:
- ✅ Row Level Security (RLS)
- ✅ Políticas de acesso
- ✅ Índices para performance
- ✅ Trigger para atualização automática de `updated_at`

---

## 📊 Estrutura da Tabela

```sql
news_items
├── id (UUID) - Identificador único
├── title (TEXT) - Título da notícia
├── summary (TEXT) - Resumo
├── content (TEXT) - Conteúdo completo (opcional)
├── category (TEXT) - Categoria
├── author (TEXT) - Autor
├── date (DATE) - Data da notícia
├── read_time (TEXT) - Tempo de leitura
├── impact (TEXT) - Impacto: high, medium, low
├── source (TEXT) - Fonte
├── url (TEXT) - URL externa
├── tags (TEXT[]) - Array de tags
├── image_url (TEXT) - URL da imagem
├── published (BOOLEAN) - Publicado ou rascunho
├── created_by (UUID) - ID do criador
├── created_at (TIMESTAMP) - Data de criação
└── updated_at (TIMESTAMP) - Data de atualização
```

---

## 🎨 Onde as Notícias Aparecem

### 1. **Dashboard do Aluno** (`AlunoDashboard.tsx`)
- Seção "📰 Notícias e Atualizações"
- Filtros por categoria
- Lista de notícias publicadas

### 2. **Componente Newsletter** (`Newsletter.tsx`)
- Usado em vários dashboards
- Exibe notícias científicas
- Filtros por categoria

### 3. **Dashboard do Profissional** (`ProfessionalDashboard.tsx`)
- Seção de newsletter científico
- Notícias relevantes para profissionais

---

## 🔄 Próximos Passos

### 1. Atualizar Componentes para Buscar do Banco

Os componentes atualmente usam dados mockados. Para usar dados reais:

**AlunoDashboard.tsx** (linha ~850):
```typescript
// Substituir array mockado por:
const [newsItems, setNewsItems] = useState<NewsItem[]>([])

useEffect(() => {
  loadNewsFromDatabase()
}, [])

const loadNewsFromDatabase = async () => {
  const { data } = await supabase
    .from('news_items')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })
  setNewsItems(data || [])
}
```

**Newsletter.tsx** (linha ~38):
```typescript
// Substituir mockNewsItems por busca no banco
const loadNewsItems = async () => {
  const { data } = await supabase
    .from('news_items')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })
  setNewsItems(data || [])
}
```

### 2. Adicionar Upload de Imagens

- Integrar com Supabase Storage
- Permitir upload de imagens
- Gerar URLs das imagens

### 3. Editor Rich Text

- Adicionar editor WYSIWYG para conteúdo completo
- Suporte a formatação (negrito, itálico, listas)
- Inserção de imagens inline

---

## 📝 Exemplo de Uso

### Criar uma Notícia

1. Acesse `/app/admin/news`
2. Clique em "Nova Notícia"
3. Preencha:
   - **Título**: "Novos estudos sobre eficácia da Cannabis Medicinal em pacientes renais"
   - **Resumo**: "Pesquisa recente demonstra resultados promissores..."
   - **Categoria**: "Pesquisa Clínica"
   - **Autor**: "Dr. Ricardo Valença"
   - **Data**: Data atual
   - **Publicado**: Sim
4. Clique em "Salvar"

### Resultado

A notícia aparecerá:
- No dashboard do aluno
- No componente Newsletter
- No dashboard do profissional
- Filtrada pela categoria selecionada

---

## 🔐 Permissões

### Quem Pode Criar/Editar/Excluir
- ✅ Administradores (`admin`)
- ✅ Profissionais (`profissional`)

### Quem Pode Ler
- ✅ Todos os usuários (apenas notícias publicadas)
- ✅ Notícias em rascunho: apenas criador e admins

---

## 🐛 Troubleshooting

### Erro: "Tabela news_items não existe"
**Solução**: Execute o script SQL `CREATE_NEWS_ITEMS_TABLE.sql` no Supabase

### Erro: "Permissão negada"
**Solução**: Verifique se o usuário tem tipo `admin` ou `profissional` na tabela `users`

### Notícias não aparecem
**Solução**: 
1. Verifique se `published = true`
2. Verifique se a data não é futura
3. Verifique os filtros de categoria

---

## 📈 Melhorias Futuras

- [ ] Editor rich text para conteúdo
- [ ] Upload de imagens via Supabase Storage
- [ ] Agendamento de publicação
- [ ] Versionamento de notícias
- [ ] Analytics de visualizações
- [ ] Compartilhamento em redes sociais
- [ ] Notificações quando nova notícia é publicada

---

**Status**: ✅ Implementado  
**Rota**: `/app/admin/news`  
**Versão**: 1.0.0  
**Data**: Janeiro 2025

