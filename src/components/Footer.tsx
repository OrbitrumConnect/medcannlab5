import React from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

interface FooterProps {
  marginLeft?: string
  width?: string
}

const Footer: React.FC<FooterProps> = ({ marginLeft, width }) => {
  return (
    <footer 
      className="bg-gray-900 text-white transition-all duration-300"
      style={{ 
        marginLeft: marginLeft || '0px',
        width: width || 'auto'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-1.5 mb-2 md:mb-0">
            <div className="w-4 h-4 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-base font-bold">
              MedCannLab
              <span className="text-xs text-primary-400 ml-0.5">3.0</span>
            </span>
          </div>
          
          <div className="flex space-x-4 text-xs">
            <Link to="/courses" className="text-gray-300 hover:text-white transition-colors duration-200">
              Cursos
            </Link>
            <Link to="/clinical-assessment" className="text-gray-300 hover:text-white transition-colors duration-200">
              Avaliação
            </Link>
            <Link to="/library" className="text-gray-300 hover:text-white transition-colors duration-200">
              Biblioteca
            </Link>
            <Link to="/admin" className="text-gray-300 hover:text-white transition-colors duration-200">
              Admin
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-2 pt-2">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-[10px]">
              © 2025 MedCannLab 3.0. Todos os direitos reservados.
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5 md:mt-0 flex items-center">
              Feito com <Heart className="w-2.5 h-2.5 text-red-500 mx-0.5" /> para a medicina
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
