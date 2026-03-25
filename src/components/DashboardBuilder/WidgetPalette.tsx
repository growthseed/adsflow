/**
 * WidgetPalette — Sidebar with draggable widget cards
 */

import { useState } from 'react';
import {
  TrendingUp, LineChart, AreaChart, BarChart3, PieChart, Filter, Table2,
  Gauge, ArrowLeftRight, LayoutGrid, ScatterChart, Grid3X3, Type, Image,
  Search,
} from 'lucide-react';
import { WIDGET_TYPE_CATALOG, type WidgetType, type WidgetTypeMeta } from '@/types/dashboard';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, LineChart, AreaChart, BarChart3, PieChart, Filter, Table2,
  Gauge, ArrowLeftRight, LayoutGrid, ScatterChart, Grid3X3, Type, Image,
};

const CATEGORY_LABELS = {
  kpi: 'Indicadores',
  chart: 'Gráficos',
  data: 'Dados',
  layout: 'Layout',
};

interface Props {
  onAddWidget: (type: WidgetType) => void;
}

export default function WidgetPalette({ onAddWidget }: Props) {
  const [search, setSearch] = useState('');

  const filtered = WIDGET_TYPE_CATALOG.filter((w) =>
    w.label.toLowerCase().includes(search.toLowerCase()) ||
    w.description.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = (['kpi', 'chart', 'data', 'layout'] as const).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: filtered.filter((w) => w.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="w-60 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Widgets</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar widget..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((widget) => (
                <WidgetPaletteItem
                  key={widget.type}
                  meta={widget}
                  onClick={() => onAddWidget(widget.type)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetPaletteItem({ meta, onClick }: { meta: WidgetTypeMeta; onClick: () => void }) {
  const Icon = ICON_MAP[meta.icon] || BarChart3;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent text-left transition-colors group"
    >
      <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-800 group-hover:text-blue-700 truncate">
          {meta.label}
        </p>
        <p className="text-[10px] text-slate-400 truncate">{meta.description}</p>
      </div>
    </button>
  );
}
