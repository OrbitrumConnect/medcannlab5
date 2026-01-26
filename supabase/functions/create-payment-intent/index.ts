
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { planId, paymentMethod } = await req.json()

    // 1. Validar Preço no Banco de Dados (Segurança)
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      throw new Error('Plano inválido ou não encontrado.')
    }

    const amount = plan.monthly_price

    // 2. Integração com Gateway de Pagamento (Mockado para Mercado Pago / Stripe)
    console.log(`💳 Processando pagamento de R$ ${amount} para o plano ${plan.name}`)

    // Aqui entraria a chamada real para a API do Mercado Pago
    // const mpResponse = await mercadoPago.createPayment(...)

    // Mock response
    const mockPaymentResponse = {
      id: `pay_${Date.now()}`,
      status: 'pending',
      amount: amount,
      currency: 'BRL',
      qr_code: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000', // Mock PIX string
      qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // Mock Image
    }

    return new Response(
      JSON.stringify(mockPaymentResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
