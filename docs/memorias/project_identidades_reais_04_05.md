---
name: Identidades reais 04/05/2026 (4 sócios + familiares + 7 pacientes externos)
description: Atualização completa de quem é quem. Substitui project_socios_e_pessoas. Inclui 4 sócios (Pedro+Ricardo+Eduardo+João Vidal), familiares, e 7 pacientes externos REAIS últimos 7 dias
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## 4 SÓCIOS FUNDADORES (cap table 4 × 20% + 20% tesouraria)

### Pedro Henrique Passos Galluf — tech lead/CTO

```
UUID 17345b36 — admin
  emails: passosmir4@gmail.com / phpg69@gmail.com
  
UUID d5e01ead — paciente teste (Pedro Paciente)
  email: casualmusic2021@gmail.com
  38 reports + 9 consultas teste

Background: 36 anos, designer de formação (faculdade até 6º período),
trajeto não-linear (13+ colégios), aprendeu engenharia por necessidade.
Orquestrou COS v5.0 + Pipeline + Lock arquitetural.
```

### Dr. Ricardo Valença — fundador médico (criador do método AEC)

```
2 contas INTENCIONAIS (não corrigir):

UUID 99286e6f — admin institucional
  email: iaianoaesperanza@gmail.com

UUID 2135f0c0 — profissional clínico REAL
  email: rrvalenca@gmail.com
  Vinculado a TODOS os reports clínicos

Background:
  60 anos, ~40 anos de experiência em nefrologia
  Médico nefrologista UFRJ + mestrado UFRJ
  Criador do método AEC (Arte da Entrevista Clínica)
  Trabalha equipe OS hemodiálise + hospitais (Angra)
  Especialidade: Nefrologia/CKD
  
PJ separada: "Ricardo Valença Serviços de Saúde LTDA"
  (parceira clínica futura via subcontratação se ativar CAR)
```

### Dr. Eduardo Faveret — fundador ensino

```
2 contas (admin + profissional):

admin: eduardoscfaveret@gmail.com
profissional clínico: eduardo.faveret@hotmail.com

Background:
  Neurologista
  Conselheiro Científico
  Coordenador eixo Ensino
  Especialidade: Neurologia
```

### João Eduardo Vidal — sócio admin (lado institucional)

```
1 conta:
  email: cbdrcpremium@gmail.com (admin)
  email teste: jevyarok@gmail.com

Background:
  Comercial/B2B
  Representante 1Pure no Brasil
  Cláusula PR (partes relacionadas) declarada no acordo
  Lado institucional / parcerias / governo / regulatório
  NÃO atende clinicamente
  Destrava CNPJ (gatilho timing pra auth_user_id remap futuro)
```

## FAMILIARES / TESTE VÁLIDOS (não remover)

```
Carolina Campello do Rêgo Valença — UUID 5c98c123
  Familiar Ricardo, conta teste pra AEC. NÃO paciente real.
  31 reports + 7 consultas (todos teste)
  
Vicente Caetano Pimenta — vicente4faveret@gmail.com
  Filho do Eduardo, cadastrado como patient pra teste familiar
  
Pedro Paciente — UUID d5e01ead
  Conta teste do Pedro (admin). 38 reports + 9 consultas teste
```

## PACIENTES EXTERNOS REAIS (últimos 7 dias) ⭐

```
Maria Helena Chaves      mariahelenaearp@gmail.com
                         ⭐ Golden case 03/05
                         Smoke V1.9.123-A previsto 05/05 14-16h BRT
                         
Pedro Alberto Protasio   apoenaenv@gmail.com

Badhia Waarrak           eawarrak@id.uff.br

Ana Ventorini            dra.anavs@gmail.com
                         🚨 Profissional cadastrada
                         Provavelmente é a Ana do video Care Coordination!
                         (conversamos em 29/04)

Othon Berardo Nin        othon.nin@gmail.com

Carlos Felipe Nascimento marinikefelipe@gmail.com

Solange Rodrigues        micheleuvinha@hotmail.com
```

## ROLES RBAC (4 enums em app_role)

```
admin (5) | profissional (13) | paciente (30) | aluno (1)

⚠️ Divergência users.type ↔ user_profiles.role NÃO corrigir
   Decisão Pedro 24/04: "Ricardo é adm OU profissional, não tem discussão.
   Eduardo também".
```

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §2, sessão 04/05.
