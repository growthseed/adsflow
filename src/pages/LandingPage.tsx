/**
 * ============================================
 * LANDING PAGE — Ads Flow
 * ============================================
 * Página pública de apresentação do produto.
 * Hero + Features + How it Works + Pricing + CTA + Footer
 */

import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Zap,
  BarChart3,
  Megaphone,
  Target,
  FileText,
  Users,
  Link2,
  Layers,
  ShieldCheck,
  Crown,
  Rocket,
  Star,
} from 'lucide-react'

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

// =====================================================
// FEATURES DATA
// =====================================================

const FEATURES = [
  {
    icon: Layers,
    title: 'Editor Visual de Flows',
    desc: 'Arraste e solte nós para mapear campanhas, funis e jornadas do cliente em um canvas interativo.',
  },
  {
    icon: Megaphone,
    title: 'Campanhas & KPIs',
    desc: 'Visualize spend, impressões, cliques, CTR, CPC e ROAS de todas as contas em um único painel.',
  },
  {
    icon: Target,
    title: 'Funis de Conversão',
    desc: '8 templates prontos para Lead→WhatsApp, E-commerce, Retargeting, Webinar e mais.',
  },
  {
    icon: BarChart3,
    title: 'B.I. & Analytics',
    desc: 'Dashboard de vendas com funil, série temporal, responsáveis e motivos de perda.',
  },
  {
    icon: FileText,
    title: 'Relatórios Profissionais',
    desc: 'Gere relatórios de performance, crie links compartilháveis e exporte em PNG/PDF.',
  },
  {
    icon: Link2,
    title: 'Integrações Nativas',
    desc: 'Conecte Meta Ads, Google Ads, Kommo CRM e WhatsApp. Sync automático via N8N.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant & Equipe',
    desc: 'Gerencie múltiplos clientes, convide membros com 5 níveis de permissão (Owner→Viewer).',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança & RLS',
    desc: 'Row-Level Security no Supabase garante que cada membro vê apenas os dados do seu cliente.',
  },
]

const STEPS = [
  { num: '01', title: 'Conecte suas contas', desc: 'Vincule Meta Ads, Google Ads e CRM em minutos.' },
  { num: '02', title: 'Mapeie seus flows', desc: 'Crie fluxos visuais das suas campanhas e funis.' },
  { num: '03', title: 'Analise resultados', desc: 'Dashboards B.I. e relatórios com dados reais.' },
  { num: '04', title: 'Escale e otimize', desc: 'Tome decisões baseadas em dados, não em achismo.' },
]

const PLANS_PREVIEW = [
  { name: 'Starter', price: 97, highlight: false, features: ['3 contas de anúncio', '10 flows', '2 membros'] },
  { name: 'Pro', price: 247, highlight: true, features: ['15 contas', 'Flows ilimitados', '10 membros', 'Todas integrações'] },
  { name: 'Enterprise', price: 497, highlight: false, features: ['Tudo ilimitado', 'Suporte dedicado', 'White-label'] },
]

// =====================================================
// PAGE
// =====================================================

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const go = () => navigate('/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* ━━━ HEADER ━━━ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-900)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-extrabold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Ads Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline transition-colors">
              Planos
            </a>
            <button
              onClick={go}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md shadow-blue-600/20"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* ━━━ HERO ━━━ */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-6"
          >
            <Star className="w-4 h-4" />
            Alternativa brasileira ao Funnelytics + Reportei
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-[1.08] tracking-tight"
          >
            Gerencie campanhas com{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              visão completa
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Flows visuais, dashboards B.I., relatórios profissionais e integrações
            com Meta Ads, Google Ads e CRM — tudo em uma plataforma SaaS para agências.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={go}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg font-bold shadow-lg shadow-blue-600/25"
            >
              Começar Grátis
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all text-lg font-medium"
            >
              Ver Recursos
            </a>
          </motion.div>

          <motion.p variants={fadeUp} custom={4} className="mt-6 text-sm text-slate-400">
            Sem cartão de crédito • Setup em 2 minutos • Cancele quando quiser
          </motion.p>
        </motion.div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="bg-white border-y border-slate-200/60 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Tudo que sua agência precisa
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Uma plataforma completa para gestão de tráfego pago, da estratégia ao relatório final.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-200 rounded-2xl p-6 transition-all hover:shadow-lg"
              >
                <div className="w-11 h-11 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-slate-500">4 passos para transformar suas campanhas</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="text-5xl font-black text-blue-100 mb-3">{s.num}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING PREVIEW ━━━ */}
      <section id="pricing" className="bg-slate-900 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-lg text-slate-400">Escolha o plano ideal para o tamanho da sua agência.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS_PREVIEW.map((plan, i) => {
              const Icon = i === 0 ? Zap : i === 1 ? Crown : Rocket
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`relative rounded-2xl p-7 ${
                    plan.highlight
                      ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white ring-2 ring-blue-400 scale-105'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                      Mais Popular
                    </span>
                  )}
                  <Icon className={`w-8 h-8 mb-4 ${plan.highlight ? 'text-white' : 'text-blue-400'}`} />
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="mb-5">
                    <span className="text-3xl font-extrabold">R$ {plan.price}</span>
                    <span className="text-sm opacity-70">/mês</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={go}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      plan.highlight
                        ? 'bg-white text-indigo-700 hover:bg-slate-100'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    Começar Agora
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-white shadow-2xl shadow-blue-600/20"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Pronto para transformar sua agência?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Junte-se às agências que já gerenciam campanhas de forma visual e profissional.
            </p>
            <button
              onClick={go}
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all text-lg font-bold shadow-lg"
            >
              Criar Conta Grátis
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-900)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-semibold text-slate-900">Ads Flow</span>
              <span className="text-slate-400 text-sm">by Efeito Digital</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 Ads Flow — Efeito Digital. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
