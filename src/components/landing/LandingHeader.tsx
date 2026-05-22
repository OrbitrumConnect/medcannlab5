import { Link } from 'react-router-dom'

interface LandingHeaderProps {
  onLoginClick?: () => void
}

export const LandingHeader = ({ onLoginClick }: LandingHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="container mx-auto flex items-center justify-between py-3 px-6">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 193, 106, 0.2)',
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}brain.png`}
              alt="MedCannLab Logo"
              className="w-full h-full object-contain p-1"
              style={{
                filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0, 193, 106, 0.6))',
              }}
            />
          </div>
          <div>
            <span className="text-xl font-bold block text-white tracking-tight leading-none">MedCannLab</span>
            <div className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase ml-0.5 mt-0.5">
              Plataforma 3.0
            </div>
          </div>
        </Link>

        <button
          onClick={onLoginClick}
          className="px-5 py-2 bg-slate-800/50 border border-slate-700 hover:border-emerald-500/40 rounded-xl text-sm font-medium text-white transition-all"
        >
          Entrar
        </button>
      </div>
    </header>
  )
}
