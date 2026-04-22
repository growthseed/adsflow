import { useEffect, useState } from 'react'
import { BookOpen, Eye, FileEdit, Loader2, Trash2, X } from 'lucide-react'

import { RenderMarkdown } from '@/lib/renderMarkdown'
import type { PlaybookDocRow } from './hooks/usePlaybookDocs'

interface Props {
  open: boolean
  initial?: PlaybookDocRow | null
  onClose: () => void
  onSave: (draft: Partial<PlaybookDocRow> & { slug: string; title: string; content: string }) => Promise<{ ok: boolean; error?: string }>
  onDelete?: (id: string) => Promise<{ ok: boolean; error?: string }>
}

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PlaybookDocEditor({ open, initial, onClose, onSave, onDelete }: Props) {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'intro' | 'checklist' | 'vertical' | 'reference'>('checklist')
  const [content, setContent] = useState('')
  const [active, setActive] = useState(true)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [slugDirty, setSlugDirty] = useState(false)

  useEffect(() => {
    if (!open) return
    setSlug(initial?.slug ?? '')
    setTitle(initial?.title ?? '')
    setDescription(initial?.description ?? '')
    setCategory(((initial?.category as 'intro' | 'checklist' | 'vertical' | 'reference') ?? 'checklist'))
    setContent(initial?.content ?? '')
    setActive(initial?.active ?? true)
    setPreview(false)
    setErr(null)
    setSlugDirty(!!initial?.slug)
  }, [open, initial])

  // Auto-slug do título enquanto user não tocou no slug
  useEffect(() => {
    if (!slugDirty && title) setSlug(slugify(title))
  }, [title, slugDirty])

  if (!open) return null

  const submit = async () => {
    setErr(null)
    if (!slug.trim() || !title.trim() || !content.trim()) {
      setErr('Preencha slug, título e conteúdo')
      return
    }
    setSaving(true)
    const res = await onSave({
      id: initial?.id ?? undefined,
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim() || null,
      category,
      content,
      active,
    })
    setSaving(false)
    if (!res.ok) {
      setErr(res.error ?? 'Erro ao salvar')
      return
    }
    onClose()
  }

  const doDelete = async () => {
    if (!initial?.id || !onDelete) return
    if (!confirm(`Remover "${initial.title}"? Essa ação não pode ser desfeita.`)) return
    setDeleting(true)
    const res = await onDelete(initial.id)
    setDeleting(false)
    if (!res.ok) {
      setErr(res.error ?? 'Erro ao remover')
      return
    }
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[var(--shadow-overlay)] w-full max-w-5xl max-h-[92vh] flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white grid place-items-center shrink-0">
              <BookOpen size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-neutral-900">
                {initial?.id ? 'Editar doc do Playbook' : 'Novo doc do Playbook'}
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Markdown completo — renderizado no Playbook interno.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreview((p) => !p)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium ${
                preview ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {preview ? <FileEdit size={12} /> : <Eye size={12} />}
              {preview ? 'Editar' : 'Preview'}
            </button>
            <button onClick={onClose} aria-label="fechar" className="w-8 h-8 grid place-items-center rounded-md text-neutral-500 hover:bg-neutral-100">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Metadata sidebar */}
          <div className="lg:w-80 lg:border-r border-neutral-100 px-5 py-4 space-y-3 overflow-y-auto">
            <Field label="Título">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Google Ads Audit — 30 dias"
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:border-brand-500"
              />
            </Field>
            <Field label="Slug (URL)">
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value))
                  setSlugDirty(true)
                }}
                placeholder="google-ads-audit"
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-brand-500"
              />
            </Field>
            <Field label="Categoria">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'intro' | 'checklist' | 'vertical' | 'reference')}
                className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="intro">Introdução</option>
                <option value="checklist">Checklist</option>
                <option value="vertical">Vertical</option>
                <option value="reference">Referência</option>
              </select>
            </Field>
            <Field label="Descrição curta">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="1 linha pra aparecer no menu"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[12px] focus:outline-none focus:border-brand-500 resize-none"
              />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-neutral-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4"
              />
              Visível no Playbook
            </label>

            {err && (
              <div className="text-[12px] text-error-600 bg-error-50 border border-error-100 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
          </div>

          {/* Editor + preview */}
          <div className="flex-1 overflow-y-auto p-5">
            {preview ? (
              <div className="prose prose-slate max-w-none text-[14px]">
                <RenderMarkdown source={content} />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Título\n\nConteúdo em **Markdown** aqui…"
                className="w-full h-full min-h-[300px] px-4 py-3 border border-neutral-200 rounded-lg text-[13px] font-mono leading-relaxed resize-none focus:outline-none focus:border-brand-500"
              />
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 px-5 py-3 bg-neutral-50 border-t border-neutral-100 rounded-b-2xl">
          {initial?.id && onDelete ? (
            <button
              onClick={doDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 rounded-md disabled:opacity-50"
            >
              {deleting && <Loader2 size={12} className="animate-spin" />}
              <Trash2 size={12} /> Remover
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {initial?.id ? 'Salvar' : 'Criar doc'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-neutral-700 eyebrow">{label}</span>
      {children}
    </label>
  )
}
