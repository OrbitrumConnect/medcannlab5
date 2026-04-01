# Implementação Stripe Connect (Take-Rate 30/70)

Este plano detalha a transição do modelo de pagamentos mockados para uma infraestrutura real de Split Payment (30% plataforma / 70% profissional), garantindo a viabilidade do modelo de negócio do MedCannLab.

## Proposed Changes

### [Component] Banco de Dados (Supabase/PostgreSQL)

#### [MODIFY] [SUPABASE_ATUALIZACAO_FINAL_REVISAO.sql](file:///c:/users/phpg6/desktop/medcannlab5-master/database/scripts/SUPABASE_ATUALIZACAO_FINAL_REVISAO.sql)
*   Adicionar `stripe_account_id` (TEXT) à tabela de perfis (ou estender a tabela de médicos).
*   Adicionar `platform_fee` (NUMERIC) e `professional_amount` (NUMERIC) à tabela `transactions` para auditoria clara do split de 30%.

---

### [Component] Backend (Supabase Edge Functions)

#### [NEW] [stripe-connect/index.ts](file:///c:/users/phpg6/desktop/medcannlab5-master/supabase/functions/stripe-connect/index.ts)
*   **Endpoint `create-account`**: Gera uma conta Stripe Express para o médico.
*   **Endpoint `create-onboarding-link`**: Gera o link de onboarding do Stripe (KYC).
*   **Endpoint `create-checkout-session`**: Cria a sessão de pagamento com o parâmetro `transfer_data` (destino: Médico, valor: 70%).
*   **Webhook Handler**: Escuta `checkout.session.completed` para confirmar a transação no banco.

---

### [Component] Frontend (React/TypeScript)

#### [MODIFY] [ProfessionalDashboard.tsx](file:///c:/users/phpg6/desktop/medcannlab5-master/src/pages/ProfessionalDashboard.tsx)
*   Adicionar seção "Configurações de Pagamento" com botão "Conectar com Stripe".
*   Exibir status da conta (Pendente/Ativo).

#### [MODIFY] [PatientBooking.tsx](file:///c:/users/phpg6/desktop/medcannlab5-master/src/components/PatientBooking.tsx) (ou similar)
*   Redirecionar para o Checkout do Stripe após a escolha do horário, integrando o split de 30% definido no Plano de Negócios.

---

## Verification Plan

### Automated Tests (Edge Functions)
*   Executar testes de unidade localmente via `deno test` para validar o cálculo do split (centavos de arredondamento).
*   Validar assinaturas de Webhook via Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-connect`.

### Manual Verification
1.  **Onboarding**: Logar como médico, clicar em "Conectar Stripe", completar o onboarding no ambiente de testes do Stripe e verificar se o `stripe_account_id` foi salvo no banco.
2.  **Checkout**: Logar como paciente, agendar consulta, realizar o pagamento (Cartão de teste 4242...) e validar no Dashboard do Stripe se o valor foi dividido corretamente (30% plataforma / 70% destino).
3.  **Auditoria**: Verificar na tabela `transactions` se os valores de `amount`, `platform_fee` e `professional_amount` batem com a realidade.

### User Review Required
> [!IMPORTANT]
> A implementação exige as chaves de API do Stripe (Secret Key e Webhook Secret) configuradas no Supabase Secrets. O médico precisará de um CPF/CNPJ válido para o onboarding real, mas usaremos dados fictícios no ambiente de teste.
