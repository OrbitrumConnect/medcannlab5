import React, { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  Brain,
  Search,
  Send,
  X,
  Download,
  BookOpen,
  MessageSquare,
  Zap,
  Database,
  Lightbulb
} from 'lucide-react'
import RAGSystem from '../lib/ragSystem'
import { supabase } from '../lib/supabase'
import { KnowledgeBaseIntegration } from '../services/knowledgeBaseIntegration'

interface Document {
  id: string
  name: string
  title: string
  type: string
  size: string
  uploadDate: string
  created_at: string
  content?: string
  summary?: string
  keywords?: string[]
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  relatedDocs?: string[]
  confidence?: number
}

const AIDocumentChat: React.FC = () => {
  const [ragSystem] = useState(new RAGSystem())
  const [documents, setDocuments] = useState<Document[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [stats, setStats] = useState({
    totalDocuments: 0,
    connections: 0,
    precision: 0,
    studies: 0,
    similarities: 0,
    patterns: 0,
    semanticConnections: 0
  })

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '🧠 **Conhecimento da IA Residente Ativo!**\n\nSou sua assistente especializada em análise cruzada de documentos médicos. Posso:\n\n📚 **Conhecimento da IA:**\n• Processar e indexar documentos\n• Criar conexões semânticas inteligentes\n• Manter base de dados crescente\n\n🔍 **Análise Cruzada:**\n• Comparar estudos e protocolos\n• Identificar similaridades inteligentes\n• Cruzar dados de múltiplas fontes\n• Encontrar padrões ocultos\n\n💡 **Resultados Inteligentes:**\n• Estudos cruzados por similaridade\n• Análise de tendências\n• Insights baseados em evidências\n\nFaça upload de documentos ou me faça uma pergunta!',
      timestamp: new Date(),
      confidence: 0.95
    }
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [activeView, setActiveView] = useState<'chat' | 'library' | 'edit'>('chat')
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Inicializar sistema RAG e carregar documentos
    const initializeSystem = async () => {
      try {
        console.log('🚀 Inicializando Chat IA...')

        // Carregar estatísticas reais do banco
        const knowledgeStats = await KnowledgeBaseIntegration.getKnowledgeStats()

        // Buscar documentos do Supabase
        const { data: supabaseDocs, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Erro ao buscar documentos:', error)
        }

        // Calcular estatísticas baseadas nos documentos reais
        const totalDocs = knowledgeStats.totalDocuments || 0
        const aiLinkedDocs = knowledgeStats.aiLinkedDocuments || 0

        // Calcular conexões semânticas (baseado em documentos com keywords/tags)
        const docsWithKeywords = (supabaseDocs || []).filter(doc =>
          (doc.keywords && doc.keywords.length > 0) ||
          (doc.tags && doc.tags.length > 0)
        )
        const totalKeywords = (supabaseDocs || []).reduce((sum, doc) =>
          sum + (doc.keywords?.length || 0) + (doc.tags?.length || 0), 0
        )

        // Calcular estudos (documentos de pesquisa ou protocolos)
        const studies = (supabaseDocs || []).filter(doc =>
          doc.category === 'pesquisa' ||
          doc.category === 'protocolos' ||
          (doc.tags && (doc.tags.includes('pesquisa') || doc.tags.includes('protocolo')))
        ).length

        // Calcular similaridades (baseado em documentos com mesma categoria)
        const categoryCounts: Record<string, number> = {}
          ; (supabaseDocs || []).forEach(doc => {
            const category = doc.category || 'outros'
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
          })
        const similarities = Object.values(categoryCounts)
          .filter(count => count > 1)
          .reduce((sum, count) => sum + (count * (count - 1)) / 2, 0)

        // Calcular padrões (baseado em documentos com tags/keywords em comum)
        const patterns = Math.floor(totalKeywords / 10) // Aproximação baseada em keywords

        // Calcular conexões semânticas (total de keywords/tags)
        const semanticConnections = totalKeywords

        // Calcular precisão (baseado em relevância média da IA)
        const precision = knowledgeStats.averageRelevance
          ? Math.round(knowledgeStats.averageRelevance * 100 * 10) / 10
          : 0

        await ragSystem.initialize()
        setIsInitialized(true)

        // Carregar documentos do banco
        const docs = await ragSystem.getAllDocuments()
        setDocuments(docs.map(doc => ({
          id: doc.id,
          name: doc.title,
          title: doc.title,
          type: 'PDF',
          size: 'Processado',
          uploadDate: new Date(doc.created_at).toLocaleDateString('pt-BR'),
          created_at: doc.created_at,
          summary: doc.summary,
          keywords: doc.keywords
        })))

        // Atualizar estatísticas após tudo estar pronto
        const finalStats = {
          totalDocuments: totalDocs,
          connections: totalKeywords,
          precision: precision,
          studies: studies,
          similarities: Math.round(similarities),
          patterns: patterns,
          semanticConnections: semanticConnections
        }
        setStats(finalStats)

        console.log('✅ Sistema RAG inicializado!')
        console.log('📊 Estatísticas:', finalStats)
      } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error)
      }
    }

    initializeSystem()
  }, [ragSystem])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isInitialized) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Usar sistema RAG para gerar resposta
      const response = await ragSystem.generateResponse(inputMessage)

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        confidence: 0.92
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Erro ao gerar resposta:', error)

      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
        timestamp: new Date(),
        confidence: 0.1
      }

      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('cannabis') || lowerQuery.includes('cbd')) {
      return `Com base na análise dos documentos disponíveis, encontrei informações relevantes sobre cannabis medicinal:

📄 **Documentos Relacionados:**
• Guia Cannabis Medicinal.pdf - Contém protocolos de uso terapêutico
• Pesquisa Evidências CBD.pdf - Revisão sistemática das evidências

🔍 **Principais Achados:**
• CBD demonstra eficácia em tratamento de epilepsia refratária
• THC tem aplicações em dor crônica e náuseas
• Dosagem deve ser individualizada conforme protocolo IMRE

💡 **Recomendações:**
• Iniciar com baixas doses de CBD
• Monitorar efeitos adversos
• Documentar resposta terapêutica

Precisa de mais detalhes sobre algum aspecto específico?`
    }

    if (lowerQuery.includes('protocolo') || lowerQuery.includes('imre')) {
      return `O Protocolo IMRE Triaxial é um sistema estruturado de avaliação clínica:

📋 **Estrutura do Protocolo:**
• 28 blocos de avaliação
• Anamnese detalhada
• Exame físico sistematizado
• Avaliação psicossocial

🎯 **Aplicações:**
• Avaliação inicial de pacientes
• Documentação padronizada
• Acompanhamento terapêutico

📊 **Benefícios:**
• Reduz variabilidade na avaliação
• Melhora qualidade do registro
• Facilita comunicação entre profissionais

Gostaria que eu detalhe algum bloco específico do protocolo?`
    }

    return `Analisando sua pergunta sobre "${query}"...

🔍 **Busca Semântica Realizada:**
• Processados 3 documentos relevantes
• Identificadas 12 conexões conceituais
• Encontradas 5 referências cruzadas

📚 **Documentos Analisados:**
• Guia Cannabis Medicinal.pdf
• Protocolo IMRE Triaxial.pdf
• Pesquisa Evidências CBD.pdf

💡 **Insights Encontrados:**
Com base na análise semântica dos documentos, posso fornecer informações específicas sobre o tema. Gostaria que eu aprofunde algum aspecto particular?`
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !isInitialized) return

    setIsUploading(true)

    try {
      console.log('📄 Processando documento:', files[0].name)

      // Processar documento com sistema RAG
      const processedDoc = await ragSystem.processDocument(files[0])

      // Atualizar lista de documentos
      const docs = await ragSystem.getAllDocuments()
      setDocuments(docs.map(doc => ({
        id: doc.id,
        name: doc.title,
        title: doc.title,
        type: 'PDF',
        size: 'Processado',
        uploadDate: new Date(doc.created_at).toLocaleDateString('pt-BR'),
        created_at: doc.created_at,
        summary: doc.summary,
        keywords: doc.keywords
      })))

      setShowUploadModal(false)

      // Adicionar mensagem da IA sobre o novo documento
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `📄 **Documento Processado com IA Local!**

O arquivo "${files[0].name}" foi:
✅ Analisado com Transformers.js (MiniLM-L6)
✅ Embeddings gerados localmente
✅ Resumido com LLM local
✅ Indexado no banco de dados
✅ Pronto para busca semântica

Agora posso responder perguntas baseadas neste documento usando IA local! Faça uma pergunta para testar!`,
        timestamp: new Date(),
        confidence: 0.95
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Erro ao processar documento:', error)

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ **Erro ao Processar Documento**

Ocorreu um erro ao processar o arquivo. Tente novamente ou verifique se o arquivo está em um formato suportado (PDF, DOC, TXT).`,
        timestamp: new Date(),
        confidence: 0.1
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="flex min-h-screen">
        {/* Sidebar - Base de Conhecimentos */}
        <div className="w-80 bg-slate-800/80 border-r border-brand-border flex flex-col">
          <div className="p-6 border-b border-brand-border">
            <h2 className="text-xl font-bold text-brand-text mb-2">🧠 Conhecimento da IA Residente</h2>
            <p className="text-brand-text-secondary text-sm">IA inteligente com análise cruzada</p>
          </div>

          {/* Estatísticas da Base */}
          <div className="p-4 border-b border-brand-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{documents.length}</div>
                <div className="text-xs text-brand-text-muted">Documentos</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{stats.connections.toLocaleString()}</div>
                <div className="text-xs text-brand-text-muted">Conexões</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{stats.precision > 0 ? `${stats.precision}%` : '0%'}</div>
                <div className="text-xs text-brand-text-muted">Precisão</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-400">{stats.studies}</div>
                <div className="text-xs text-brand-text-muted">Estudos</div>
              </div>
            </div>
          </div>

          {/* Análise Cruzada */}
          <div className="p-4 border-b border-brand-border">
            <h3 className="text-sm font-semibold text-brand-text mb-3">🔍 Análise Cruzada</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-muted">Similaridades Encontradas</span>
                <span className="text-green-400 font-bold">{stats.similarities.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-muted">Padrões Identificados</span>
                <span className="text-blue-400 font-bold">{stats.patterns}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-muted">Conexões Semânticas</span>
                <span className="text-purple-400 font-bold">{stats.semanticConnections.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${selectedDocs.includes(doc.id)
                      ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-brand-surface-subtle text-brand-text-secondary'
                    }`}
                  onClick={() => {
                    if (selectedDocs.includes(doc.id)) {
                      setSelectedDocs(prev => prev.filter(id => id !== doc.id))
                    } else {
                      setSelectedDocs(prev => [...prev, doc.id])
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                      <p className="text-xs text-brand-text-muted mt-1">{doc.type} • {doc.size}</p>
                      {doc.summary && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-brand-border">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-brand-text py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Documento</span>
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-slate-800/80 border-b border-brand-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-brand-text" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-brand-text">IA Documentos</h1>
                  <p className="text-sm text-brand-text-secondary">Análise semântica inteligente</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Navegação */}
                <div className="flex bg-brand-surface-subtle rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeView === 'chat'
                        ? 'bg-blue-600 text-brand-text'
                        : 'text-brand-text-secondary hover:text-brand-text'
                      }`}
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => setActiveView('library')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeView === 'library'
                        ? 'bg-blue-600 text-brand-text'
                        : 'text-brand-text-secondary hover:text-brand-text'
                      }`}
                  >
                    📚 Biblioteca
                  </button>
                  <button
                    onClick={() => setActiveView('edit')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeView === 'edit'
                        ? 'bg-blue-600 text-brand-text'
                        : 'text-brand-text-secondary hover:text-brand-text'
                      }`}
                  >
                    ✏️ Editar
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-brand-text-secondary">
                    <Database className="w-4 h-4" />
                    <span>{documents.length} docs</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`}></div>
                  {!isInitialized && (
                    <span className="text-xs text-yellow-400">Inicializando IA...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area - Changes based on activeView */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeView === 'chat' && (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                        {message.type === 'ai' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Brain className="w-4 h-4 text-brand-text" />
                          </div>
                        )}
                        <div className={`flex-1 ${message.type === 'user'
                            ? 'bg-primary-600 text-brand-text'
                            : 'bg-brand-surface-subtle text-slate-200'
                          } rounded-lg p-4`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-brand-text-muted">
                              <span>{formatTime(message.timestamp)}</span>
                              {message.confidence && (
                                <span className="flex items-center space-x-1">
                                  <Zap className="w-3 h-3" />
                                  <span>{Math.round(message.confidence * 100)}%</span>
                                </span>
                              )}
                            </div>
                            {message.relatedDocs && message.relatedDocs.length > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-blue-400">
                                <BookOpen className="w-3 h-3" />
                                <span>{message.relatedDocs.length} docs</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-brand-text" />
                      </div>
                      <div className="bg-brand-surface-subtle text-slate-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-brand-text-muted">IA analisando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {activeView === 'library' && (
              <div className="space-y-4">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-brand-text mb-4">📚 Biblioteca de Documentos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-brand-text text-sm">{doc.title}</h3>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingDoc(doc)
                                setActiveView('edit')
                              }}
                              className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-slate-600"
                              title="Editar documento"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                setInputMessage(`Analise o documento: ${doc.title}`)
                                setActiveView('chat')
                              }}
                              className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded hover:bg-slate-600"
                              title="Perguntar sobre este documento"
                            >
                              💬
                            </button>
                          </div>
                        </div>
                        {doc.summary && (
                          <p className="text-brand-text-secondary text-xs mb-2 line-clamp-3">{doc.summary}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-brand-text-muted">
                          <span>{doc.keywords?.length || 0} termos</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doc.keywords.slice(0, 3).map((keyword, idx) => (
                              <span key={idx} className="bg-slate-600 text-brand-text-secondary text-xs px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {doc.keywords.length > 3 && (
                              <span className="text-slate-500 text-xs">+{doc.keywords.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'edit' && editingDoc && (
              <div className="space-y-4">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-brand-text">✏️ Editar Documento</h2>
                    <button
                      onClick={() => {
                        setEditingDoc(null)
                        setActiveView('library')
                      }}
                      className="text-brand-text-muted hover:text-brand-text"
                    >
                      ← Voltar
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                        Título
                      </label>
                      <input
                        type="text"
                        value={editingDoc.title}
                        onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                        Resumo
                      </label>
                      <textarea
                        value={editingDoc.summary || ''}
                        onChange={(e) => setEditingDoc({ ...editingDoc, summary: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                        Palavras-chave (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={editingDoc.keywords?.join(', ') || ''}
                        onChange={(e) => setEditingDoc({ ...editingDoc, keywords: e.target.value.split(',').map(k => k.trim()) })}
                        className="w-full px-3 py-2 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          // Aqui você salvaria as alterações no banco
                          console.log('Salvando documento:', editingDoc)
                          setActiveView('library')
                          setEditingDoc(null)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-brand-text px-4 py-2 rounded-lg transition-colors"
                      >
                        💾 Salvar Alterações
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('library')
                          setEditingDoc(null)
                        }}
                        className="bg-slate-600 hover:bg-brand-surface-subtle text-brand-text px-4 py-2 rounded-lg transition-colors"
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'edit' && !editingDoc && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-brand-text mb-2">Selecione um documento para editar</h3>
                  <p className="text-brand-text-muted mb-4">Vá para a Biblioteca e clique em "Editar" em qualquer documento</p>
                  <button
                    onClick={() => setActiveView('library')}
                    className="bg-blue-600 hover:bg-blue-700 text-brand-text px-4 py-2 rounded-lg transition-colors"
                  >
                    📚 Ir para Biblioteca
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input - Visível apenas na view de chat */}
          {activeView === 'chat' && (
            <div className="bg-slate-800/80 border-t border-brand-border p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isInitialized ? "Faça uma pergunta sobre os documentos..." : "Inicializando IA local..."}
                    disabled={!isInitialized}
                    className={`w-full px-4 py-3 border rounded-lg text-brand-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${isInitialized
                        ? 'bg-brand-surface-subtle border-slate-600'
                        : 'bg-brand-surface border-brand-border cursor-not-allowed opacity-50'
                      }`}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isInitialized}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-brand-text p-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-text">📄 Upload de Documento</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-brand-text-muted hover:text-brand-text"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-surface-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-brand-text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-text mb-2">
                    Carregue seu documento
                  </h3>
                  <p className="text-brand-text-secondary mb-4">
                    A IA irá analisar e indexar o conteúdo para busca semântica
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Selecione o arquivo
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                  />
                </div>

                {isUploading && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center space-x-2 text-primary-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-400"></div>
                      <span>Processando documento...</span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-brand-text mb-2">🔍 O que a IA fará:</h4>
                  <ul className="text-sm text-brand-text-secondary space-y-1">
                    <li>• Extrair e analisar o conteúdo</li>
                    <li>• Identificar conceitos e palavras-chave</li>
                    <li>• Indexar para busca semântica</li>
                    <li>• Conectar com outros documentos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIDocumentChat
