---
name: V1.9.449 count pacientes filter + 3 P0 Ricardo (gaps function calling parqueados)
description: Fix de count pacientes (15/48/34 inconsistente) + diagnóstico empírico dos 3 P0 do Ricardo descobertos 24/05 — count resolvido, lookup Gilda + filtragem agenda parqueados pra V1.9.451 function calling
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# V1.9.449 count pacientes filter + 3 P0 Ricardo

**Rule**: SEM filter `.in('type', ['paciente','patient'])` em qualquer query que apresente pacientes a médico/admin, contagem mistura admin/professional test users com pacientes reais. Antes de qualquer dashboard mostrar contagem, validar via PAT que está filtrado corretamente.

**Why**: 24/05 13:32 BRT, Ricardo profissional (UUID `2135f0c0`) perguntou *"quantos pacientes vinculados a mim?"*. 3 fontes, 3 números diferentes:
- Nôa: 15 (heurística "ativos 30d")
- `getAllPatients` frontend: 48 (UNION assessments + appointments DISTINCT)
- PAT `users.type='patient'` total: 34

Audit PAT 25/05 manhã revelou: dos 48 vinculados via UNION, 34 são role=paciente real ✅, 14 são admin/professional test users ❌ (Admin Test + profissionais cadastrados como paciente em testes antigos), 0 órfãos. Médico recebendo 3 números diferentes pra mesma pergunta = perda de confiança no sistema.

**How to apply**:
- V1.9.449 fix cirúrgico (3 linhas em `adminPermissions.ts:99-101`): adicionou `.in('type', ['paciente', 'patient'])`. Ricardo passa de 48 → 34. Branch admin NÃO tocada (admin continua vendo todos).
- Drift PT/EN no campo `type` justifica `.in(['paciente','patient'])` — sem isso, 3 users com type=paciente legado sumiam silenciosos.
- Aplicar SEMPRE em qualquer query nova que apresente "pacientes" a HCP.

## 3 P0 Ricardo descobertos 24/05 — diagnóstico pós-fix

| P0 | Achado | Próximo passo |
|---|---|---|
| Count pacientes | **RESOLVIDO V1.9.449** — filter `type` | — |
| Lookup paciente Gilda | **NÃO É BUG**: Gilda existe (UUID `e1988563`, role=patient, vinculada Ricardo via clinical_assessments) MAS `tem_report=false` + `tem_aec=false`. Cadastrada 19/01/2026, nunca usou clinicamente. Nôa estava tecnicamente correta mas UX ruim | Gap real: falta function calling `lookup_patient_status(name, doctor_id)` — **V1.9.451 parqueado** |
| Filtragem agenda por mês | **Gap function calling**: Ricardo pediu junho 2026, Nôa redirecionou genérico. PAT confirma 0 appointments junho (60 totais) | Falta `get_appointments_summary(doctor_id, period)` — **V1.9.451 parqueado** |
| Timezone card agendamento | **RESOLVIDO empíricamente**: config Ricardo Terminal → Agendamentos = real. Coluna `time without time zone` = BRT local. Slot Carolina 27/05 19:00 UTC = 16:00 BRT dentro da janela quarta 10-20 BRT cadastrada. Se Ricardo viu "19:00" no card, é bug front display | Parqueado — gotcha conhecido (`feedback_gotchas_conhecidos_27_04`) |

## Trigger anti-especulação pra V1.9.451 (function calling)

Implementar Edge functions SÓ quando Ricardo bater no gap empíricamente de novo — não preventivo. Critério P8 polir-não-inventar: gap empírico real > especulação otimizada.

## Cristalizado

Diário 25/05 BLOCO B + BLOCO O entry #1. Sequência empírica: 3 fontes → audit → fix mínimo cirúrgico → resto parqueado com trigger explícito.
