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
import { ArrowLeft, Mail, Lock, User, Building, CheckCircle, KeyRound, Eye, EyeOff, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, resetPassword } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lgpdAccepted, setLgpdAccepted] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email inválido'
    }
    if (name === 'password' && mode === 'register' && value && value.length < 6) {
      return 'Mínimo 6 caracteres'
    }
    if (name === 'name' && mode === 'register' && value !== undefined && !value.trim()) {
      return 'Nome é obrigatório'
    }
    return ''
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const err = validateField(name, value)
    setFieldErrors((prev) => ({ ...prev, [name]: err }))
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setSuccessMessage('')
    setFieldErrors({})
    if (newMode === 'forgot') {
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
          // Check if this user has MOAI portal access → redirect there.
          // Falls back to agency operations view for regular users.
          const { data: { user: authUser } } = await supabase.auth.getUser()
          let destination = '/_v4/operations'
          if (authUser) {
            const { data: moaiAccess } = await supabase.rpc('resolve_moai_access', { p_user_id: authUser.id })
            const moaiRole = Array.isArray(moaiAccess) ? moaiAccess[0]?.role : moaiAccess?.role
            if (moaiRole) destination = '/moai'
          }
          navigate(destination)
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
        if (!lgpdAccepted) {
          setError('Você precisa aceitar os Termos e a Política de Privacidade para continuar.')
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
          navigate('/_v4/operations')
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
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-900)] rounded-lg flex items-center justify-center">
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
                        onBlur={handleBlur}
                        required
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          fieldErrors.name ? 'border-red-400' : 'border-slate-300'
                        }`}
                        placeholder="Seu nome"
                      />
                    </div>
                    {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
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
                    onBlur={handleBlur}
                    required
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.email ? 'border-red-400' : 'border-slate-300'
                    }`}
                    placeholder="seu@email.com"
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
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
                        className="text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] transition-colors font-medium"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        fieldErrors.password ? 'border-red-400' : 'border-slate-300'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                  {mode === 'register' && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      Use no mínimo 6 caracteres. Recomendamos combinar letras, números e símbolos.
                    </p>
                  )}
                </div>
              )}

              {/* LGPD consent — register only, required by law to be opt-in */}
              {mode === 'register' && (
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="lgpd-consent"
                    checked={lgpdAccepted}
                    onChange={(e) => setLgpdAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[var(--color-brand-600)] border-slate-300 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <label htmlFor="lgpd-consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                    Li e concordo com os{' '}
                    <Link to="/terms" target="_blank" className="text-[var(--color-brand-600)] hover:underline font-medium">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link to="/privacy" target="_blank" className="text-[var(--color-brand-600)] hover:underline font-medium">
                      Política de Privacidade
                    </Link>
                    , incluindo o tratamento de dados pessoais pela Efeito Digital conforme a LGPD (Lei 13.709/2018).
                  </label>
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
                className="w-full py-3 bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-900)] text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? submitLabels[mode].busy : submitLabels[mode].idle}
              </button>

              {mode === 'login' && (
                <button
                  type="button"
                  disabled={loading || !formData.email}
                  onClick={async () => {
                    setError('')
                    setSuccessMessage('')
                    if (!formData.email) {
                      setFieldErrors((p) => ({ ...p, email: 'Informe um e-mail' }))
                      return
                    }
                    setLoading(true)
                    const { error } = await supabase.auth.signInWithOtp({
                      email: formData.email,
                      options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                      },
                    })
                    setLoading(false)
                    if (error) setError(error.message || 'Falha ao enviar link mágico.')
                    else
                      setSuccessMessage(
                        `Enviamos um link de acesso para ${formData.email}. Expira em 15 minutos.`,
                      )
                  }}
                  className="mt-3 w-full py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  Entrar com link mágico
                </button>
              )}
            </form>
          )}

          {/* After success in forgot mode — back to login */}
          {successMessage && mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="w-full py-3 bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-900)] text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all font-medium mt-2"
            >
              Voltar para login
            </button>
          )}

          {/* Mode toggles */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <button
                onClick={() => switchMode('register')}
                className="text-sm text-slate-600 hover:text-[var(--color-brand-600)] transition-colors"
              >
                Não tem conta? <span className="font-semibold">Criar agora</span>
              </button>
            )}

            {mode === 'register' && (
              <button
                onClick={() => switchMode('login')}
                className="text-sm text-slate-600 hover:text-[var(--color-brand-600)] transition-colors"
              >
                Já tem conta? <span className="font-semibold">Entrar</span>
              </button>
            )}

            {mode === 'forgot' && !successMessage && (
              <button
                onClick={() => switchMode('login')}
                className="text-sm text-slate-600 hover:text-[var(--color-brand-600)] transition-colors"
              >
                Lembrou a senha? <span className="font-semibold">Voltar ao login</span>
              </button>
            )}
          </div>

          {/* Legal footer — always visible, LGPD requires easy access */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
              <Link to="/terms" className="hover:text-slate-900 transition-colors">
                Termos de Uso
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">
                Privacidade
              </Link>
              <span className="text-slate-300">•</span>
              <a
                href="mailto:jw@efeito.digital"
                className="hover:text-slate-900 transition-colors"
              >
                Suporte
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              © {new Date().getFullYear()} Efeito Digital Marketing e Comunicação LTDA
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
