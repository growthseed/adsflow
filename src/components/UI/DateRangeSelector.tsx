import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, isWithinInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// Presets de período
const PRESETS = [
  { label: 'Hoje', getValue: () => ({ startDate: new Date(), endDate: new Date() }) },
  { label: 'Ontem', getValue: () => ({ startDate: subDays(new Date(), 1), endDate: subDays(new Date(), 1) }) },
  { label: 'Últimos 7 dias', getValue: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  { label: 'Últimos 30 dias', getValue: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  { label: 'Este mês', getValue: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  { label: 'Mês passado', getValue: () => ({ startDate: startOfMonth(subMonths(new Date(), 1)), endDate: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Este ano', getValue: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value.startDate);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gera dias do mês
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Dias vazios antes do primeiro dia
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleDayClick = (day: Date) => {
    if (selecting === 'start') {
      setTempRange({ startDate: day, endDate: day });
      setSelecting('end');
    } else {
      if (day < tempRange.startDate) {
        setTempRange({ startDate: day, endDate: tempRange.startDate });
      } else {
        setTempRange({ ...tempRange, endDate: day });
      }
      setSelecting('start');
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue();
    setTempRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const isInRange = (day: Date) => {
    return isWithinInterval(day, { start: tempRange.startDate, end: tempRange.endDate });
  };

  const isStartOrEnd = (day: Date) => {
    return isSameDay(day, tempRange.startDate) || isSameDay(day, tempRange.endDate);
  };

  const days = generateCalendarDays(viewDate);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg
                   hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">
          {format(value.startDate, 'dd MMM yyyy', { locale: ptBR })}
          {!isSameDay(value.startDate, value.endDate) && (
            <span className="text-gray-400"> — {format(value.endDate, 'dd MMM yyyy', { locale: ptBR })}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50
                        flex overflow-hidden">
          {/* Presets */}
          <div className="w-40 border-r border-gray-200 p-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">
              Período
            </div>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50
                           hover:text-indigo-600 rounded transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-4 w-72">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="font-semibold text-gray-800">
                {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button
                onClick={() => setViewDate(subMonths(viewDate, -1))}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day ? (
                    <button
                      onClick={() => handleDayClick(day)}
                      className={`
                        w-full h-full flex items-center justify-center text-sm rounded
                        transition-colors
                        ${isStartOrEnd(day)
                          ? 'bg-indigo-600 text-white font-semibold'
                          : isInRange(day)
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>

            {/* Selection Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  <span className={selecting === 'start' ? 'text-indigo-600 font-medium' : ''}>
                    Início: {format(tempRange.startDate, 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="text-gray-500">
                  <span className={selecting === 'end' ? 'text-indigo-600 font-medium' : ''}>
                    Fim: {format(tempRange.endDate, 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded
                           transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded
                           hover:bg-indigo-700 transition-colors font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
