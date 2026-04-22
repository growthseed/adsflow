import { FileDown, Send } from 'lucide-react'

import { findBlockDef } from '../library'
import type { ReportBlock } from '../types'

interface Props {
  block: ReportBlock | null
  onPatch: (id: string, props: Record<string, unknown>) => void
  onGeneratePdf?: () => void
  onSchedule?: () => void
  blockCount: number
}

/**
 * Painel de propriedades à direita. Renderiza um form customizado por
 * tipo de bloco. O CTA de gerar PDF fica aqui para fácil acesso.
 */
export function PropsPanel({ block, onPatch, onGeneratePdf, onSchedule, blockCount }: Props) {
  const def = block ? findBlockDef(block.type) : null

  return (
    <aside className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="text-[13px] font-semibold">
        Propriedades {def ? `· ${def.label}` : ''}
      </div>
      {!block ? (
        <p className="text-[12px] text-neutral-500">
          Clique em um bloco do canvas para editar propriedades.
        </p>
      ) : block.type === 'header' ? (
        <Field label="Título">
          <input
            value={String(block.props.title ?? '')}
            onChange={(e) => onPatch(block.id, { ...block.props, title: e.target.value })}
            className="w-full border border-neutral-200 rounded-md px-2 py-1.5 text-[13px]"
          />
        </Field>
      ) : block.type === 'kpi-strip' ? (
        <Field label="KPIs selecionados">
          <div className="flex flex-col gap-1">
            {['leads', 'cpl', 'roas', 'spend', 'ctr', 'cpm'].map((k) => {
              const current = (block.props.kpis as string[]) ?? []
              const active = current.includes(k)
              return (
                <label
                  key={k}
                  className={`flex justify-between items-center px-2 py-1.5 rounded cursor-pointer text-[12px] ${
                    active ? 'bg-neutral-50' : 'text-neutral-500'
                  }`}
                >
                  <span>{k.toUpperCase()}</span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...current, k]
                        : current.filter((x) => x !== k)
                      onPatch(block.id, { ...block.props, kpis: next })
                    }}
                  />
                </label>
              )
            })}
          </div>
        </Field>
      ) : block.type === 'line-chart' || block.type === 'bar-chart' ? (
        <>
          <Field label="Métrica">
            <select
              value={String(block.props.metric ?? 'leads')}
              onChange={(e) => onPatch(block.id, { ...block.props, metric: e.target.value })}
              className="w-full border border-neutral-200 rounded-md px-2 py-1.5 text-[13px]"
            >
              <option value="leads">Leads</option>
              <option value="spend">Spend</option>
              <option value="cpl">CPL</option>
              <option value="roas">ROAS</option>
              <option value="ctr">CTR</option>
            </select>
          </Field>
          <Field label="Período">
            <select
              value={String(block.props.period ?? '30d')}
              onChange={(e) => onPatch(block.id, { ...block.props, period: e.target.value })}
              className="w-full border border-neutral-200 rounded-md px-2 py-1.5 text-[13px]"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="quarter">Trimestre</option>
            </select>
          </Field>
        </>
      ) : block.type === 'paragraph-ai' ? (
        <Field label="Prompt para IA">
          <textarea
            rows={4}
            value={String(block.props.prompt ?? '')}
            onChange={(e) => onPatch(block.id, { ...block.props, prompt: e.target.value })}
            className="w-full border border-neutral-200 rounded-md px-2 py-1.5 text-[12px]"
          />
          <p className="text-[10px] text-neutral-400 mt-1">
            O texto é gerado na geração do PDF, com dados reais do período.
          </p>
        </Field>
      ) : block.type === 'highlight' ? (
        <Field label="Texto de destaque">
          <textarea
            rows={3}
            value={String(block.props.text ?? '')}
            onChange={(e) => onPatch(block.id, { ...block.props, text: e.target.value })}
            className="w-full border border-neutral-200 rounded-md px-2 py-1.5 text-[13px]"
          />
        </Field>
      ) : (
        <p className="text-[12px] text-neutral-500">
          Bloco <code>{block.type}</code> usa os padrões do template. Edição detalhada em breve.
        </p>
      )}

      <div className="border-t border-neutral-100 pt-3 mt-2 flex flex-col gap-2">
        <button
          onClick={onGeneratePdf}
          disabled={blockCount === 0}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold"
        >
          <FileDown size={14} /> Gerar PDF
        </button>
        <button
          onClick={onSchedule}
          disabled={blockCount === 0}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 text-neutral-800 text-sm font-medium"
        >
          <Send size={14} /> Agendar envio
        </button>
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  )
}
