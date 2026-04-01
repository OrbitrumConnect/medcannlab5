import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Calendar, 
  ExternalLink, 
  Star,
  TrendingUp,
  Users,
  FileText,
  Microscope,
  Heart,
  Brain,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface NewsItem {
  id: string
  title: string
  summary: string
  author: string
  date: string
  category: string
  tags: string[]
}

interface NewsletterProps {
  className?: string
}

const Newsletter: React.FC<NewsletterProps> = ({ className = '' }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNewsItems()
  }, [selectedCategory])

  const loadNewsItems = async () => {
    setIsLoading(true)
    try {
      // Buscar da tabela base_conhecimento (fonte real de conteúdo científico)
      let query = supabase
        .from('base_conhecimento')
        .select('id, titulo, conteudo, autor, categoria, tags, data_atualizacao')
        .eq('ativo', true)
        .order('data_atualizacao', { ascending: false })
        .limit(20)

      if (selectedCategory !== 'all') {
        query = query.eq('categoria', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.warn('Erro ao carregar newsletter do banco:', error)
        setNewsItems([])
        return
      }

      if (data && data.length > 0) {
        const mapped: NewsItem[] = data.map(item => ({
          id: item.id,
          title: item.titulo,
          summary: item.conteudo?.substring(0, 200) + (item.conteudo?.length > 200 ? '...' : ''),
          author: item.autor,
          date: item.data_atualizacao || '',
          category: item.categoria,
          tags: Array.isArray(item.tags) ? item.tags as string[] : []
        }))
        setNewsItems(mapped)
      } else {
        setNewsItems([])
      }
    } catch (error) {
      console.error('Erro ao carregar newsletter:', error)
      setNewsItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pesquisa': return <Microscope className="w-4 h-4" />
      case 'clinica': return <Heart className="w-4 h-4" />
      case 'farmacologia': return <Brain className="w-4 h-4" />
      case 'nefrologia': return <Users className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pesquisa': return 'bg-purple-600'
      case 'clinica': return 'bg-green-600'
      case 'farmacologia': return 'bg-blue-600'
      case 'nefrologia': return 'bg-orange-600'
      default: return 'bg-slate-600'
    }
  }

  const categories = [
    { key: 'all', label: 'Todos', icon: <FileText className="w-4 h-4" /> },
    { key: 'pesquisa', label: 'Pesquisa', icon: <Microscope className="w-4 h-4" /> },
    { key: 'clinica', label: 'Clínica', icon: <Heart className="w-4 h-4" /> },
    { key: 'farmacologia', label: 'Farmacologia', icon: <Brain className="w-4 h-4" /> },
    { key: 'nefrologia', label: 'Nefrologia', icon: <Users className="w-4 h-4" /> }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
              <BookOpen className="w-6 h-6" />
              <span>Newsletter Científico</span>
            </h2>
            <p className="text-slate-300">
              Últimas pesquisas e descobertas em Cannabis Medicinal e Nefrologia
            </p>
          </div>
          <span className="flex items-center space-x-1 px-3 py-1 text-slate-300 border border-slate-500 rounded-md text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>Base de Conhecimento</span>
          </span>
        </div>

        {/* Filtros por categoria */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategory === category.key 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'text-slate-300 border border-slate-600 hover:bg-slate-700'
              }`}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de artigos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : newsItems.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 text-lg mb-1">Nenhum artigo encontrado</p>
          <p className="text-slate-400 text-sm">
            {selectedCategory !== 'all' 
              ? 'Tente outra categoria ou aguarde novos conteúdos.'
              : 'A base de conhecimento ainda não possui artigos publicados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white text-lg mb-2 hover:text-green-400 transition-colors cursor-pointer">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    {item.date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{item.author}</span>
                    </div>
                  </div>
                </div>
                <span className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${getCategoryColor(item.category)} text-white`}>
                  {getCategoryIcon(item.category)}
                  <span className="capitalize">{item.category}</span>
                </span>
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                {item.summary}
              </p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 text-xs text-slate-400 border border-slate-600 rounded">
                      #{String(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>📚 {newsItems.length} artigo{newsItems.length !== 1 ? 's' : ''} da base de conhecimento</span>
          <span className="px-2 py-1 text-xs text-green-400 border border-green-600 rounded">
            Supabase
          </span>
        </div>
      </div>
    </div>
  )
}

export default Newsletter
