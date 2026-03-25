/**
 * CSV EXPORT UTILITY
 * Efeito Digital - Ads Flow
 *
 * Gera e baixa arquivo CSV a partir de dados tabulares.
 */

export function downloadCSV(
  rows: Record<string, string | number | null | undefined>[],
  headers: { key: string; label: string }[],
  filename: string
) {
  if (rows.length === 0) return

  const BOM = '\uFEFF' // UTF-8 BOM para Excel interpretar acentos
  const sep = ';' // ponto-e-vírgula para PT-BR locale

  const headerLine = headers.map((h) => `"${h.label}"`).join(sep)
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key]
        if (val == null) return ''
        if (typeof val === 'number') return String(val).replace('.', ',')
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(sep)
  )

  const csv = BOM + [headerLine, ...dataLines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
