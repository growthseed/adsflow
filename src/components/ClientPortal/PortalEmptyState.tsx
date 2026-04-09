/**
 * Client Portal — Empty state
 *
 * Shown when the portal bundle has no roadmap (client not found or
 * no tasks captured yet). Deliberately minimal — this is client-
 * facing so no "go to settings" CTAs.
 */

interface PortalEmptyStateProps {
  title: string
  description: string
}

export default function PortalEmptyState({ title, description }: PortalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-slate-900 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  )
}
