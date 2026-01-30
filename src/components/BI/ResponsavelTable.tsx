import React from 'react';
import type { ResponsavelStats } from '@/types/bi';
import { formatNumber, formatCurrencyBRL, formatPercentageBI } from '@/types/bi';
import { TrendingUp, TrendingDown, User } from 'lucide-react';

interface ResponsavelTableProps {
  data: ResponsavelStats[];
  title?: string;
  className?: string;
}

const ResponsavelTable: React.FC<ResponsavelTableProps> = ({
  data,
  title = 'Responsável',
  className = '',
}) => {
  // Sort by leads descending
  const sortedData = [...data].sort((a, b) => b.leads - a.leads);

  // Calculate totals
  const totals = sortedData.reduce(
    (acc, item) => ({
      leads: acc.leads + item.leads,
      oportunidades: acc.oportunidades + item.oportunidades,
      vendas: acc.vendas + item.vendas,
      perdas: acc.perdas + item.perdas,
      abertos: acc.abertos + item.abertos,
      valor_total: acc.valor_total + item.valor_total,
    }),
    { leads: 0, oportunidades: 0, vendas: 0, perdas: 0, abertos: 0, valor_total: 0 }
  );

  const overallConversion = totals.leads > 0 ? (totals.vendas / totals.leads) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oportunidades
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendas
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perdas
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abertos
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversão
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <tr key={item.vendedor_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.vendedor_nome}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{index + 1} no ranking
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-blue-600">
                      {formatNumber(item.leads)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-purple-600">
                      {formatNumber(item.oportunidades)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-green-600">
                      {formatNumber(item.vendas)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-red-600">
                      {formatNumber(item.perdas)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-yellow-600">
                      {formatNumber(item.abertos)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {item.taxa_conversao >= overallConversion ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          item.taxa_conversao >= overallConversion
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatPercentageBI(item.taxa_conversao, 1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrencyBRL(item.valor_total)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nenhum dado disponível
                </td>
              </tr>
            )}
          </tbody>
          {/* Footer with totals */}
          {sortedData.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr className="font-medium">
                <td className="px-4 py-3 text-sm text-gray-900">
                  Total ({sortedData.length} vendedores)
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {formatNumber(totals.leads)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-purple-600">
                  {formatNumber(totals.oportunidades)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-green-600">
                  {formatNumber(totals.vendas)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-red-600">
                  {formatNumber(totals.perdas)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-yellow-600">
                  {formatNumber(totals.abertos)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-900">
                  {formatPercentageBI(overallConversion, 1)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatCurrencyBRL(totals.valor_total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default ResponsavelTable;
