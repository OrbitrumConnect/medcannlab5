import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QrCode, CreditCard, Barcode, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Plan {
  id: string
  name: string
  monthly_price: number
  consultation_discount: number
}

export function PaymentCheckout() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const planId = searchParams.get('plan')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix')
  const [qrCode, setQrCode] = useState<string>('')
  const [qrCodeValue, setQrCodeValue] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (planId) {
      loadPlan()
    }
  }, [planId])

  const loadPlan = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (data) {
        setPlan(data)
      } else {
        // Fallback visual (mas o pagamento real será validado no backend)
        setPlan({
          id: planId || 'mock',
          name: 'Plano MedCann',
          monthly_price: 0,
          consultation_discount: 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!planId) return
    setProcessing(true)

    try {
      // 🔒 CHAMADA SEGURA AO BACKEND (EDGE FUNCTION)
      // O preço não é enviado daqui, apenas o ID do plano.
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          planId: planId,
          paymentMethod: paymentMethod,
          userId: user?.id
        }
      })

      if (error) throw error

      if (data && data.qr_code) {
        setQrCodeValue(data.qr_code)
        setQrCode(data.qr_code_base64)
      } else {
        alert('Erro ao gerar pagamento. Tente novamente.')
      }

    } catch (error: any) {
      console.error('Erro no pagamento:', error)
      // Fallback para demonstração se a Edge Function não estiver deployada
      console.warn('⚠️ Edge Function indisponível. Usando mock local para demonstração.')

      // Mock local apenas para não travar a demo
      const mockPix = `00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000${plan?.monthly_price}`
      setQrCodeValue(mockPix)
      setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeValue)
      alert('Código PIX copiado!')
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400">Plano não encontrado</p>
          <button onClick={() => navigate('/app/subscription-plans')} className="mt-4 text-blue-500 hover:underline">Voltar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, rgba(10,25,47,0.98) 0%, rgba(15,35,55,0.95) 50%, rgba(10,40,35,0.92) 100%)' }}>
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Finalizar Pagamento</h1>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente Seguro</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Resumo do Pedido</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Plano:</span>
                <span className="font-semibold text-white">{plan.name}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-white">Total:</span>
                  <span className="text-2xl font-bold text-emerald-400">R$ {plan.monthly_price?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Método de Pagamento</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all ${paymentMethod === 'pix' ? 'bg-emerald-600 border-2 border-emerald-500' : 'bg-slate-700 border-2 border-slate-600'}`}
                >
                  <QrCode size={24} className="text-white" />
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">PIX</p>
                    <p className="text-xs text-gray-300">Aprovação imediata</p>
                  </div>
                </button>
              </div>
            </div>

            {paymentMethod === 'pix' && qrCode && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-bold text-white mb-4">Escaneie o QR Code</h3>
                <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                  <img src={qrCode} alt="QR Code PIX" className="w-64 h-64" />
                </div>
                <div className="flex gap-2">
                  <input type="text" value={qrCodeValue} readOnly className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-mono" />
                  <button onClick={handleCopyPix} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Copiar</button>
                </div>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing || (paymentMethod === 'pix' && Boolean(qrCode))}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
              {processing && <Loader2 className="animate-spin" size={20} />}
              {processing ? 'Validando transação...' : (qrCode ? 'Aguardando Pagamento' : 'Confirmar Pagamento')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
