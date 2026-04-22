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
import { BookOpen, CheckCircle2, ListChecks, Pencil, Plus, Sparkles } from 'lucide-react'
import { PLAYBOOK_PRINCIPLES } from '@/data/playbook'
import { RenderMarkdown } from '@/lib/renderMarkdown'
import { useAuth } from '@/contexts/AuthContext'
import { usePlaybookDocs, type PlaybookDocRow } from '@/features/playbook/hooks/usePlaybookDocs'
import { PlaybookDocEditor } from '@/features/playbook/PlaybookDocEditor'

export default function PlaybookPage() {
  const [activeSlug, setActiveSlug] = useState<string>('overview')
  const { docs, save, remove } = usePlaybookDocs()
  const { user } = useAuth()
  const canEdit = user?.globalRole === 'super_admin' || user?.globalRole === 'admin'
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PlaybookDocRow | null>(null)

  const activeDoc = useMemo(() => docs.find((d) => d.slug === activeSlug), [docs, activeSlug])
  const intros = docs.filter((d) => d.category === 'intro')
  const checklists = docs.filter((d) => d.category === 'checklist')
  const others = docs.filter((d) => d.category !== 'intro' && d.category !== 'checklist')

  const openNew = () => {
    setEditing(null)
    setEditorOpen(true)
  }
  const openEdit = (doc: PlaybookDocRow) => {
    setEditing(doc)
    setEditorOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-slate-50">
      {/* Left rail — doc index */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Ads Playbook</h2>
              <p className="text-[10px] text-slate-500">Efeito Digital · interno</p>
            </div>
            {canEdit && (
              <button
                onClick={openNew}
                aria-label="novo doc"
                title="Criar novo doc"
                className="w-7 h-7 grid place-items-center rounded-md bg-brand-600 hover:bg-brand-700 text-white"
              >
                <Plus size={14} />
              </button>
            )}
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
              canEdit={canEdit}
              onClick={() => setActiveSlug(doc.slug)}
              onEdit={openEdit}
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
              canEdit={canEdit}
              onClick={() => setActiveSlug(doc.slug)}
              onEdit={openEdit}
            />
          ))}

          {others.length > 0 && (
            <>
              <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Referências
              </p>
              {others.map((doc) => (
                <DocLink
                  key={doc.slug}
                  doc={doc}
                  active={activeSlug === doc.slug}
                  canEdit={canEdit}
                  onClick={() => setActiveSlug(doc.slug)}
                  onEdit={openEdit}
                />
              ))}
            </>
          )}
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
            <OverviewPane checklists={checklists} onOpen={setActiveSlug} />
          ) : activeDoc ? (
            <article>
              <header className="mb-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                    {activeDoc.category === 'intro' ? 'Introdução' : activeDoc.category === 'checklist' ? 'Checklist' : activeDoc.category === 'vertical' ? 'Vertical' : 'Referência'}
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900">{activeDoc.title}</h1>
                  {activeDoc.description && (
                    <p className="mt-1 text-sm text-slate-500">{activeDoc.description}</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => openEdit(activeDoc)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700"
                  >
                    <Pencil size={12} />
                    {activeDoc.source === 'static' ? 'Customizar' : 'Editar'}
                  </button>
                )}
              </header>
              <RenderMarkdown source={activeDoc.content} />
            </article>
          ) : (
            <p className="text-slate-500">Documento não encontrado.</p>
          )}
        </div>
      </main>

      <PlaybookDocEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}

function DocLink({
  doc,
  active,
  canEdit,
  onClick,
  onEdit,
}: {
  doc: PlaybookDocRow
  active: boolean
  canEdit: boolean
  onClick: () => void
  onEdit: (doc: PlaybookDocRow) => void
}) {
  const Icon = doc.category === 'intro' ? BookOpen : ListChecks
  return (
    <div
      className={`group relative flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors ${
        active ? 'bg-[var(--color-brand-50)] border-l-2 border-[var(--color-brand-600)]' : 'hover:bg-slate-50 border-l-2 border-transparent'
      }`}
    >
      <button onClick={onClick} className="flex-1 flex items-start gap-2.5 min-w-0 text-left">
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
            {doc.source === 'static' && (
              <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-widest text-amber-600">
                base
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
            {doc.description}
          </p>
        </div>
      </button>
      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(doc)
          }}
          aria-label={`editar ${doc.title}`}
          title="Editar doc"
          className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 grid place-items-center rounded text-slate-400 hover:bg-white hover:text-slate-900 transition-opacity"
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
  )
}

function OverviewPane({ checklists, onOpen }: { checklists: PlaybookDocRow[]; onOpen: (slug: string) => void }) {
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
          {checklists.map((doc) => (
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
