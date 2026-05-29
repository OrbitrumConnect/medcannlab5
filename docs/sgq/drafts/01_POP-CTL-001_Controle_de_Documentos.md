# POP-CTL-001 — Procedimento Operacional Padrão: Controle de Documentos

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §4.2.4, §7.5.3

---

## 1. Objetivo

Estabelecer os mecanismos de controle de documentos do SGQ MedCannLab, garantindo:

- Versionamento auditável de todo material clínico, técnico e organizacional
- Rastreabilidade temporal de alterações
- Preservação de versões anteriores para fins de audit
- Identificação clara de documentos vigentes vs históricos

## 2. Escopo

Aplica-se a:

- Código-fonte do sistema (frontend, Edge Functions, migrations)
- Documentação clínica (Livros Magno, diários técnicos, memórias persistentes)
- Procedimentos operacionais padronizados (POPs)
- Registros de auditoria e validação
- Material regulatório formal

## 3. Mecanismos de controle implementados

### 3.1. Versionamento sequencial V1.9.X

O sistema utiliza esquema **V1.9.X** com sub-letras (V1.9.97-A/B/C) onde:

- **Major (1)**: Arquitetura fundamental da cosmologia COS Kernel
- **Minor (9)**: Fase atual MedCannLab 3.0 (pré-PMF)
- **Patch (X)**: Incrementado a cada commit cirúrgico
- **Sub-letra (-A/-B)**: Fixes relacionados num mesmo ciclo de mitigação

**Evidência empírica:** repositório atual em V1.9.501 com 649 commits em 30 dias documentados.

### 3.2. Locks selados (versões críticas imutáveis)

Versões consideradas críticas recebem **tag git imutável + diário dedicado + memória persistente**. Não podem ser revertidas sem nova versão do Livro Magno.

| Lock | Conteúdo selado | Selador | Data |
|---|---|---|---|
| V1.9.95 | AEC + Relatório + Agendamento | Pedro | 27/04/2026 |
| V1.9.97 | Pipeline determinístico | Pedro | 27/04/2026 |
| V1.9.98 | RLS chat-images fechado | Pedro | 28/04/2026 |
| V1.9.99-B | video-call-reminders elite | Pedro | 28/04/2026 |
| V1.9.299 | PBAD AD-RB ICP-Brasil CONFORME ITI | Pedro | 16/05/2026 |
| V1.9.388-A.3 | Ancoragem regulatória multi-camada | Ricardo+Pedro | 27/05/2026 |
| V1.9.452 | PII sanitize clinical_rationalities | Pedro | 29/05/2026 |
| V1.9.468-B | Matrix Z2 + Bula ANVISA material marcado | Pedro | 27/05/2026 |

### 3.3. Diários técnicos diários (registros de desenvolvimento)

**Padrão:** `DIARIO_DD_MM_2026_*.md` na raiz do repositório.

Estrutura obrigatória:
- Blocos sequenciais (A, B, C...)
- Frase âncora ao fim de cada bloco
- Decisões empíricas documentadas com evidência (PAT smoke, type-check, screenshot)
- Trade-offs explicitados

**Evidência empírica:** 66 diários no repositório (período 12/03/2026 a 29/05/2026).

### 3.4. Memórias persistentes (lessons learned ISO 13485 §8.5)

Diretório `~/.claude/projects/.../memory/` mantém **284 memórias** classificadas em 4 tipos:

- **project** — informações operacionais de iniciativas
- **feedback** — princípios e correções (lessons learned)
- **reference** — pointers para fontes externas
- **user** — perfil dos stakeholders

**Hierarquia explícita** em MEMORY.md (índice Nível 1 lido sempre primeiro).

### 3.5. Livros Magno (controle de configuração formal)

6 versões do Livro Magno documentam evolução da Constituição cognitiva:

```
docs/LIVRO_MAGNO_V1.md → V6.md
```

Cada Magno consolida o que sobreviveu a 3-6 semanas de uso empírico sem regressão. **NÃO atualizado por capricho** (princípio "polir, não inventar").

### 3.6. Git como sistema de controle de versão primário

- Branch principal: `main`
- Push obrigatório em **4 referências** (2 remotes × main + master)
- Co-author obrigatório em commits IA-assistidos
- Histórico imutável (sem `--force` push sem `--force-with-lease`)
- Hooks pre-commit ativos (secretlint, type-check)

## 4. Identificação de versão vigente

Para qualquer ponto do sistema, a versão vigente é determinável por:

1. **Tag git** mais recente naquele caminho (`git log -1 --tags`)
2. **CLAUDE.md** seção "Estado atual" (atualizado a cada lock)
3. **Edge Functions:** Management API Supabase retorna `version` ativa
4. **Frontend:** Vercel deploy automático on push → versão = último commit em main

## 5. Preservação de versões anteriores

- Git mantém histórico completo (rebase só em branches feature, nunca main)
- Backups Supabase: WAL-G + diários (Pro plan)
- Diários técnicos: nunca deletados, apenas arquivados quando atingem 1000 linhas
- Memórias: removidas apenas quando obsoletas; quando relevantes mesmo se desatualizadas, **rebaixadas a Nível 2/3** com data de obsolescência

## 6. Responsabilidades

| Papel | Responsabilidade |
|---|---|
| Tech Lead (Pedro Galluf) | Selagem de locks + atualização Magno + CLAUDE.md |
| Médico Sócio (Ricardo Valença) | Validação clínica empírica antes de selagem |
| Co-Coordenador Ensino (Eduardo Faveret) | Validação metodológica eixo Ensino |
| RT habilitado (a contratar pós-CNPJ) | Assinatura formal de documentos regulatórios |

## 7. Registros gerados

- Tags git de versões críticas
- Diários `DIARIO_*.md` (laboratório operacional)
- Memórias `memory/*.md` (lessons learned)
- Livros Magno `docs/LIVRO_MAGNO_V*.md` (museu institucional)
- Histórico commit `git log` (auditoria temporal)

## 8. Evidências para auditor

```bash
# Ver histórico empírico de mudanças
git log --oneline --graph --all | head -100

# Ver locks selados (tags imutáveis)
git tag --list | sort -V

# Ver diários técnicos
ls DIARIO_*.md | wc -l

# Ver Livros Magno (controle de configuração)
ls docs/LIVRO_MAGNO_*.md

# Ver memórias persistentes (lessons learned)
ls ~/.claude/projects/*/memory/*.md | wc -l
```

## 9. Não-conformidades conhecidas (transparência)

- **`tradevision-core` Edge com `verify_jwt=false`** em produção (descoberto 29/05) — pendente decisão arquitetural com validação de callers; rastreado em Sprint A.
- **CLAUDE.md exemplo doc** ainda menciona `--no-verify-jwt` (cosmético, não-funcional)
- Necessária validação RT formal pós-CNPJ para conversão deste draft em POP oficial.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

**Próxima revisão obrigatória:** 6 meses após primeira aprovação OR a cada lock crítico.
