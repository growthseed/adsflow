import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Mail, Lock, User, Building } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password)
        if (success) {
          navigate('/dashboard')
        } else {
          setError('Email ou senha incorretos')
        }
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          setError('Preencha todos os campos obrigatórios')
          setLoading(false)
          return
        }

        const success = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          company: formData.company
        })

        if (success) {
          navigate('/dashboard')
        } else {
          setError('Erro ao criar conta. Tente novamente.')
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Ads Flow</span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h1>
            <p className="text-slate-600">
              {isLogin
                ? 'Entre para acessar seus flows'
                : 'Comece a visualizar suas campanhas'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Empresa (opcional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-slate-800 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setFormData({ email: '', password: '', name: '', company: '' })
              }}
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              {isLogin ? (
                <>
                  Não tem conta? <span className="font-semibold">Criar agora</span>
                </>
              ) : (
                <>
                  Já tem conta? <span className="font-semibold">Entrar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
