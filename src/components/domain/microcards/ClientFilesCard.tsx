import { FileText, KeyRound, Paperclip, Plus, Upload } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'

export type FileKind = 'pdf' | 'doc' | 'token' | 'generic'

export interface ClientFileItem {
  id: string
  kind: FileKind
  name: string
  sub?: string
  url?: string
}

interface Props {
  files: ClientFileItem[]
  onUpload?: () => void
  className?: string
}

const kindBadge = {
  pdf: {
    label: 'PDF',
    bg: 'bg-error-50',
    fg: 'text-error-600',
    icon: FileText,
  },
  doc: {
    label: 'DOC',
    bg: 'bg-info-50',
    fg: 'text-info-600',
    icon: FileText,
  },
  token: {
    label: 'KEY',
    bg: 'bg-success-50',
    fg: 'text-success-600',
    icon: KeyRound,
  },
  generic: {
    label: 'FILE',
    bg: 'bg-neutral-100',
    fg: 'text-neutral-600',
    icon: Paperclip,
  },
}

/**
 * Micro-card "Arquivos do cliente" — contratos, briefings, tokens.
 * Upload ancora em Supabase Storage (bucket `client-files`).
 */
export function ClientFilesCard({ files, onUpload, className = '' }: Props) {
  return (
    <Card className={className}>
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <Paperclip size={16} className="text-neutral-600" /> Arquivos do cliente
          </span>
        }
        subtitle="Contratos · briefings · tokens"
        actions={
          onUpload ? (
            <button
              onClick={onUpload}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
            >
              <Plus size={12} /> upload
            </button>
          ) : undefined
        }
      />
      <CardBody>
        {files.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto w-10 h-10 rounded-xl bg-neutral-100 grid place-items-center text-neutral-500 mb-2">
              <Upload size={16} />
            </div>
            <p className="text-xs text-neutral-500">Sem arquivos carregados.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {files.map((f) => {
              const badge = kindBadge[f.kind]
              const Icon = badge.icon
              const Content = (
                <>
                  <div
                    className={`w-8 h-10 rounded ${badge.bg} ${badge.fg} grid place-items-center shrink-0 text-[10px] font-bold`}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0 text-[13px]">
                    <div className="font-medium text-neutral-900 truncate">{f.name}</div>
                    {f.sub && <div className="text-[11px] text-neutral-500 truncate">{f.sub}</div>}
                  </div>
                </>
              )
              return (
                <li key={f.id}>
                  {f.url ? (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 py-2 hover:bg-neutral-50 -mx-4 px-4 transition-colors"
                    >
                      {Content}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 py-2">{Content}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
