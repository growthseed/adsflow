import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Upload } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/UI/Toast'
import type { LibraryBlockDef, ReportBlock, ReportTemplate } from './types'
import { findBlockDef } from './library'
import { BlockLibrary } from './components/BlockLibrary'
import { BuilderCanvas } from './components/BuilderCanvas'
import { PropsPanel } from './components/PropsPanel'
import { TemplateGrid } from './components/TemplateGrid'

interface TemplateRow {
  id: string
  name: string
  subtitle: string | null
  source: 'official' | 'personal'
  category: string | null
  thumb_style: string | null
  blocks: ReportBlock[]
}

function nextId(): string {
  return `b_${Math.random().toString(36).slice(2, 9)}`
}

export default function ReportsPage() {
  const toast = useToastSafe()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [docName, setDocName] = useState('Novo relatório')
  const [blocks, setBlocks] = useState<ReportBlock[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('report_templates')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTemplates(
          ((data as TemplateRow[]) ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            subtitle: t.subtitle,
            source: t.source,
            category: t.category,
            thumbStyle: t.thumb_style,
            blocks: t.blocks,
          })),
        )
      })
  }, [])

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId])

  const applyTemplate = useCallback((t: ReportTemplate) => {
    const cloned = t.blocks.map((b) => ({ ...b, id: nextId() }))
    setBlocks(cloned)
    setDocName(t.name)
    setSelectedId(cloned[0]?.id ?? null)
  }, [])

  const addBlock = useCallback((type: string, index: number) => {
    const def = findBlockDef(type)
    if (!def) return
    const block: ReportBlock = { id: nextId(), type: def.type, props: { ...def.defaultProps } }
    setBlocks((prev) => {
      const next = [...prev]
      next.splice(index, 0, block)
      return next
    })
    setSelectedId(block.id)
  }, [])

  const reorder = useCallback((from: number, to: number) => {
    setBlocks((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
  }, [])

  const patch = useCallback((id: string, props: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props } : b)))
  }, [])

  const saveDraft = useCallback(async (): Promise<string | null> => {
    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id
    if (!userId) return null
    const { data, error } = await supabase
      .from('report_documents')
      .insert({
        name: docName,
        status: 'draft',
        blocks,
        created_by: userId,
        last_edited_by: userId,
      })
      .select('id')
      .single()
    if (error || !data) {
      toast?.error('Erro ao salvar rascunho')
      return null
    }
    toast?.success('Rascunho salvo')
    return (data as { id: string }).id
  }, [blocks, docName, toast])

  const generatePdf = useCallback(async () => {
    if (blocks.length === 0) return
    const reportId = await saveDraft()
    if (!reportId) return
    toast?.info('Gerando PDF…')
    const { data: sessionRes } = await supabase.auth.getSession()
    const token = sessionRes.session?.access_token
    if (!token) {
      toast?.error('Sessão expirada')
      return
    }
    try {
      const resp = await fetch(`/api/reports/generate?id=${reportId}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const body = (await resp.json()) as { url: string }
      toast?.success('PDF pronto')
      window.open(body.url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast?.error('Falha ao gerar PDF')
      console.error('[ReportsPage] generatePdf failed', e)
    }
  }, [blocks, saveDraft, toast])

  return (
    <div className="max-w-layout mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-neutral-900">
            Central de relatórios
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Biblioteca de templates + builder drag-and-drop + agendamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-700"
          >
            <Upload size={14} /> Salvar rascunho
          </button>
          <button
            onClick={() => {
              setBlocks([])
              setDocName('Novo relatório')
              setSelectedId(null)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
          >
            <Plus size={14} /> Novo relatório
          </button>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="eyebrow text-neutral-600 mb-2 flex items-center gap-2">
          <span>Templates · use como ponto de partida</span>
          <span className="flex-1 h-px bg-neutral-200" />
        </h2>
        <TemplateGrid templates={templates} onUse={applyTemplate} />
      </section>

      <section>
        <h2 className="eyebrow text-neutral-600 mb-2 flex items-center gap-2">
          <span>Builder · drag-and-drop</span>
          <span className="flex-1 h-px bg-neutral-200" />
        </h2>
        <div className="mb-3">
          <input
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full max-w-md text-[18px] font-semibold px-2 py-1.5 border-b border-neutral-200 focus:outline-none focus:border-brand-500 bg-transparent"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4">
          <BlockLibrary onDragStart={(_def: LibraryBlockDef) => {}} />
          <BuilderCanvas
            blocks={blocks}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDropFromLibrary={addBlock}
            onReorder={reorder}
            onRemove={remove}
          />
          <PropsPanel
            block={selected}
            onPatch={patch}
            onGeneratePdf={generatePdf}
            blockCount={blocks.length}
          />
        </div>
      </section>
    </div>
  )
}

/**
 * Wrapper defensivo — ToastProvider é montado no App, mas em testes
 * isolados pode não existir. Em prod sempre existe.
 */
function useToastSafe(): ReturnType<typeof useToast> | null {
  try {
    return useToast()
  } catch {
    return null
  }
}
