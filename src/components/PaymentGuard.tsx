
import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * PaymentGuard (Paywall)
 * 
 * Este componente bloqueia o acesso de pacientes com status de pagamento 'pending'.
 * Eles são forçados a ir para a página de checkout.
 * 
 * Regras:
 * 1. Se não for paciente, libera.
 * 2. Se for paciente 'paid' ou 'exempt', libera.
 * 3. Se for paciente 'pending', bloqueia (exceto rotas de pagamento).
 */
const PaymentGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth()
    const location = useLocation()
    const [isChecking, setIsChecking] = useState(true)

    // Rotas permitidas mesmo sem pagamento
    const allowedPathnames = [
        '/checkout',
        '/subscription-plans',
        '/app/pagamento',
        '/termos-lgpd',
        '/profile' // Permitir acessar perfil para logout/ajustes básicos
    ]

    useEffect(() => {
        if (!isLoading) {
            setIsChecking(false)
        }
    }, [isLoading])

    if (isLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-slate-400 text-sm">Verificando status de assinatura...</p>
                </div>
            </div>
        )
    }

    // Se não tiver usuário, deixa o AuthContext ou ProtectedRoute lidar
    if (!user) return <>{children}</>

    // Lógica do Paywall
    if (user.type === 'paciente') {
        const paymentStatus = (user as any).payment_status || 'pending' // Default to pending se não carregou

        // Se estiver pendente E tentar acessar rota protegida
        if (paymentStatus === 'pending' && !allowedPathnames.includes(location.pathname)) {
            console.warn('🔒 Paywall Ativado: Paciente pendente tentando acessar', location.pathname)
            return <Navigate to="/checkout" replace />
        }
    }

    return <>{children}</>
}

export default PaymentGuard
