/**
 * COMMAND PALETTE (Ctrl+K)
 * Efeito Digital - Ads Flow
 *
 * Busca global: páginas, ações rápidas.
 * Ativado pelo botão de busca no Header ou Ctrl+K.
 */

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  GitBranch,
  BarChart3,
  Megaphone,
  Target,
  Link2,
  FileText,
  FolderKanban,
  Users,
  CreditCard,
  Settings,
  Shield,
  Plus,
  ArrowRight,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

interface PaletteItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'page' | 'action'
}

// =====================================================
// CONTEXT (open/close from anywhere)
// =====================================================

interface CommandPaletteContextValue {
  open: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be inside CommandPaletteProvider')
  return ctx
}

// =====================================================
// PROVIDER + PALETTE
// =====================================================

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Auto-focus input
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Build items list
  const allItems: PaletteItem[] = [
    // Pages
    { id: 'dashboard', label: 'Dashboard', description: 'KPIs e visão geral', icon: LayoutDashboard, action: () => navigate('/dashboard'), category: 'page' },
    { id: 'editor', label: 'Flow Editor', description: 'Editor visual de fluxos', icon: GitBranch, action: () => navigate('/editor'), category: 'page' },
    { id: 'bi', label: 'B.I. & Analytics', description: 'Dashboards de vendas e e-commerce', icon: BarChart3, action: () => navigate('/bi'), category: 'page' },
    { id: 'campaigns', label: 'Campanhas', description: 'Performance Meta Ads', icon: Megaphone, action: () => navigate('/campaigns'), category: 'page' },
    { id: 'funnels', label: 'Funis', description: 'Templates e funis criados', icon: Target, action: () => navigate('/funnels'), category: 'page' },
    { id: 'integrations', label: 'Integrações', description: 'Contas de anúncio conectadas', icon: Link2, action: () => navigate('/integrations'), category: 'page' },
    { id: 'reports', label: 'Relatórios', description: 'Criar e compartilhar relatórios', icon: FileText, action: () => navigate('/reports'), category: 'page' },
    { id: 'clients', label: 'Clientes', description: 'Gerenciar clientes da agência', icon: FolderKanban, action: () => navigate('/clients'), category: 'page' },
    { id: 'team', label: 'Equipe', description: 'Membros e convites', icon: Users, action: () => navigate('/team'), category: 'page' },
    { id: 'billing', label: 'Faturamento', description: 'Planos, faturas e pagamento', icon: CreditCard, action: () => navigate('/billing'), category: 'page' },
    { id: 'settings', label: 'Configurações', description: 'Perfil, senha e preferências', icon: Settings, action: () => navigate('/settings'), category: 'page' },
    { id: 'admin', label: 'Admin Global', description: 'Painel super admin', icon: Shield, action: () => navigate('/admin'), category: 'page' },
    // Actions
    { id: 'new-flow', label: 'Criar novo flow', description: 'Abrir editor em branco', icon: Plus, action: () => navigate('/editor'), category: 'action' },
    { id: 'new-report', label: 'Criar relatório', description: 'Novo relatório de performance', icon: Plus, action: () => navigate('/reports'), category: 'action' },
  ]

  // Filter
  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  // Group by category
  const pages = filtered.filter((i) => i.category === 'page')
  const actions = filtered.filter((i) => i.category === 'action')
  const flatFiltered = [...pages, ...actions]

  // Clamp selectedIndex
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
      e.preventDefault()
      flatFiltered[selectedIndex].action()
      close()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <CommandPaletteContext.Provider value={{ open }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-[fadeIn_100ms_ease-out]"
            onClick={close}
          />

          {/* Palette */}
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-[scaleIn_100ms_ease-out]">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-200">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar páginas, ações..."
                className="flex-1 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {flatFiltered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhum resultado para "{query}"
                </div>
              )}

              {pages.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Páginas
                  </div>
                  {pages.map((item) => {
                    const globalIdx = flatFiltered.indexOf(item)
                    return (
                      <PaletteRow
                        key={item.id}
                        item={item}
                        selected={globalIdx === selectedIndex}
                        dataIndex={globalIdx}
                        onClick={() => { item.action(); close() }}
                      />
                    )
                  })}
                </>
              )}

              {actions.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                    Ações
                  </div>
                  {actions.map((item) => {
                    const globalIdx = flatFiltered.indexOf(item)
                    return (
                      <PaletteRow
                        key={item.id}
                        item={item}
                        selected={globalIdx === selectedIndex}
                        dataIndex={globalIdx}
                        onClick={() => { item.action(); close() }}
                      />
                    )
                  })}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400">
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑↓</kbd>
                {' '}navegar
                {' '}<kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd>
                {' '}abrir
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Ctrl+K</kbd>
                {' '}buscar
              </span>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  )
}

// =====================================================
// ROW
// =====================================================

function PaletteRow({
  item,
  selected,
  dataIndex,
  onClick,
}: {
  item: PaletteItem
  selected: boolean
  dataIndex: number
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        selected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        selected ? 'bg-blue-100' : 'bg-slate-100'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        {item.description && (
          <p className={`text-xs truncate ${selected ? 'text-blue-500' : 'text-slate-400'}`}>
            {item.description}
          </p>
        )}
      </div>
      {selected && <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />}
    </button>
  )
}
