/**
 * ============================================
 * DATE RANGE CONTEXT — Global date selection
 * ============================================
 * Persists the selected date range across all pages.
 * When user picks "Last 7 days" on Dashboard,
 * navigating to Campaigns keeps the same period.
 */

import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { subDays } from 'date-fns'

export interface DateRange {
  startDate: Date
  endDate: Date
}

interface DateRangeContextValue {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  /** Number of days in the current range (inclusive) */
  dayCount: number
  /** Period label for KPI cards, e.g. "(7d)" */
  periodLabel: string
  /** ISO date strings for API calls */
  dateFrom: string
  dateTo: string
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  })

  const dayCount = Math.round(
    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  const periodLabel = `(${dayCount}d)`

  const dateFrom = dateRange.startDate.toISOString().split('T')[0]
  const dateTo = dateRange.endDate.toISOString().split('T')[0]

  const handleSetDateRange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange: handleSetDateRange,
        dayCount,
        periodLabel,
        dateFrom,
        dateTo,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext)
  if (!ctx) {
    throw new Error('useDateRange must be used within a DateRangeProvider')
  }
  return ctx
}
