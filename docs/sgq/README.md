# SGQ MedCannLab — Drafts Modelo C-IA (29/05/2026)

**STATUS:** ⚠️ DRAFTS PRÉ-CONSULTORA (não submetidos a auditor regulatório)

## O que é este diretório

Drafts iniciais do Sistema de Gestão da Qualidade (SGQ) MedCannLab, gerados via IA a partir do material empírico já existente no repositório:

- **649 commits/30d** com versionamento V1.9.X disciplinado
- **66 diários** DIARIO_*.md (registros de desenvolvimento)
- **6 Livros Magno** docs/LIVRO_MAGNO_*.md (controle de configuração)
- **11 locks com tag git imutável** (V1.9.95+97+98+99-B+299+388-A.3+452+468-B)
- **284 memórias persistentes** (lessons learned)
- **42 reports ICP-Brasil PBAD signed** (evidência clínica)
- **Pirâmide 8 camadas COS Kernel** (risk control architecture)

## Modelo C-IA (refinamento do Modelo C híbrido)

Caminho cristalizado em conversação 29/05:

| Modelo | Custo | Prazo |
|---|---:|---:|
| A — Consultora SaMD do zero | R$ 250-500K | 12-18m |
| C — Híbrido tradicional (consultora traduz material empírico + RT assina) | R$ 60-120K | 2-4m |
| **🆕 C-IA — Híbrido com IA** (drafts gerados localmente; consultora REVISA + RT assina + submete) | **R$ 30-60K** | **2-3m** |

## Pré-requisitos antes da submissão

- **CNPJ** ativo (Marco 1) — destrava contratação RT + consultora
- **RT (Responsável Técnico)** habilitado CRF/CREA assinando dossiê
- **Marco 2** — pelo menos 1 paciente externo pagante real validando empíricamente
- **Marco 2.5** — 2º médico independente externo no smoke (anti-conflito interesse)

## O que ESTE diretório NÃO é

❌ Dossiê regulatório oficial pronto pra submissão
❌ Substituto de consultora SaMD especializada
❌ Substituto de RT habilitado
❌ Substituto de validação clínica externa real

✅ Pacote de matéria-prima formatada que reduz custo e prazo da consultora.

## Lista de drafts (14)

### Bloco 1 — Núcleo SGQ + Conformidade (10 docs entregues 29/05 manhã)

1. **POP-CTL-001** — Controle de Documentos (ISO 13485 §7.5.3)
2. **POP-CTL-007** — Controle de Mudanças em Software Médico (ISO 13485 §7.3.7 + IEC 62304 §6.2)
3. **PLN-IEC-001** — Plano de Desenvolvimento de Software Classe B (IEC 62304 §5.1)
4. **RSK-001** — Análise de Risco ISO 14971 (FMEA inicial pirâmide 8 camadas)
5. **POP-PRJ-002** — Processo de Desenvolvimento (ISO 13485 §7.3 + IEC 62304 §5)
6. **POP-QAS-001** — Auditoria Interna SGQ (ISO 13485 §8.2.2)
7. **POP-LBL-001** — Rotulagem SaMD e Restrições Operacionais
8. **PROC-CAPA-001** — Ação Corretiva e Preventiva (ISO 13485 §8.5.2 + §8.5.3)
9. **POP-VAL-001** — Validação Clínica Documental (ISO 13485 §7.3.7)
10. **MAN-SGQ-001** — Manual do SGQ (ISO 13485 §4.2.2)

### Bloco 2 — Espinha dorsal de rastreabilidade (4 docs entregues 29/05 tarde)

Adicionados após avaliação GPT externa (nota 8/10) que destacou gap em "conhecimento indexado vs distribuído":

11. **URS-001** — User Requirements Specification (41 URS por papel)
12. **SRS-001** — Software Requirements Specification (44 SRS: 31 FR + 13 NFR)
13. **SAD-001** — Software Architecture Document (47 itens: 26 COMP + 5 IFACE + 3 FLOW + 13 DEC)
14. **TRM-001** — Traceability Matrix (193 itens rastreáveis, 17 CTL + 11 TST + 23 EVD)

### Bloco 3 — Parqueados (3 docs dependem de Marco 2+)

- ⏸️ **PLN-VER-001** — Plano de Verificação formal (depende `clinical_qa_runs` cadência acumulada)
- ⏸️ **PROC-INC-001** — Gestão de Incidentes (depende histórico real de incidentes classificados Tecnovigilância)
- ⏸️ **PROC-PMS-001** — Post-Market Surveillance (literalmente exige Marco 2 — paciente externo pagante pra haver "market")

## Aviso de conformidade

Estes drafts foram gerados em **29/05/2026** com base em snapshot do repositório nessa data. Devem ser **revisados pela consultora SaMD contratada** antes de qualquer submissão regulatória (ANVISA / FDA / CE).

Frase âncora:

> *"IA faz tradução, não invenção. O conhecimento clínico-arquitetural já existe empíricamente no repositório; estes drafts apenas formatam-no pra reconhecimento por auditor regulatório."*
