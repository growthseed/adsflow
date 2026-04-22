import { useState } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react'

import { findBlockDef } from '../library'
import type { ReportBlock } from '../types'

interface Props {
  blocks: ReportBlock[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDropFromLibrary: (type: string, index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onRemove: (id: string) => void
}

/**
 * Canvas central do Report Builder. Recebe drops da biblioteca e
 * permite reorder via botões up/down + handle. Drag-drop do library
 * usa HTML5 nativo com mime type custom.
 */
export function BuilderCanvas({
  blocks,
  selectedId,
  onSelect,
  onDropFromLibrary,
  onReorder,
  onRemove,
}: Props) {
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    if (!e.dataTransfer.types.includes('application/x-adsflow-block')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropIndex(idx)
  }

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/x-adsflow-block')
    if (type) onDropFromLibrary(type, idx)
    setDropIndex(null)
  }

  return (
    <section className="bg-neutral-50 rounded-xl p-4 max-h-[70vh] overflow-y-auto">
      <div className="bg-white rounded-lg shadow-[var(--shadow-soft)] p-6 max-w-[680px] mx-auto">
        <DropZone
          active={dropIndex === 0}
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={() => setDropIndex((i) => (i === 0 ? null : i))}
          onDrop={(e) => handleDrop(e, 0)}
        />
        {blocks.map((b, i) => (
          <div key={b.id}>
            <BlockItem
              block={b}
              index={i}
              total={blocks.length}
              selected={selectedId === b.id}
              onClick={() => onSelect(b.id)}
              onRemove={() => onRemove(b.id)}
              onReorder={onReorder}
            />
            <DropZone
              active={dropIndex === i + 1}
              onDragOver={(e) => handleDragOver(e, i + 1)}
              onDragLeave={() => setDropIndex((x) => (x === i + 1 ? null : x))}
              onDrop={(e) => handleDrop(e, i + 1)}
            />
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="border-2 border-dashed border-neutral-200 rounded-lg py-10 text-center text-[13px] text-neutral-500">
            Arraste blocos da biblioteca para montar o relatório
          </div>
        )}
      </div>
    </section>
  )
}

function DropZone({
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`transition-[height,background] duration-150 rounded ${
        active ? 'h-10 bg-brand-50 border border-dashed border-brand-500' : 'h-2'
      }`}
      aria-hidden={!active}
    />
  )
}

function BlockItem({
  block,
  index,
  total,
  selected,
  onClick,
  onRemove,
  onReorder,
}: {
  block: ReportBlock
  index: number
  total: number
  selected: boolean
  onClick: () => void
  onRemove: () => void
  onReorder: (from: number, to: number) => void
}) {
  const def = findBlockDef(block.type)
  return (
    <div
      onClick={onClick}
      className={`group relative border rounded-lg p-3 cursor-pointer transition-colors ${
        selected
          ? 'border-brand-500 border-2 bg-white'
          : 'border-neutral-200 bg-white hover:border-neutral-300'
      }`}
    >
      {selected && (
        <div className="absolute -top-[11px] left-3 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
          {def?.label ?? block.type} · selecionado
        </div>
      )}
      <div className="flex items-center gap-2 mb-2 text-neutral-500">
        <GripVertical size={14} className="opacity-60" />
        <span className="text-[11px]">{def?.label ?? block.type}</span>
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (index > 0) onReorder(index, index - 1)
          }}
          disabled={index === 0}
          aria-label="mover pra cima"
          className="w-6 h-6 grid place-items-center rounded hover:bg-neutral-100 disabled:opacity-30"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (index < total - 1) onReorder(index, index + 1)
          }}
          disabled={index === total - 1}
          aria-label="mover pra baixo"
          className="w-6 h-6 grid place-items-center rounded hover:bg-neutral-100 disabled:opacity-30"
        >
          <ChevronDown size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label="remover bloco"
          className="w-6 h-6 grid place-items-center rounded hover:bg-error-50 text-error-600"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <BlockPreview block={block} />
    </div>
  )
}

/**
 * Renderização prévia no canvas — versão simplificada (não tenta
 * chamar API de dados). Ao gerar PDF, a versão real é renderizada
 * server-side com dados atuais.
 */
function BlockPreview({ block }: { block: ReportBlock }) {
  switch (block.type) {
    case 'header': {
      const title = (block.props.title as string) || 'Relatório'
      return <h3 className="text-[18px] font-bold">{title}</h3>
    }
    case 'kpi-strip': {
      const kpis = (block.props.kpis as string[]) ?? ['leads', 'cpl', 'roas', 'spend']
      return (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${kpis.length}, minmax(0,1fr))` }}
        >
          {kpis.map((k) => (
            <div key={k} className="p-2 bg-neutral-50 rounded text-center">
              <div className="text-[10px] uppercase tracking-[0.05em] text-neutral-500">
                {k}
              </div>
              <div className="text-[16px] font-bold tabular">—</div>
            </div>
          ))}
        </div>
      )
    }
    case 'line-chart':
    case 'bar-chart':
    case 'pacing-chart':
      return (
        <div className="h-20 rounded bg-gradient-to-br from-brand-100 to-white grid place-items-center text-[10px] text-neutral-500">
          gráfico · renderiza no PDF
        </div>
      )
    case 'paragraph-ai':
      return (
        <p className="text-[12px] italic text-neutral-600">
          (parágrafo gerado pela IA com o prompt “{String(block.props.prompt ?? '')}”)
        </p>
      )
    case 'highlight':
      return (
        <p className="text-[14px] font-semibold text-brand-700">
          “{String(block.props.text ?? '...')}”
        </p>
      )
    case 'wins-list':
      return (
        <ul className="text-[12px] text-neutral-700 space-y-0.5">
          <li>· Win 1 (gerado do período)</li>
          <li>· Win 2</li>
        </ul>
      )
    case 'page-break':
      return <div className="text-center text-[10px] text-neutral-400 tracking-widest">— — —</div>
    default:
      return (
        <div className="text-[11px] text-neutral-500">
          {block.type} · preview não disponível
        </div>
      )
  }
}
