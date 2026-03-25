import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { TableConfig } from '@/types/dashboard';

interface Props {
  config: TableConfig;
  data: Record<string, unknown>[];
  loading?: boolean;
}

function formatCell(value: unknown, format?: string): string {
  if (value == null) return '-';
  const num = Number(value);
  if (isNaN(num) || format === 'text') return String(value);

  switch (format) {
    case 'currency':
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'percentage':
      return `${num.toFixed(2)}%`;
    case 'number':
      return num.toLocaleString('pt-BR');
    default:
      return String(value);
  }
}

export default function TableWidget({ config, data, loading }: Props) {
  const [sortBy, setSortBy] = useState(config.sortBy || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(config.sortDirection || 'desc');
  const [page, setPage] = useState(0);
  const pageSize = config.pageSize || 10;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        Carregando...
      </div>
    );
  }

  // Sort
  const sorted = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = a[sortBy] as number;
    const bVal = b[sortBy] as number;
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr>
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && <ArrowUpDown className="w-3 h-3" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} className="px-3 py-8 text-center text-slate-400">
                  Sem dados
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-slate-700">
                      {formatCell(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 text-xs text-slate-500">
          <span>{sorted.length} registros</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-2">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
