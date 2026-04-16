/**
 * ============================================
 * Formula Engine — AdFlow Sprint B.2
 * ============================================
 * Safe evaluator for metric formulas like "spend / leads".
 * No eval() — uses a simple tokenizer + recursive descent parser.
 *
 * Supports: + - * / ( ) and metric key references.
 * Numbers can be integers or decimals.
 *
 * Usage:
 *   evaluateFormula('spend / leads * 100', { spend: 1000, leads: 50 })
 *   → 2000
 */

type Variables = Record<string, number>

interface Token {
  type: 'number' | 'variable' | 'operator' | 'lparen' | 'rparen'
  value: string
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const src = expr.trim()

  while (i < src.length) {
    const ch = src[i]

    if (/\s/.test(ch)) { i++; continue }

    if (/[0-9.]/.test(ch)) {
      let num = ''
      while (i < src.length && /[0-9.]/.test(src[i])) { num += src[i]; i++ }
      tokens.push({ type: 'number', value: num })
      continue
    }

    if ('+-*/'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch })
      i++
      continue
    }

    if (ch === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue }

    if (/[a-zA-Z_]/.test(ch)) {
      let name = ''
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) { name += src[i]; i++ }
      tokens.push({ type: 'variable', value: name })
      continue
    }

    throw new Error(`Unexpected character: "${ch}" at position ${i}`)
  }

  return tokens
}

class Parser {
  private tokens: Token[]
  private pos = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  parse(vars: Variables): number {
    const result = this.expr(vars)
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token: ${this.peek()?.value}`)
    }
    return result
  }

  private expr(vars: Variables): number {
    let left = this.term(vars)
    while (this.peek()?.type === 'operator' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value
      const right = this.term(vars)
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  private term(vars: Variables): number {
    let left = this.factor(vars)
    while (this.peek()?.type === 'operator' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op = this.consume().value
      const right = this.factor(vars)
      if (op === '/') {
        if (right === 0) return 0
        left = left / right
      } else {
        left = left * right
      }
    }
    return left
  }

  private factor(vars: Variables): number {
    const tok = this.peek()
    if (!tok) throw new Error('Unexpected end of expression')

    if (tok.type === 'number') {
      this.consume()
      return parseFloat(tok.value)
    }

    if (tok.type === 'variable') {
      this.consume()
      const val = vars[tok.value]
      if (val == null) return 0
      return val
    }

    if (tok.type === 'lparen') {
      this.consume()
      const result = this.expr(vars)
      if (this.peek()?.type !== 'rparen') throw new Error('Missing closing parenthesis')
      this.consume()
      return result
    }

    throw new Error(`Unexpected token: ${tok.value}`)
  }
}

export function evaluateFormula(formula: string, variables: Variables): number {
  try {
    const tokens = tokenize(formula)
    if (tokens.length === 0) return 0
    const parser = new Parser(tokens)
    const result = parser.parse(variables)
    if (!isFinite(result)) return 0
    return result
  } catch {
    return 0
  }
}

export function extractVariables(formula: string): string[] {
  try {
    return tokenize(formula)
      .filter((t) => t.type === 'variable')
      .map((t) => t.value)
  } catch {
    return []
  }
}

export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    const tokens = tokenize(formula)
    new Parser(tokens).parse({})
    return { valid: true }
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid formula' }
  }
}
