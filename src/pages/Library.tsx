import React, { useState } from 'react'
import { 
  Search, 
  Eye, 
  FileText, 
  Star
} from 'lucide-react'

const Library: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  const categories = [
    { id: 'all', name: 'Todos', count: 1247 },
    { id: 'methodology', name: 'Metodologia', count: 156 },
    { id: 'research', name: 'Pesquisa', count: 423 },
    { id: 'protocols', name: 'Protocolos', count: 89 },
    { id: 'guidelines', name: 'Diretrizes', count: 234 },
    { id: 'case-studies', name: 'Casos Clínicos', count: 345 }
  ]

  const documentTypes = [
    { id: 'all', name: 'Todos os Tipos', icon: '📁' },
    { id: 'pdf', name: 'PDF', icon: '📄' },
    { id: 'video', name: 'Vídeo', icon: '🎥' },
    { id: 'image', name: 'Imagem', icon: '🖼️' },
    { id: 'book', name: 'Livro', icon: '📚' }
  ]

  const documents = [
    {
      id: 1,
      title: 'Metodologia AEC - Arte da Entrevista Clínica',
      description: 'Guia completo sobre a metodologia AEC para entrevistas clínicas humanizadas',
      category: 'methodology',
      type: 'pdf',
      size: '2.4 MB',
      uploadDate: '2025-01-10',
      author: 'Dr. João Silva',
      downloads: 1247,
      rating: 4.9,
      tags: ['AEC', 'Entrevista', 'Humanização'],
      isLinkedToAI: true,
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: 2,
      title: 'Protocolo de Avaliação IMRE Triaxial',
      description: 'Protocolo completo para avaliação clínica com sistema IMRE de 28 blocos',
      category: 'protocols',
      type: 'pdf',
      size: '1.8 MB',
      uploadDate: '2025-01-08',
      author: 'Dra. Maria Santos',
      downloads: 892,
      rating: 4.8,
      tags: ['IMRE', 'Avaliação', 'Protocolo'],
      isLinkedToAI: true,
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: 3,
      title: 'Cannabis Medicinal - Evidências Científicas',
      description: 'Revisão sistemática das evidências científicas sobre cannabis medicinal',
      category: 'research',
      type: 'pdf',
      size: '3.2 MB',
      uploadDate: '2025-01-05',
      author: 'Dr. Carlos Oliveira',
      downloads: 634,
      rating: 4.7,
      tags: ['Cannabis', 'Pesquisa', 'Evidências'],
      isLinkedToAI: false,
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: 4,
      title: 'Aula 1: Introdução à Entrevista Clínica',
      description: 'Vídeo-aula introdutória sobre técnicas de entrevista clínica',
      category: 'methodology',
      type: 'video',
      size: '45 MB',
      uploadDate: '2025-01-03',
      author: 'Dra. Ana Costa',
      downloads: 456,
      rating: 4.6,
      tags: ['Vídeo', 'Aula', 'Entrevista'],
      isLinkedToAI: true,
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: 5,
      title: 'Diretrizes de Prescrição de Cannabis',
      description: 'Diretrizes oficiais para prescrição de cannabis medicinal no Brasil',
      category: 'guidelines',
      type: 'pdf',
      size: '1.5 MB',
      uploadDate: '2025-01-01',
      author: 'ANVISA',
      downloads: 789,
      rating: 4.9,
      tags: ['Diretrizes', 'Cannabis', 'Prescrição'],
      isLinkedToAI: true,
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: 6,
      title: 'Atlas de Anatomia Renal',
      description: 'Atlas completo com imagens detalhadas da anatomia renal',
      category: 'research',
      type: 'image',
      size: '8.7 MB',
      uploadDate: '2024-12-28',
      author: 'Dr. Pedro Lima',
      downloads: 234,
      rating: 4.5,
      tags: ['Anatomia', 'Rim', 'Atlas'],
      isLinkedToAI: false,
      thumbnail: '/api/placeholder/200/150'
    }
  ]

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesType = selectedType === 'all' || doc.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <span className="text-red-500 text-xl">📄</span>
      case 'video':
        return <span className="text-blue-500 text-xl">🎥</span>
      case 'image':
        return <span className="text-green-500 text-xl">🖼️</span>
      case 'book':
        return <span className="text-purple-500 text-xl">📚</span>
      default:
        return <span className="text-gray-500 text-xl">📁</span>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">
            Biblioteca Geral
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Acesse documentos, protocolos, pesquisas e recursos educacionais
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-200/50 dark:bg-slate-700/80 text-slate-900 dark:text-white dark:text-slate-100"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-200/50 dark:bg-slate-700/80 text-slate-900 dark:text-white dark:text-slate-100"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <select
                value={selectedType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-200/50 dark:bg-slate-700/80 text-slate-900 dark:text-white dark:text-slate-100"
              >
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <button className="btn-primary flex items-center justify-center">
              <span className="mr-2">➕</span>
              Upload
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="card card-hover overflow-hidden">
              {/* Document Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  {getTypeIcon(doc.type)}
                </div>
                {doc.isLinkedToAI && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary-500 text-slate-900 dark:text-white px-2 py-1 rounded-full text-xs font-medium">
                      IA
                    </div>
                  </div>
                )}
              </div>

              {/* Document Content */}
              <div className="p-6">
                {/* Title and Description */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {doc.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Document Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="mr-1">👤</span>
                      {doc.author}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🕒</span>
                      {formatDate(doc.uploadDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{doc.size}</span>
                    <span className="flex items-center">
                      <span className="mr-1">⬇️</span>
                      {doc.downloads}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                    <span className="mr-2">⬇️</span>
                    Baixar
                  </button>
                  <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors duration-200">
                    <Eye className="w-4 h-4" />
                  </button>
                  {doc.isLinkedToAI && (
                    <button className="bg-accent-600 hover:bg-accent-700 text-slate-900 dark:text-white py-2 px-4 rounded-lg transition-colors duration-200">
                      <span>#</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 text-gray-400 mx-auto mb-4 text-4xl">📁</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white dark:text-slate-100 mb-2">
              Nenhum documento encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tente ajustar os filtros ou fazer uma nova busca
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">1,247</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Documentos</div>
          </div>
          <div className="card p-6 text-center">
            <div className="w-8 h-8 text-green-600 mx-auto mb-2 text-2xl">⬇️</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">15,234</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Downloads</div>
          </div>
          <div className="card p-6 text-center">
            <div className="w-8 h-8 text-purple-600 mx-auto mb-2 text-2xl">#</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">89</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Vinculados à IA</div>
          </div>
          <div className="card p-6 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">4.8</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Avaliação Média</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Library
