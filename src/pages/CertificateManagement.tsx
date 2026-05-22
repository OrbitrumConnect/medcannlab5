import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Shield,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Key,
  Trash2,
  Loader2,
  ArrowLeft,
  Info
} from 'lucide-react'

interface Certificate {
  id: string
  professional_id: string
  certificate_type: 'A1' | 'A3' | 'remote'
  ac_provider: string
  certificate_thumbprint: string | null
  certificate_serial_number: string | null
  certificate_subject: string | null
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  // V1.9.175+ — modo real ICP-Brasil
  certificate_file_path?: string | null
  encrypted_password?: string | null
  uploaded_at?: string | null
}

const CertificateManagement: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [certificateType, setCertificateType] = useState<'A1' | 'A3' | 'remote'>('A1')
  const [acProvider, setAcProvider] = useState('')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [expiresAt, setExpiresAt] = useState('')
  const [certificatePassword, setCertificatePassword] = useState('')

  // V1.9.299 (15/05) — limitado a DigitalSign por enquanto.
  // Edge sign-pdf-icp tem chain ICP-Brasil hardcoded da AC DigitalSign RFB G3.
  // Outras AC (Soluti, Certisign, Valid, Safeweb, Serasa) precisam ter chain
  // baixada e embeddada no icp_chain.ts antes de liberar — ~30min de trabalho
  // por AC. Pré-PMF: só DigitalSign é necessário (única AC com médicos cadastrados).
  // Pós-PMF (quando 2º médico vier com AC diferente) → adiciona chain dele.
  const AC_PROVIDERS = [
    'DigitalSign'
  ]

  useEffect(() => {
    if (user?.id) {
      loadCertificates()
    }
  }, [user])

  const loadCertificates = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('medical_certificates')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setCertificates((data || []) as any)
    } catch (err: any) {
      console.error('Erro ao carregar certificados:', err)
      setError(err.message || 'Erro ao carregar certificados')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setError('Usuário não identificado')
      return
    }

    if (!acProvider || !expiresAt) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // V1.9.177 — Upload REAL do .pfx pro bucket privado + cifrar senha via Edge
      // (modo real pra ICP-Brasil). Se sem arquivo/senha → cadastro metadata-only
      // (modo simulação fallback, igual ao comportamento V1.9.95).

      let certificateFilePath: string | null = null
      let encryptedPassword: string | null = null
      let uploadedAt: string | null = null

      // Caminho REAL — só ativa se A1 + arquivo + senha presentes
      if (certificateType === 'A1' && certificateFile && certificatePassword) {
        // Validações cliente
        if (certificateFile.size > 10 * 1024 * 1024) {
          throw new Error('Arquivo .pfx maior que 10 MB')
        }
        const allowedTypes = ['application/x-pkcs12', 'application/pkcs12', 'application/octet-stream']
        const allowedExts = ['.pfx', '.p12']
        const fname = certificateFile.name.toLowerCase()
        const okExt = allowedExts.some(ext => fname.endsWith(ext))
        const okType = allowedTypes.includes(certificateFile.type) || certificateFile.type === ''
        if (!okExt && !okType) {
          throw new Error('Arquivo deve ser .pfx ou .p12 (PKCS#12)')
        }

        // 1. Cifrar senha via Edge (NUNCA salvar plaintext)
        const { data: encResp, error: encError } = await supabase.functions.invoke(
          'cert-encrypt-password',
          { body: { password: certificatePassword } }
        )
        if (encError) throw new Error(`Erro ao cifrar senha: ${encError.message}`)
        if (!encResp?.success || !encResp.encrypted) {
          throw new Error(encResp?.error || 'Edge cert-encrypt-password retornou inválido')
        }
        encryptedPassword = encResp.encrypted as string

        // 2. Upload .pfx pro Storage (path: {professional_id}/{uuid}.pfx)
        const certUuid = crypto.randomUUID()
        const storagePath = `${user.id}/${certUuid}.pfx`
        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(storagePath, certificateFile, {
            cacheControl: '0',  // cert nunca em cache CDN
            upsert: false,      // nunca sobrescrever (cada cert único)
            contentType: 'application/x-pkcs12'
          })
        if (uploadError) throw new Error(`Erro no upload do .pfx: ${uploadError.message}`)
        certificateFilePath = storagePath
        uploadedAt = new Date().toISOString()
      }

      // 3. INSERT em medical_certificates (com ou sem .pfx)
      const certificateData = {
        professional_id: user.id,
        certificate_type: certificateType,
        ac_provider: acProvider,
        certificate_thumbprint: certificateFile
          ? `${certificateType}-${acProvider}-${Date.now()}`
          : null,
        certificate_serial_number: null,
        certificate_subject: null,
        expires_at: expiresAt,
        is_active: true,
        // V1.9.177 — modo real (only set se upload completou com sucesso)
        certificate_file_path: certificateFilePath,
        encrypted_password: encryptedPassword,
        uploaded_at: uploadedAt
      }

      const { error: insertError } = await supabase
        .from('medical_certificates')
        .insert(certificateData)

      if (insertError) {
        // Cleanup: se INSERT falhou mas .pfx foi uploaded, remover do Storage
        if (certificateFilePath) {
          await supabase.storage.from('certificates').remove([certificateFilePath])
        }
        throw insertError
      }

      // Limpar formulário
      setCertificateType('A1')
      setAcProvider('')
      setCertificateFile(null)
      setExpiresAt('')
      setCertificatePassword('')
      setShowAddForm(false)

      // Recarregar lista
      await loadCertificates()

      const successMsg = certificateFilePath
        ? '✅ Certificado adicionado com upload real (.pfx criptografado)!'
        : '⚠️ Certificado adicionado em modo metadata-only (sem .pfx — assinatura usará simulação fallback).'
      alert(successMsg)
    } catch (err: any) {
      console.error('Erro ao adicionar certificado:', err)
      setError(err.message || 'Erro ao adicionar certificado')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateCertificate = async (certificateId: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este certificado?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('medical_certificates')
        .update({ is_active: false })
        .eq('id', certificateId)

      if (error) throw error

      await loadCertificates()
      alert('Certificado desativado com sucesso')
    } catch (err: any) {
      console.error('Erro ao desativar certificado:', err)
      alert('Erro ao desativar certificado: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este certificado? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('medical_certificates')
        .delete()
        .eq('id', certificateId)

      if (error) throw error

      await loadCertificates()
      alert('Certificado excluído com sucesso')
    } catch (err: any) {
      console.error('Erro ao excluir certificado:', err)
      alert('Erro ao excluir certificado: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const isCertificateExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date()
  }

  const isCertificateExpiringSoon = (expiresAt: string, days: number = 30): boolean => {
    const expirationDate = new Date(expiresAt)
    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays > 0 && diffDays <= days
  }

  const getCertificateStatus = (cert: Certificate) => {
    if (!cert.is_active) {
      return { label: 'Inativo', color: 'text-gray-500', icon: XCircle }
    }
    if (isCertificateExpired(cert.expires_at)) {
      return { label: 'Expirado', color: 'text-red-500', icon: AlertTriangle }
    }
    if (isCertificateExpiringSoon(cert.expires_at, 30)) {
      return { label: 'Expirando em breve', color: 'text-yellow-500', icon: AlertTriangle }
    }
    return { label: 'Ativo', color: 'text-green-500', icon: CheckCircle }
  }

  if (loading && certificates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary-400" />
                Gestão de Certificados Digitais
              </h1>
              <p className="text-slate-400">
                Gerencie seus certificados ICP-Brasil para assinatura digital de prescrições
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Certificado
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Add Certificate Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Adicionar Novo Certificado</h2>
            <form onSubmit={handleAddCertificate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Certificado *
                  </label>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as 'A1' | 'A3' | 'remote')}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="A1">A1 (Arquivo .pfx/.p12)</option>
                    <option value="A3">A3 (Token físico)</option>
                    <option value="remote">Remoto (API)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Autoridade Certificadora (AC) *
                  </label>
                  <select
                    value={acProvider}
                    onChange={(e) => setAcProvider(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Selecione a AC</option>
                    {AC_PROVIDERS.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                    💡 Por enquanto suportamos apenas <strong className="text-emerald-300">DigitalSign</strong>.
                    Outras autoridades certificadoras (Soluti, Certisign, Valid, Safeweb, Serasa) serão
                    habilitadas em breve. Já tem cert de outra AC? Avise o suporte.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data de Expiração *
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {certificateType === 'A1' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Arquivo do Certificado (.pfx/.p12)
                    </label>
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {certificateFile && (
                      <p className="mt-2 text-sm text-slate-400">
                        Arquivo selecionado: {certificateFile.name}
                      </p>
                    )}
                  </div>
                )}

                {certificateType === 'A1' && certificateFile && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Senha do Certificado
                    </label>
                    <input
                      type="password"
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Digite a senha do arquivo .pfx"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      É a <strong className="text-slate-200">senha do próprio arquivo .pfx</strong> — a que você
                      digitou no programa da AC (DigitalSign, Soluti, etc.) quando exportou o certificado.
                      Não é a senha do MedCannLab nem a do seu email.
                    </p>
                  </div>
                )}
              </div>

              {/* V1.9.179 — Painel de orientação leiga (qual senha + segurança) */}
              {certificateType === 'A1' && (
                <div className="mt-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-300 shrink-0" />
                    <h4 className="text-sm font-semibold text-blue-200">Como funciona — passo a passo</h4>
                  </div>
                  <ol className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside ml-1">
                    <li>
                      Você emitiu o certificado <strong className="text-white">.pfx</strong> no programa da AC
                      (DigitalSign A1, Soluti, etc.) e salvou em uma pasta no seu computador.
                    </li>
                    <li>
                      Aqui você anexa esse arquivo <strong className="text-white">.pfx</strong> e digita a
                      <strong className="text-white"> senha do próprio .pfx</strong> — a que o programa pediu pra você criar
                      quando exportou. <em className="text-slate-400">Em geral é a "Senha de Emissão" que veio no seu
                      email; mas se você criou outra ao exportar, use essa.</em>
                    </li>
                    <li>
                      Ao clicar <strong className="text-white">"Adicionar Certificado"</strong> o app cifra a senha
                      antes de salvar e envia o .pfx pro armazenamento privado e protegido.
                    </li>
                    <li>
                      Pronto. Da próxima vez que você for assinar uma prescrição, o app abre o seu .pfx
                      sozinho, assina com seu certificado real ICP-Brasil, e devolve a receita assinada
                      em padrão CFM 2.314/2022.
                    </li>
                  </ol>

                  <div className="border-t border-blue-500/20 pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-300 shrink-0" />
                      <h4 className="text-sm font-semibold text-emerald-200">É seguro? Sim — veja por quê</h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed ml-1">
                      <li>
                        🔒 <strong className="text-white">Senha cifrada em trânsito e no banco</strong> — usamos
                        AES-GCM (mesma criptografia de bancos digitais) com chave que fica só no servidor.
                        Nem o admin do banco consegue ler sua senha.
                      </li>
                      <li>
                        🔐 <strong className="text-white">Arquivo .pfx em armazenamento privado</strong> — só você
                        (e o sistema, com sua autorização) pode baixá-lo. Política RLS por usuário no Supabase.
                      </li>
                      <li>
                        ✅ <strong className="text-white">Você pode revogar a qualquer momento</strong> — basta
                        desativar ou excluir o certificado nesta tela.
                      </li>
                      <li>
                        ⚠️ <strong className="text-white">Nunca compartilhe seu .pfx ou senha</strong> com outra
                        pessoa fora do app — é equivalente à sua assinatura física e CRM no papel.
                      </li>
                      <li>
                        💾 <strong className="text-white">Faça backup do .pfx</strong> em pendrive ou cofre digital
                        (1Password, Bitwarden) — se o computador estourar e você perder o arquivo, precisa
                        comprar cert novo.
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-blue-500/20 pt-3">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 <strong className="text-slate-200">Errou a senha?</strong> Sem problema. Quando o app
                      tentar assinar uma prescrição vai dar erro claro — você volta aqui, exclui este registro,
                      e cadastra de novo com a senha correta. Não há dano.
                    </p>
                  </div>

                  {/* V1.9.299 — alerta crítico sobre chain ao exportar .pfx */}
                  <div className="border-t border-amber-500/30 pt-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                      <h4 className="text-sm font-semibold text-amber-200">
                        Ao exportar o .pfx — marque a opção da cadeia
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                      Quando você exportar seu certificado (Windows: <code className="text-amber-200">certmgr.msc</code>
                      → Exportar), marque <strong className="text-white">"Incluir todos os certificados no caminho
                      de certificação se possível"</strong>. Sem isso, validadores externos (validar.iti.gov.br,
                      Adobe Acrobat) podem não confirmar autenticidade.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      ⚙️ <strong className="text-slate-200">Cobertura automática</strong>: para certificados emitidos
                      pela <strong className="text-emerald-300">AC DigitalSign RFB G3</strong>, nosso sistema
                      adiciona a cadeia ICP-Brasil automaticamente mesmo se você esqueceu de marcar. Para outras
                      AC (Soluti, Certisign, Valid, Safeweb, etc.), re-exporte marcando a opção acima — ou avise
                      o suporte pra incluir sua AC na cadeia automática.
                    </p>
                  </div>

                  {/* V1.9.299 — sugestão de validação pós-cadastro */}
                  <div className="border-t border-blue-500/20 pt-3 mt-2">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      🧪 <strong className="text-slate-200">Quer testar?</strong> Após cadastrar, assine 1 prescrição
                      de teste, baixe o PDF e faça upload em <a
                        href="https://validar.iti.gov.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 underline hover:text-blue-200"
                      >validar.iti.gov.br</a> — deve aparecer "Assinatura válida" com seu nome.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Adicionar Certificado
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Certificates List */}
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
              <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum certificado cadastrado</h3>
              <p className="text-slate-400 mb-4">
                Adicione um certificado ICP-Brasil para poder assinar prescrições digitalmente
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Primeiro Certificado
              </button>
            </div>
          ) : (
            certificates.map(cert => {
              const status = getCertificateStatus(cert)
              const StatusIcon = status.icon
              
              return (
                <div
                  key={cert.id}
                  className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Key className="w-6 h-6 text-primary-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Certificado {cert.certificate_type} - {cert.ac_provider}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon className={`w-4 h-4 ${status.color}`} />
                            <span className={`text-sm ${status.color}`}>{status.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Tipo</p>
                          <p className="text-sm text-white">{cert.certificate_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">AC</p>
                          <p className="text-sm text-white">{cert.ac_provider}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expira em
                          </p>
                          <p className={`text-sm ${isCertificateExpired(cert.expires_at) ? 'text-red-400' : isCertificateExpiringSoon(cert.expires_at) ? 'text-yellow-400' : 'text-white'}`}>
                            {new Date(cert.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {cert.certificate_thumbprint && (
                        <div className="mt-4">
                          <p className="text-xs text-slate-400 mb-1">Thumbprint</p>
                          <p className="text-xs text-slate-500 font-mono break-all">{cert.certificate_thumbprint}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {cert.is_active && !isCertificateExpired(cert.expires_at) && (
                        <button
                          onClick={() => handleDeactivateCertificate(cert.id)}
                          className="px-3 py-1.5 text-sm bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors"
                        >
                          Desativar
                        </button>
                      )}
                      {!cert.is_active && (
                        <button
                          onClick={async () => {
                            try {
                              await supabase
                                .from('medical_certificates')
                                .update({ is_active: true })
                                .eq('id', cert.id)
                              await loadCertificates()
                            } catch (err: any) {
                              alert('Erro ao reativar certificado: ' + err.message)
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                        >
                          Reativar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default CertificateManagement
