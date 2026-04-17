/**
 * ============================================
 * PlaybookPage — Efeito Ads Playbook inside AdFlow
 * ============================================
 * Surfaces the proprietary playbook (philosophy, checklists,
 * vertical heuristics) as an in-app reference. Content is loaded
 * at build-time via `?raw` imports — zero network, zero auth.
 * ============================================
 */

import { useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ListChecks, Sparkles } from 'lucide-react'
import { PLAYBOOK_DOCS, PLAYBOOK_PRINCIPLES, getPlaybookDoc } from '@/data/playbook'
import { RenderMarkdown } from '@/lib/renderMarkdown'

export default function PlaybookPage() {
  const [activeSlug, setActiveSlug] = useState<string>('overview')
  const activeDoc = useMemo(() => getPlaybookDoc(activeSlug), [activeSlug])

  const intros = PLAYBOOK_DOCS.filter((d) => d.category === 'intro')
  const checklists = PLAYBOOK_DOCS.filter((d) => d.category === 'checklist')

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-slate-50">
      {/* Left rail — doc index */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ads Playbook</h2>
              <p className="text-[10px] text-slate-500">Efeito Digital · interno</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Introdução
          </p>
          {intros.map((doc) => (
            <DocLink
              key={doc.slug}
              doc={doc}
              active={activeSlug === doc.slug}
              onClick={() => setActiveSlug(doc.slug)}
            />
          ))}

          <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Checklists
          </p>
          {checklists.map((doc) => (
            <DocLink
              key={doc.slug}
              doc={doc}
              active={activeSlug === doc.slug}
              onClick={() => setActiveSlug(doc.slug)}
            />
          ))}
        </nav>

        {/* Principles footer — always visible reminder */}
        <div className="border-t border-slate-100 p-3 bg-amber-50/40">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Princípios
            </p>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {PLAYBOOK_PRINCIPLES.length} regras não-negociáveis norteiam toda auditoria.
          </p>
        </div>
      </aside>

      {/* Right pane — content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {activeSlug === 'overview' ? (
            <OverviewPane onOpen={setActiveSlug} />
          ) : activeDoc ? (
            <article>
              <header className="mb-6 pb-4 border-b border-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  {activeDoc.category === 'intro' ? 'Introdução' : 'Checklist'}
                </p>
                <h1 className="text-2xl font-bold text-slate-900">{activeDoc.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{activeDoc.description}</p>
              </header>
              <RenderMarkdown source={activeDoc.content} />
            </article>
          ) : (
            <p className="text-slate-500">Documento não encontrado.</p>
          )}
        </div>
      </main>
    </div>
  )
}

function DocLink({
  doc,
  active,
  onClick,
}: {
  doc: (typeof PLAYBOOK_DOCS)[number]
  active: boolean
  onClick: () => void
}) {
  const Icon = doc.category === 'intro' ? BookOpen : ListChecks
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors ${
        active ? 'bg-[var(--color-brand-50)] border-l-2 border-[var(--color-brand-600)]' : 'hover:bg-slate-50 border-l-2 border-transparent'
      }`}
    >
      <Icon
        className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[var(--color-brand-600)]' : 'text-slate-400'}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-medium leading-tight ${
            active ? 'text-blue-900' : 'text-slate-700'
          }`}
        >
          {doc.title}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
          {doc.description}
        </p>
      </div>
    </button>
  )
}

function OverviewPane({ onOpen }: { onOpen: (slug: string) => void }) {
  return (
    <div>
      <header className="mb-6 pb-4 border-b border-slate-200">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-1">
          Efeito Digital · Proprietário
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Ads Playbook</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Consolidado das melhores práticas da agência para Google Ads e Meta Ads.
          Checklists de auditoria, heurísticas por vertical, lições de campanhas reais.
        </p>
      </header>

      {/* Princípios não-negociáveis */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
          Princípios não-negociáveis
        </h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <ol className="space-y-2">
            {PLAYBOOK_PRINCIPLES.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold text-slate-900">{i + 1}.</span> {p}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Checklists cards */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
          Checklists rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLAYBOOK_DOCS.filter((d) => d.category === 'checklist').map((doc) => (
            <button
              key={doc.slug}
              onClick={() => onOpen(doc.slug)}
              className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ListChecks className="w-4 h-4 text-[var(--color-brand-600)]" />
                <p className="text-[13px] font-semibold text-slate-900">{doc.title}</p>
              </div>
              <p className="text-[12px] text-slate-500 leading-snug">{doc.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
