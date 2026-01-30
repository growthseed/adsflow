import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight, CheckCircle, Zap, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleGetStarted = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Ads Flow</span>
            </div>

            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Visualize suas estratégias de{' '}
            <span className="bg-gradient-to-r from-blue-600 to-slate-800 bg-clip-text text-transparent">
              marketing digital
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Transforme campanhas complexas em fluxos visuais intuitivos. 
            Conecte Meta Ads, Google Ads e gerencie tudo em um único lugar.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-slate-800 text-white rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg font-semibold"
          >
            Começar Grátis
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Editor Visual Intuitivo
            </h3>
            <p className="text-slate-600">
              Arraste e solte elementos para criar fluxos de campanha de forma visual e organizada.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Integração com Plataformas
            </h3>
            <p className="text-slate-600">
              Conecte Meta Ads e Google Ads para visualizar métricas em tempo real direto no fluxo.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Templates Prontos
            </h3>
            <p className="text-slate-600">
              Comece rápido com templates para diferentes tipos de campanha e objetivos de marketing.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-slate-800 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar suas campanhas?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se às agências que já visualizam suas estratégias de forma profissional.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors text-lg font-semibold"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-semibold text-slate-900">Ads Flow</span>
            </div>
            <p className="text-sm text-slate-600">
              © 2026 Ads Flow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
