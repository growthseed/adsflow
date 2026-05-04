/**
 * Planner Templates Registry — AdFlow v4
 * Add new templates here; they appear in the picker automatically.
 */

import type { PlannerTemplate, TemplateFilter } from '@/types/plannerTemplates'
import { briefingTemplate } from './briefing'
import { salesFunnelTemplate } from './salesFunnel'
import { enrollmentTemplate } from './enrollment'
import { remarketingTemplate } from './remarketing'
import { launchTemplate } from './launch'
import { grupoM3Template } from './grupoM3'

export const PLANNER_TEMPLATES: PlannerTemplate[] = [
  briefingTemplate,
  enrollmentTemplate,
  salesFunnelTemplate,
  launchTemplate,
  remarketingTemplate,
  grupoM3Template,
]

export function getTemplate(id: string): PlannerTemplate | undefined {
  return PLANNER_TEMPLATES.find((t) => t.id === id)
}

export function filterTemplates(filter: TemplateFilter = {}): PlannerTemplate[] {
  const { category = 'all', vertical = 'all', query = '' } = filter
  const q = query.trim().toLowerCase()

  return PLANNER_TEMPLATES.filter((t) => {
    if (category !== 'all' && t.category !== category) return false
    if (vertical !== 'all' && t.vertical !== 'any' && t.vertical !== vertical) return false
    if (q) {
      const haystack = `${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

/** Re-export types for convenience */
export type { PlannerTemplate, TemplateFilter } from '@/types/plannerTemplates'
