/**
 * ============================================
 * renderMarkdown — minimalist markdown → JSX
 * ============================================
 * Lightweight parser for the playbook docs. Supports the subset we
 * actually use: headings (#/##/###/####), paragraphs, ordered and
 * unordered lists, fenced code blocks, inline `code`, **bold**, and
 * [links](url). No HTML passthrough, no raw tables — good enough for
 * our internal checklists without pulling a 40kb markdown dep.
 * ============================================
 */

import React from 'react'

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'h4'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; lang?: string; content: string }
  | { kind: 'hr' }

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // YAML frontmatter — skip
    if (i === 0 && line.trim() === '---') {
      i++
      while (i < lines.length && lines[i].trim() !== '---') i++
      i++ // past closing ---
      continue
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || undefined
      i++
      const buf: string[] = []
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i])
        i++
      }
      i++ // past closing ```
      blocks.push({ kind: 'code', lang, content: buf.join('\n') })
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push({ kind: 'hr' })
      i++
      continue
    }

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4
      blocks.push({ kind: (`h${level}` as Block['kind']) as 'h1' | 'h2' | 'h3' | 'h4', text: h[2] })
      i++
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push({ kind: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ kind: 'ol', items })
      continue
    }

    // Blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph — merge contiguous non-special lines
    const buf: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !lines[i].startsWith('```') &&
      !/^---+$/.test(lines[i].trim())
    ) {
      buf.push(lines[i])
      i++
    }
    blocks.push({ kind: 'p', text: buf.join(' ') })
  }

  return blocks
}

/** Render inline markdown: **bold**, `code`, [text](url) */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let rest = text
  let k = 0

  // Regex order matters: code > bold > link
  const re =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/

  while (rest.length > 0) {
    const m = re.exec(rest)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const token = m[0]
    if (token.startsWith('`')) {
      out.push(
        <code
          key={`${keyPrefix}-c-${k++}`}
          className="px-1 py-0.5 rounded bg-slate-100 text-[12px] font-mono text-slate-800"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      out.push(
        <strong key={`${keyPrefix}-b-${k++}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (linkMatch) {
        out.push(
          <a
            key={`${keyPrefix}-l-${k++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {linkMatch[1]}
          </a>,
        )
      } else {
        out.push(token)
      }
    }
    rest = rest.slice(m.index + token.length)
  }

  return out
}

export function RenderMarkdown({ source }: { source: string }) {
  const blocks = React.useMemo(() => parse(source), [source])

  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-slate-700">
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case 'h1':
            return (
              <h1 key={idx} className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {renderInline(b.text, `h1-${idx}`)}
              </h1>
            )
          case 'h2':
            return (
              <h2 key={idx} className="mt-5 text-xl font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-1">
                {renderInline(b.text, `h2-${idx}`)}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={idx} className="mt-4 text-base font-semibold text-slate-900">
                {renderInline(b.text, `h3-${idx}`)}
              </h3>
            )
          case 'h4':
            return (
              <h4 key={idx} className="mt-3 text-sm font-semibold text-slate-800 uppercase tracking-wider">
                {renderInline(b.text, `h4-${idx}`)}
              </h4>
            )
          case 'p':
            return (
              <p key={idx} className="text-slate-700">
                {renderInline(b.text, `p-${idx}`)}
              </p>
            )
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1.5 text-slate-700">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ul-${idx}-${j}`)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-slate-700">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ol-${idx}-${j}`)}</li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre
                key={idx}
                className="rounded-lg bg-slate-900 text-slate-100 text-[12px] font-mono p-3 overflow-x-auto"
              >
                <code>{b.content}</code>
              </pre>
            )
          case 'hr':
            return <hr key={idx} className="my-4 border-slate-100" />
        }
      })}
    </div>
  )
}
