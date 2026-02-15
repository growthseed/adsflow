/**
 * ============================================
 * LOGIN PAGE - Multi-mode Auth
 * ============================================
 * Data: 2026-01-20 | Atualizado: 2026-02-13
 * Modos: login, register, forgot-password
 * Integrado com AuthContext multi-tenant.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Mail, Lock, User, Building, CheckCircle, KeyRound } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, resetPassword } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
  })

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setSuccessMessage('')
    if (newMode === 'forgot') {
      // Keep email if already filled
      setFormData((prev) => ({ ...prev, password: '', name: '', company: '' }))
    } else {
      setFormData({ email: '', password: '', name: '', company: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const success = await login(formData.email, formData.password)
        if (success) {
          navigate('/dashboard')
        } else {
          setError('Email ou senha incorretos.')
        }
      } else if (mode === 'register') {
        if (!formData.name || !formData.email || !formData.password) {
          setError('Preencha todos os campos obrigatórios.')
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.')
          setLoading(false)
          return
        }
        const success = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          company: formData.company,
        })
        if (success) {
          navigate('/dashboard')
        } else {
          setError('Erro ao criar conta. Verifique os dados e tente novamente.')
        }
      } else if (mode === 'forgot') {
        if (!formData.email) {
          setError('Informe seu email.')
          setLoading(false)
          return
        }
        const { error: resetError } = await resetPassword(formData.email)
        if (resetError) {
          setError('Erro ao enviar email de recuperação. Verifique o endereço.')
        } else {
          setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.')
        }
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // --- Mode config ---
  const titles: Record<AuthMode, { heading: string; sub: string }> = {
    login: { heading: 'Bem-vindo de volta', sub: 'Entre para acessar seus flows' },
    register: { heading: 'Criar conta', sub: 'Comece a gerenciar suas campanhas' },
    forgot: { heading: 'Recuperar senha', sub: 'Enviaremos um link para redefinir sua senha' },
  }

  const submitLabels: Record<AuthMode, { idle: string; busy: string }> = {
    login: { idle: 'Entrar', busy: 'Entrando...' },
    register: { idle: 'Criar conta', busy: 'Criando...' },
    forgot: { idle: 'Enviar link de recuperação', busy: 'Enviando...' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back */}
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
              {titles[mode].heading}
            </h1>
            <p className="text-slate-600">{titles[mode].sub}</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-700">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Register-only fields */}
              {mode === 'register' && (
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
                        required
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

              {/* Email — all modes */}
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
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Password — login and register only */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Senha *
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Forgot mode icon hint */}
              {mode === 'forgot' && (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Você receberá um link seguro por email.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-slate-800 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? submitLabels[mode].busy : submitLabels[mode].idle}
              </button>
            </form>
          )}

          {/* After success in forgot mode — back to login */}
          {successMessage && mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-slate-800 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all font-medium mt-2"
            >
              Voltar para login
            </button>
          )}

          {/* Mode toggles */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <button
                onClick={() => switchMode('register')}
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Não tem conta? <span className="font-semibold">Criar agora</span>
              </button>
            )}

            {mode === 'register' && (
              <button
                onClick={() => switchMode('login')}
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Já tem conta? <span className="font-semibold">Entrar</span>
              </button>
            )}

            {mode === 'forgot' && !successMessage && (
              <button
                onClick={() => switchMode('login')}
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Lembrou a senha? <span className="font-semibold">Voltar ao login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
