import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { Card, CardBody, CardHead } from '@/components/primitives'
import type { DerivedWeekDay } from '../hooks/useHojeData'

interface Props {
  week: DerivedWeekDay[]
  rangeLabel: string
  onPrev?: () => void
  onNext?: () => void
}

export function WeekAgendaCard({ week, rangeLabel, onPrev, onNext }: Props) {
  return (
    <Card className="col-span-12">
      <CardHead
        title={
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} className="text-brand-600" />
            Agenda da semana
          </span>
        }
        subtitle={`${rangeLabel} · arrastar para reagendar`}
        actions={
          <div className="flex items-center gap-1">
            <IconBtn onClick={onPrev} ariaLabel="semana anterior">
              <ChevronLeft size={14} />
            </IconBtn>
            <span className="text-xs font-medium text-neutral-700 px-2">semana</span>
            <IconBtn onClick={onNext} ariaLabel="próxima semana">
              <ChevronRight size={14} />
            </IconBtn>
          </div>
        }
      />
      <CardBody>
        <div className="grid grid-cols-5 gap-3">
          {week.map((d) => (
            <DayColumn key={d.label} day={d} />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

function DayColumn({ day }: { day: DerivedWeekDay }) {
  return (
    <div
      className={[
        'rounded-lg border p-3 min-h-[140px]',
        day.isToday
          ? 'bg-brand-50 border-brand-100'
          : 'bg-neutral-50 border-neutral-100',
      ].join(' ')}
    >
      <div
        className={[
          'text-[11px] eyebrow mb-2',
          day.isToday ? 'text-brand-700' : 'text-neutral-500',
        ].join(' ')}
      >
        <b className="mr-1">{day.label}</b>
        <span className="tabular">{day.dayNumber.toString().padStart(2, '0')}</span>
        {day.isToday && <span className="ml-1 lowercase">· hoje</span>}
      </div>
      <div className="space-y-1.5">
        {day.events.length === 0 ? (
          <div className="text-[11px] text-neutral-400">—</div>
        ) : (
          day.events.map((ev) => (
            <EventRow key={ev.id} title={ev.title} subtitle={ev.subtitle} tone={ev.tone} />
          ))
        )}
      </div>
    </div>
  )
}

function EventRow({
  title,
  subtitle,
  tone,
}: {
  title: string
  subtitle?: string
  tone: 'default' | 'urgent' | 'ok'
}) {
  const cls =
    tone === 'urgent'
      ? 'bg-error-50 border-l-2 border-error-500'
      : tone === 'ok'
      ? 'bg-success-50 border-l-2 border-success-500'
      : 'bg-white border-l-2 border-neutral-200'
  return (
    <div className={`${cls} rounded-r px-2 py-1.5`}>
      <div className="text-[12px] font-semibold text-neutral-900 leading-snug line-clamp-2">
        {title}
      </div>
      {subtitle && (
        <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{subtitle}</div>
      )}
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-7 h-7 grid place-items-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
    >
      {children}
    </button>
  )
}
