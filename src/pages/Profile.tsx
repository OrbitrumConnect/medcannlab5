import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  X,
  Shield,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Download,
  Settings,
  ArrowLeft,
  Wallet,
  Award,
  Camera,
  Star,
  AlertCircle,
  MessageSquare  // V1.9.486-B — trigger pra página /app/feedback
} from 'lucide-react'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordEditing, setIsPasswordEditing] = useState(false)
  // V1.9.480 (28/05/2026) — Alterar email com re-auth + confirmacao Supabase Auth.
  // Empirico caso Mario Valenca: typo no email cadastrado (oulook.com) bloqueava
  // recovery. Campo email do form principal continua disabled (defesa); mudanca
  // exclusiva via modal dedicado com senha atual + email duplo + chama
  // supabase.auth.updateUser({ email }) que envia confirmacao pro NOVO email.
  // Email antigo continua valido ate confirmacao (protecao nativa Supabase).
  const [isEmailEditing, setIsEmailEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cep: '',
    location: '',
    bio: '',
    // V1.9.150: pricing por profissional (só editável quando user.type === 'profissional')
    consultation_fee_default: '',
    years_experience: '',
    // V1.9.x: vitrine profissional adicional — alimenta modal Ver Perfil em PatientAppointments
    specialty: '',
    council_state: '',
    tags: '',         // comma-separated → ex: "Nefrologia, Dor, Inflamação"
    languages: ''     // comma-separated → ex: "Português, Inglês"
  })
  const [isLookingUpCep, setIsLookingUpCep] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // V1.9.480 — payload alterar email (re-auth + email duplo)
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: '',
    currentPassword: ''
  })

  const [preferences, setPreferences] = useState({
    notifications: true,
    language: 'pt'
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Avatar: user_metadata.avatar_url ou auth
  useEffect(() => {
    const url = (user as any)?.user_metadata?.avatar_url ?? (user as any)?.avatar_url ?? null
    setAvatarUrl(url)
  }, [user])

  // Scroll para #carteira quando vier pelo link da Carteira
  useEffect(() => {
    if (window.location.hash === '#carteira') {
      const el = document.getElementById('carteira')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Carregar dados do usuário (location pode conter "CEP — Cidade, UF")
  useEffect(() => {
    if (user) {
      const rawLoc = (user as any).location || ''
      const cepMatch = rawLoc.match(/\b(\d{5}-?\d{3})\b/)
      const cep = cepMatch ? cepMatch[1] : ''
      const locationOnly = rawLoc.replace(/\b\d{5}-?\d{3}\b\s*[—\-–|·,]?\s*/, '').trim()
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        cep,
        location: locationOnly,
        bio: (user as any).bio || ''
      }))

      // V1.9.155: AuthContext lê de USERS (canônica) mas Profile salva em PROFILES (legacy schema).
      // Resultado pré-V1.9.155: salvar phone/bio/location funciona, mas após reload os campos
      // sumiam porque user.{phone,bio,location} vem undefined. Fix cirúrgico: fetch direto
      // de profiles para popular esses 3 campos. Não muda comportamento de salvamento.
      ;(async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('phone, location, bio')
            .eq('id', user.id)
            .maybeSingle()
          if (error || !data) return
          const profLoc = data.location || ''
          const profCepMatch = profLoc.match(/\b(\d{5}-?\d{3})\b/)
          const profCep = profCepMatch ? profCepMatch[1] : ''
          const profLocOnly = profLoc.replace(/\b\d{5}-?\d{3}\b\s*[—\-–|·,]?\s*/, '').trim()
          setFormData(prev => ({
            ...prev,
            phone: data.phone || prev.phone,
            cep: profCep || prev.cep,
            location: profLocOnly || prev.location,
            bio: data.bio || prev.bio
          }))
        } catch {
          // Silencioso — fallback ao que já veio do AuthContext
        }
      })()

      // V1.9.150: carregar pricing/experiência (só faz sentido pra profissional)
      // V1.9.x: + specialty/council_state (users) + tags/languages (profiles)
      // V1.9.x: admin também carrega/edita (QA + suporte interno; campos opcionais nullable)
      // Fallback gracioso se migration ainda não aplicada (colunas inexistentes).
      if ((user as any).type === 'profissional' || (user as any).type === 'professional' || (user as any).type === 'admin') {
        ;(async () => {
          try {
            const { data, error } = await (supabase as any)
              .from('users')
              .select('consultation_fee_default, years_experience, specialty, council_state')
              .eq('id', user.id)
              .maybeSingle()
            if (error) {
              return
            }
            if (data) {
              setFormData(prev => ({
                ...prev,
                consultation_fee_default: data.consultation_fee_default != null
                  ? String(data.consultation_fee_default) : '',
                years_experience: data.years_experience != null
                  ? String(data.years_experience) : '',
                specialty: data.specialty || '',
                council_state: data.council_state || ''
              }))
            }
          } catch {
            // Falha silenciosa — migration pendente
          }
          // tags + languages vivem em profiles (V1.9.x migration)
          try {
            const { data, error } = await (supabase as any)
              .from('profiles')
              .select('tags, languages')
              .eq('user_id', user.id)
              .maybeSingle()
            if (error) return
            if (data) {
              setFormData(prev => ({
                ...prev,
                tags: data.tags || '',
                languages: data.languages || ''
              }))
            }
          } catch {
            // Migration profiles.tags/languages pendente
          }
        })()
      }
    }
  }, [user])

  // ViaCEP lookup automático ao completar 8 dígitos
  const lookupCep = async (rawCep: string) => {
    const cleaned = rawCep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    setIsLookingUpCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await res.json()
      if (data?.erro) {
        showError('CEP não encontrado.')
        return
      }
      const parts = [data.bairro, data.localidade, data.uf].filter(Boolean)
      const formatted = parts.length >= 2
        ? `${data.localidade}, ${data.uf}`
        : parts.join(', ')
      setFormData(prev => ({
        ...prev,
        cep: `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`,
        // só sobrescreve location se estiver vazia ou for o resultado de outro CEP
        location: prev.location && prev.location.trim().length > 0 && !prev.location.includes(',')
          ? prev.location
          : formatted
      }))
      success(`Endereço preenchido: ${formatted}`)
    } catch (err) {
      showError('Falha ao consultar ViaCEP.')
    } finally {
      setIsLookingUpCep(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'cep') {
      const digits = value.replace(/\D/g, '').slice(0, 8)
      const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
      setFormData(prev => ({ ...prev, cep: masked }))
      if (digits.length === 8) {
        void lookupCep(digits)
      }
      return
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Concatena CEP + Localização para persistir num único campo (compatível com schema atual)
      const composedLocation = formData.cep
        ? `${formData.cep}${formData.location ? ` — ${formData.location}` : ''}`
        : formData.location

      // V1.9.146: removido updated_at — coluna não existe em profiles (legacy schema).
      // profiles tem só: id, user_id, name, email, type, avatar_url, created_at, slug,
      // location, phone, bio. UPDATE em campo inexistente gera PGRST204.
      // V1.9.x FIX 07/05: adicionado user_id pra evitar profiles órfãs
      // (Ricardo gerou row com id=user.id mas user_id=NULL → tags/languages
      //  UPDATE com .eq('user_id', user.id) falhava silenciosamente).
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_id: user.id,  // ← FK obrigatória pro JOIN funcionar
          name: formData.name,
          phone: formData.phone,
          location: composedLocation,
          bio: formData.bio
        })

      if (error) throw error

      // Atualizar metadata do auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          phone: formData.phone,
          location: composedLocation,
          bio: formData.bio
        }
      })

      if (updateError) throw updateError

      // V1.9.150: salvar pricing/experiência em users (canônica) só pra profissional.
      // V1.9.x: admin também (consistência com load — campos opcionais nullable, sem efeito
      // colateral em vitrine pública porque admin não está em FALLBACK_PROFESSIONALS).
      // Fallback gracioso se migration ainda não aplicada — não bloqueia save geral.
      if ((user as any).type === 'profissional' || (user as any).type === 'professional' || (user as any).type === 'admin') {
        const feeRaw = formData.consultation_fee_default.trim()
        const yearsRaw = formData.years_experience.trim()
        const feeNum = feeRaw === '' ? null : parseFloat(feeRaw.replace(',', '.'))
        const yearsNum = yearsRaw === '' ? null : parseInt(yearsRaw, 10)

        // Validação client-side (CHECK constraints replicadas)
        if (feeNum != null && (Number.isNaN(feeNum) || feeNum < 350 || feeNum > 1300)) {
          showError('Valor da consulta deve estar entre R$ 350 e R$ 1.300')
          setIsLoading(false)
          return
        }
        if (yearsNum != null && (Number.isNaN(yearsNum) || yearsNum < 0 || yearsNum > 80)) {
          showError('Anos de experiência deve estar entre 0 e 80')
          setIsLoading(false)
          return
        }

        try {
          // V1.9.x: salva pricing + specialty + CRM no users.
          // Trim de specialty/council_state evita string vazia entrar no banco como ''
          // (mantém NULL → modal Ver Perfil sabe esconder linha quando vazio).
          const specialtyTrim = (formData.specialty || '').trim()
          const crmTrim = (formData.council_state || '').trim()
          const { error: usersError } = await (supabase as any)
            .from('users')
            .update({
              consultation_fee_default: feeNum,
              years_experience: yearsNum,
              specialty: specialtyTrim || null,
              council_state: crmTrim || null
            })
            .eq('id', user.id)
          if (usersError && !usersError.message?.includes('column')) {
            console.warn('⚠️ V1.9.150 falha ao salvar pricing/specialty:', usersError.message)
          }
        } catch (e: any) {
          console.warn('⚠️ V1.9.150 pricing não persistido:', e?.message)
        }

        // V1.9.x: salvar tags + languages em profiles (migration ADD COLUMN aplicada).
        // Falha silenciosa se profiles.tags/languages ainda não existirem em ambiente.
        try {
          const tagsTrim = (formData.tags || '').trim()
          const langsTrim = (formData.languages || '').trim()
          const { error: profilesError } = await (supabase as any)
            .from('profiles')
            .update({
              tags: tagsTrim || null,
              languages: langsTrim || null
            })
            .eq('user_id', user.id)
          if (profilesError && !profilesError.message?.includes('column')) {
            console.warn('⚠️ V1.9.x falha ao salvar tags/languages:', profilesError.message)
          }
        } catch (e: any) {
          console.warn('⚠️ V1.9.x tags/languages não persistidos:', e?.message)
        }
      }

      success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (err: any) {
      showError(err.message || 'Erro ao atualizar perfil')
      console.error('Erro:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setIsLoading(true)
    try {
      // Atualizar senha no Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      success('Senha alterada com sucesso!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setIsPasswordEditing(false)
    } catch (err: any) {
      showError(err.message || 'Erro ao alterar senha')
      console.error('Erro:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // V1.9.480 — handler de input dos campos do modal Alterar Email
  const handleEmailDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmailData(prev => ({
      ...prev,
      [name]: name === 'newEmail' || name === 'confirmEmail' ? value.trim().toLowerCase() : value
    }))
  }

  // V1.9.480 — alterar email com re-auth + supabase.auth.updateUser
  const handleChangeEmail = async () => {
    const newEmail = emailData.newEmail.trim().toLowerCase()
    const confirmEmail = emailData.confirmEmail.trim().toLowerCase()

    if (!newEmail || !confirmEmail) {
      showError('Preencha o novo email e a confirmacao.')
      return
    }
    if (newEmail !== confirmEmail) {
      showError('Os emails nao coincidem.')
      return
    }
    // validacao basica de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      showError('Email invalido.')
      return
    }
    if (user?.email && newEmail === user.email.toLowerCase()) {
      showError('O novo email e igual ao atual.')
      return
    }
    if (!emailData.currentPassword || emailData.currentPassword.length < 6) {
      showError('Digite sua senha atual para confirmar a alteracao.')
      return
    }
    if (!user?.email) {
      showError('Sessao nao detectada. Faca login novamente.')
      return
    }

    setIsLoading(true)
    try {
      // Re-auth: valida senha atual ANTES de mudar email (anti account takeover)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailData.currentPassword
      })
      if (signInErr) {
        showError('Senha atual incorreta.')
        return
      }

      // Dispara mudanca de email — Supabase envia link de confirmacao pro NOVO email.
      // public.users.email so sera atualizado quando user confirmar pelo link.
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error

      // Audit log LGPD (best-effort, nao bloqueia em caso de falha)
      try {
        await (supabase as any).from('noa_logs').insert({
          interaction_type: 'profile_email_change_requested_v1_9_480',
          payload: {
            user_id: user.id,
            from_email: user.email,
            to_email: newEmail,
            source: 'profile_modal'
          }
        })
      } catch {
        // fail-open
      }

      success(`Email de confirmacao enviado para ${newEmail}. Clique no link recebido para finalizar a alteracao. O email atual continua valido ate la.`)
      setEmailData({ newEmail: '', confirmEmail: '', currentPassword: '' })
      setIsEmailEditing(false)
    } catch (err: any) {
      const msg = err?.message || 'Erro ao alterar email'
      if (msg.toLowerCase().includes('already')) {
        showError('Este email ja esta em uso por outra conta.')
      } else {
        showError(msg)
      }
      console.error('[handleChangeEmail] erro:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return

    try {
      const data = {
        name: user.name,
        email: user.email,
        type: user.type,
        created_at: new Date().toISOString(),
        profile: formData
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      success('Dados exportados com sucesso!')
    } catch (err: any) {
      showError('Erro ao exportar dados')
      console.error('Erro:', err)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        cep: '',
        location: '',
        bio: '',
        consultation_fee_default: '',
        years_experience: '',
        specialty: '',
        council_state: '',
        tags: '',
        languages: ''
      })
    }
    setIsEditing(false)
  }

  const handleChangePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      showError('Selecione uma imagem (JPG, PNG ou GIF).')
      return
    }
    setIsUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `profiles/${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatar').getPublicUrl(path)
      const urlWithCache = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: urlWithCache }
      })
      if (updateError) throw updateError

      setAvatarUrl(urlWithCache)
      success('Foto atualizada!')
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { url: urlWithCache } }))
    } catch (err: any) {
      showError(err.message || 'Erro ao enviar foto. Verifique se o bucket "avatar" permite upload em profiles/.')
    } finally {
      setIsUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  // V1.9.146: memberSince real via users.created_at (era hardcoded "Janeiro 2024")
  const [memberSince, setMemberSince] = useState<string>('—')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('created_at')
          .eq('id', user.id)
          .single()
        if (cancelled || !userRow?.created_at) return
        const d = new Date(userRow.created_at as string)
        const month = d.toLocaleString('pt-BR', { month: 'long' })
        const year = d.getFullYear()
        setMemberSince(`${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`)
      } catch {
        // mantém '—' em caso de erro
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const getAccountStats = () => {
    return {
      memberSince,
      lastLogin: 'Hoje',
      accountType: user?.type || 'profissional'
    }
  }

  const stats = getAccountStats()

  const walletCredits = 0
  const [ranking, setRanking] = useState<number | null>(null)
  const [averageRatingStars, setAverageRatingStars] = useState<number | null>(null)
  const [ratingsCount, setRatingsCount] = useState<number>(0)

  // Buscar ranking real (posição por user_profiles.points entre profissionais) e média de estrelas
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        // Ranking: posição por points entre profissionais
        const isProfessional = (user as any)?.type === 'profissional' || (user as any)?.type === 'admin'
        if (isProfessional) {
          const { data: meProfile } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('user_id', user.id)
            .maybeSingle()
          const myPoints = meProfile?.points ?? 0
          const { count } = await supabase
            .from('user_profiles')
            .select('user_id', { count: 'exact', head: true })
            .gt('points', myPoints)
          if (!cancelled) setRanking((count ?? 0) + 1)
        } else {
          if (!cancelled) setRanking(null)
        }

        // Estrelas: média de conversation_ratings (como profissional ou paciente)
        const column = isProfessional ? 'professional_id' : 'patient_id'
        const { data: ratings } = await supabase
          .from('conversation_ratings')
          .select('rating')
          .eq(column, user.id)
        if (!cancelled && ratings && ratings.length > 0) {
          const avg = ratings.reduce((s, r: any) => s + (r.rating || 0), 0) / ratings.length
          setAverageRatingStars(avg)
          setRatingsCount(ratings.length)
        }
      } catch (err) {
        console.warn('[Profile] ranking/estrelas:', err)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])
  const renderStars = (value: number) => {
    const v = Math.min(5, Math.max(0, value))
    const full = Math.floor(v)
    const half = v - full >= 0.5 ? 1 : 0
    const empty = 5 - full - half
    return (
      <span className="inline-flex items-center gap-0.5" title={`${value.toFixed(1)} de 5`}>
        {Array.from({ length: full }, (_, i) => (
          <Star key={`f-${i}`} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
        {half ? <Star key="h" className="w-4 h-4 text-amber-400 fill-amber-400" /> : null}
        {Array.from({ length: empty }, (_, i) => (
          <Star key={`e-${i}`} className="w-4 h-4 text-slate-500" />
        ))}
      </span>
    )
  }

  return (
    <div className="space-y-3 px-3.5 sm:px-5 lg:px-7 max-w-6xl mx-auto -mt-4 pt-1">
      {/* Voltar */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </button>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-semibold text-white mb-1">
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-400">
          Informações pessoais e configurações
        </p>
      </div>

      {/* V1.9.207 — Banner "Complete seu cadastro" pra profissional sem dados críticos.
          Não bloqueia — só avisa. Critérios: sem CRM/Conselho cadastrado OU sem valor
          de consulta. Risco regulatório CFM 2.314/2022 + bloqueio receita pós-CNPJ. */}
      {((user as any)?.type === 'profissional' || (user as any)?.type === 'professional') && (() => {
        const missingCouncil = !formData.council_state || formData.council_state.trim().length < 3
        const missingFee = !formData.consultation_fee_default || formData.consultation_fee_default.trim() === ''
        const missingSpecialty = !formData.specialty || formData.specialty.trim() === ''
        const showBanner = !isEditing && (missingCouncil || missingFee || missingSpecialty)
        if (!showBanner) return null
        const missingFields: string[] = []
        if (missingCouncil) missingFields.push('CRM/Conselho')
        if (missingSpecialty) missingFields.push('Especialidade')
        if (missingFee) missingFields.push('Valor da consulta')
        return (
          <div
            className="rounded-lg p-4 border flex items-start gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.10) 0%, rgba(234, 88, 12, 0.06) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.30)'
            }}
            role="alert"
            aria-label="Cadastro profissional incompleto"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-300 mb-1">
                Complete seu cadastro profissional
              </div>
              <p className="text-xs text-slate-300/85 leading-relaxed">
                Para receber agendamentos e prescrever conforme CFM 2.314/2022,
                seu cadastro precisa incluir: <strong className="text-amber-200">{missingFields.join(', ')}</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors"
            >
              Editar agora
            </button>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">
                Informações Pessoais
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Avatar + Alterar foto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChangePhoto}
              />
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isUploadingPhoto}
                    className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#00c16a] to-[#00a85a] flex items-center justify-center ring-2 ring-slate-600 hover:ring-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    title="Alterar foto"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {formData.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                  <span className="absolute -bottom-0.5 right-0 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                    <Camera className="w-2.5 h-2.5 text-slate-300" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">
                    {user?.name || 'Usuário'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {user?.type === 'profissional' ? 'Profissional' :
                      user?.type === 'paciente' ? 'Paciente' :
                        user?.type === 'aluno' ? 'Estudante' : 'Administrador'}
                  </p>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isUploadingPhoto}
                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 font-medium"
                  >
                    {isUploadingPhoto ? 'Enviando...' : 'Alterar foto'}
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-slate-600 border border-slate-600 rounded text-white cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    CEP
                    {isLookingUpCep && <span className="text-[10px] text-emerald-400">buscando…</span>}
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Localização</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Bairro, Cidade, UF"
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Biografia</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* V1.9.150: campos profissionais (vitrine + cobrança).
                  V1.9.x: admin também vê/edita pra QA + suporte interno (campos opcionais).
                  Wallet existente já calcula split 70/30 baseado em platform_fee_pct dinâmico
                  (FASE B liga tier_label → 30/23/26/20%). */}
              {((user as any)?.type === 'profissional' || (user as any)?.type === 'professional' || (user as any)?.type === 'admin') && (
                <div className="border-t border-slate-700 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                      Vitrine profissional
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Especialidade
                        <span className="text-[10px] text-slate-500 ml-1">aparece no card</span>
                      </label>
                      <input
                        type="text"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Ex: Nefrologia / Neurologia / Clínica Geral"
                        maxLength={80}
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        CRM / Conselho
                        <span className="text-[10px] text-slate-500 ml-1">ex: 12345-RJ</span>
                      </label>
                      <input
                        type="text"
                        name="council_state"
                        value={formData.council_state}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Ex: 12345-RJ"
                        maxLength={32}
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Valor da consulta (R$)
                        <span className="text-[10px] text-slate-500 ml-1">piso 350 · teto 1.300</span>
                      </label>
                      <input
                        type="number"
                        name="consultation_fee_default"
                        value={formData.consultation_fee_default}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        min={350}
                        max={1300}
                        step={10}
                        placeholder="350"
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {formData.consultation_fee_default && !Number.isNaN(parseFloat(formData.consultation_fee_default)) && (
                        <p className="text-[11px] text-emerald-300 mt-1">
                          Você recebe ~70%: R$ {(parseFloat(formData.consultation_fee_default) * 0.7).toFixed(2)}
                          <span className="text-slate-500 ml-1">(STANDARD; ELITE = 80%)</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Anos de experiência
                        <span className="text-[10px] text-slate-500 ml-1">0-80</span>
                      </label>
                      <input
                        type="number"
                        name="years_experience"
                        value={formData.years_experience}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        min={0}
                        max={80}
                        step={1}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  {/* V1.9.x: Tags + Idiomas em comma-separated (UX simples single-line) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Áreas de atuação
                        <span className="text-[10px] text-slate-500 ml-1">separe por vírgula</span>
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Ex: Nefrologia, Dor, Inflamação, IMRE"
                        maxLength={200}
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Idiomas atendidos
                        <span className="text-[10px] text-slate-500 ml-1">separe por vírgula</span>
                      </label>
                      <input
                        type="text"
                        name="languages"
                        value={formData.languages}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Ex: Português, Inglês, Espanhol"
                        maxLength={120}
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">
                Segurança
              </h2>
              {!isPasswordEditing && (
                <button
                  onClick={() => setIsPasswordEditing(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  Alterar Senha
                </button>
              )}
            </div>

            {isPasswordEditing && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Senha Atual</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
                      placeholder="Senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nova senha"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Confirmar</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirmar nova senha"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-3 py-1.5 rounded text-xs font-medium"
                  >
                    {isLoading ? 'Alterando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => {
                      setIsPasswordEditing(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* V1.9.480 — Alterar Email (separador + bloco proprio) */}
            <div className="mt-4 pt-4 border-t border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-300">Email de acesso</h3>
                {!isEmailEditing && (
                  <button
                    onClick={() => setIsEmailEditing(true)}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold"
                  >
                    Alterar Email
                  </button>
                )}
              </div>

              {!isEmailEditing && (
                <p className="text-[11px] text-slate-500">
                  Email atual: <span className="text-slate-300">{user?.email || '—'}</span>
                </p>
              )}

              {isEmailEditing && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Voce vai receber um link de confirmacao no <strong>novo email</strong>.
                    Clique no link para finalizar. O email atual continua valido ate la.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Novo Email</label>
                    <input
                      type="email"
                      name="newEmail"
                      value={emailData.newEmail}
                      onChange={handleEmailDataChange}
                      autoComplete="off"
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="novo.email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Confirmar Novo Email</label>
                    <input
                      type="email"
                      name="confirmEmail"
                      value={emailData.confirmEmail}
                      onChange={handleEmailDataChange}
                      autoComplete="off"
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="digite o novo email novamente"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Senha Atual (seguranca)</label>
                    <div className="relative">
                      <input
                        type={showEmailPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={emailData.currentPassword}
                        onChange={handleEmailDataChange}
                        autoComplete="current-password"
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showEmailPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangeEmail}
                      disabled={isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-3 py-1.5 rounded text-xs font-medium"
                    >
                      {isLoading ? 'Enviando...' : 'Confirmar alteracao'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEmailEditing(false)
                        setEmailData({ newEmail: '', confirmEmail: '', currentPassword: '' })
                      }}
                      disabled={isLoading}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações Rápidas — abaixo de Segurança, triggers lado a lado */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-2">
              Ações Rápidas
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 py-2 px-3 text-xs hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600/50"
              >
                <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-slate-200">Exportar Dados</span>
              </button>
              <button className="flex items-center gap-1.5 py-2 px-3 text-xs hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600/50">
                <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-slate-200">Segurança</span>
              </button>
              <button className="flex items-center gap-1.5 py-2 px-3 text-xs hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600/50">
                <Bell className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-200">Notificações</span>
              </button>
              {/* V1.9.486-B — trigger feedback (substitui modal sidebar V1.9.486) */}
              <button
                onClick={() => navigate('/app/feedback')}
                className="flex items-center gap-1.5 py-2 px-3 text-xs hover:bg-emerald-500/15 hover:border-emerald-500/40 rounded-lg transition-colors border border-slate-600/50"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-200">Feedback / Suporte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Carteira — especificações */}
          <div id="carteira" className="bg-slate-800/80 rounded-lg p-3 border border-amber-500/20">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              Carteira
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Créditos</span>
                <span className="font-semibold text-amber-400 tabular-nums">{walletCredits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cashback</span>
                <span className="text-slate-400">% consultas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Indicação</span>
                <span className="text-slate-400">créd./ind.</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-600">
                <span className="text-slate-400 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-emerald-400" /> Ranking</span>
                <span className="font-semibold text-white">
                  {ranking !== null ? `#${ranking}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-400 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> Estrelas</span>
                {averageRatingStars !== null ? (
                  <span className="flex items-center gap-1.5">
                    {renderStars(averageRatingStars)}
                    <span className="text-[10px] text-slate-400 tabular-nums">({ratingsCount})</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Sem avaliações</span>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {ranking !== null
                ? 'Ranking calculado por XP (user_profiles.points). Estrelas: média real das avaliações.'
                : 'Ranking disponível para profissionais. Estrelas: média real das avaliações.'}
            </p>
          </div>

          {/* Account Stats */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-2">
              Estatísticas
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Membro desde</span>
                <span className="text-slate-300">{stats.memberSince}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Último login</span>
                <span className="text-slate-300">{stats.lastLogin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo</span>
                <span className="text-slate-300">
                  {user?.type === 'profissional' ? 'Profissional' :
                    user?.type === 'paciente' ? 'Paciente' :
                      user?.type === 'aluno' ? 'Estudante' : 'Administrador'}
                </span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-2">
              Preferências
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Notificações</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.notifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Idioma</span>
                <select
                  className="text-xs border border-slate-600 rounded px-1.5 py-0.5 bg-slate-700 text-white"
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Privacidade</span>
                <button className="text-xs text-blue-400 hover:text-blue-300">Configurar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
