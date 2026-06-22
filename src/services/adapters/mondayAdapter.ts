/**
 * ============================================
 * MONDAY ADAPTER — MOAI-specific normalization
 * ============================================
 * Recebe boards/items brutos do Monday (via mondayAuthService.listBoardItems)
 * e produz views tipadas que o snapshot builder MOAI consome:
 *
 *   - Membros por Mentor (cruza 6 Carteiras)
 *   - NPS Consolidado (NPS Conselhos + NPS Alavanca)
 *   - Cronograma de Conteúdo (Cronograma Comunidade + IG + Redes Sociais)
 *   - Inadimplência (Inadimplências + Churn + Pagamentos)
 *   - Health Score Membros (Health Score Conselhos)
 *
 * IDs específicos dos boards MOAI (encontrados em 2026-06-02):
 *
 *   Carteiras por mentor (Conselhos Estratégicos):
 *     - 18408963619  Carteira Vilker (Nova)   304 items
 *     - 18408964149  Carteira Vini (Nova)     281
 *     - 18408962226  Carteira Ale (Nova)      277
 *     - 18408962839  Carteira Luma (Nova)     222
 *     - 18408964375  Carteira Yas (Nova)      206
 *     - 18408963325  Carteira Marcos (Nova)    52
 *
 *   Carteira High End: 18414142897  (66)
 *   Carteira Alavanca: precisa confirmar id
 *
 *   NPS Conselhos Estratégicos 2026: id em "Conselhos Estratégicos" ws — 1128 itens
 *   NPS Alavanca - Aulas: id em "Alavanca" ws — 195 itens
 *   Reposições 2025: id em "CM e CS" ws — 513 itens
 *   Health Score Conselhos MOAI: 18413220642 (32)
 *
 *   Cronograma Comunidade: id em "Marketing" ws — 406
 *   Cronograma Instagram: id em "Marketing" ws — 277
 *   Redes Sociais MOAI: id em "Marketing" ws — 633
 *
 *   Inadimplências: id em "Financeiro" — 2804
 *   ❌ Churn: 18413409833 — 162
 *   Solicitações para Pagamento: id em "Financeiro" — 641
 *   Solicitações Gerais (Fin): id em "Financeiro" — 526
 *
 * Importante: ids mudam por conta. Em runtime resolvemos via nome do board.
 */

import type { MondayBoard, MondayColumn, MondayItem } from '../mondayAuthService'

// =============================================================
// TIPOS NORMALIZADOS — formato MOAI
// =============================================================

export interface MembroPorMentor {
  membro_id: string
  membro_nome: string
  mentor: 'Vilker' | 'Vini' | 'Ale' | 'Luma' | 'Yas' | 'Marcos' | 'High End' | 'Alavanca'
  email?: string
  telefone?: string
  cnpj?: string
  empresa?: string
  estagio?: string // ex: "Onboarding", "Ativo", "Em Risco", "Churn"
  data_entrada?: string
  ultimo_contato?: string
  health_score?: number
}

export interface NPSResposta {
  resposta_id: string
  membro_id?: string
  membro_nome?: string
  tipo: 'conselho' | 'alavanca' | 'turn_lab' | 'evento'
  conselho_nome?: string
  mentor?: string
  nps_score?: number
  comentario?: string
  data: string
  classificacao?: 'promotor' | 'neutro' | 'detrator'
}

export interface ConteudoPlanejado {
  item_id: string
  titulo: string
  canal: 'instagram' | 'stories' | 'feed' | 'newsletter' | 'whatsapp' | 'founder_led' | 'outro'
  tipo?: string // post, reel, story, carousel
  status: 'planejado' | 'em_producao' | 'aprovado' | 'publicado' | 'pausado'
  responsavel?: string
  data_publicacao?: string
  link?: string
  tema?: string
}

export interface InadimplenciaItem {
  item_id: string
  membro_id?: string
  membro_nome?: string
  valor: number
  dias_atraso?: number
  mentor_responsavel?: string
  status: 'aberto' | 'negociando' | 'pago' | 'baixa'
  vencimento?: string
  motivo?: string
}

// =============================================================
// HELPERS
// =============================================================

/** Resolve coluna pelo título (case-insensitive, fuzzy). */
function findColumnId(columns: MondayColumn[], ...keywords: string[]): string | undefined {
  const lower = (s: string) => s.toLowerCase().trim()
  for (const kw of keywords) {
    const col = columns.find((c) => lower(c.title ?? '').includes(lower(kw)))
    if (col) return col.id
  }
  return undefined
}

/** Pega o valor texto de uma coluna de um item. */
function getColText(item: MondayItem, colId?: string): string | undefined {
  if (!colId) return undefined
  const cv = item.column_values.find((c) => c.id === colId)
  return cv?.text?.trim() || undefined
}

/** Pega valor numérico parseando vírgula BR. */
function getColNumber(item: MondayItem, colId?: string): number | undefined {
  const t = getColText(item, colId)
  if (!t) return undefined
  const n = parseFloat(t.replace(/\./g, '').replace(',', '.'))
  return Number.isNaN(n) ? undefined : n
}

/** Classifica NPS 0-10 em promotor/neutro/detrator. */
function classifyNPS(score: number): 'promotor' | 'neutro' | 'detrator' {
  if (score >= 9) return 'promotor'
  if (score >= 7) return 'neutro'
  return 'detrator'
}

// =============================================================
// EXTRATORES POR BOARD
// =============================================================

/**
 * Extrai membros de um board de Carteira (Vilker, Vini, Ale, Luma, Yas, Marcos).
 * O nome do board determina o mentor.
 */
export function extractCarteiraMentor(
  board: MondayBoard,
  columns: MondayColumn[],
  items: MondayItem[],
): MembroPorMentor[] {
  const mentor = detectMentor(board.name)
  if (!mentor) return []

  const colEmail = findColumnId(columns, 'email', 'e-mail')
  const colTel = findColumnId(columns, 'telefone', 'celular', 'whatsapp')
  const colCnpj = findColumnId(columns, 'cnpj')
  const colEmpresa = findColumnId(columns, 'empresa', 'razão social', 'razao social')
  const colEstagio = findColumnId(columns, 'status', 'estágio', 'estagio', 'fase')
  const colEntrada = findColumnId(columns, 'data entrada', 'entrada', 'início', 'inicio')
  const colHealth = findColumnId(columns, 'health', 'saúde', 'score')

  return items.map((it) => ({
    membro_id: it.id,
    membro_nome: it.name,
    mentor,
    email: getColText(it, colEmail),
    telefone: getColText(it, colTel),
    cnpj: getColText(it, colCnpj),
    empresa: getColText(it, colEmpresa),
    estagio: getColText(it, colEstagio),
    data_entrada: getColText(it, colEntrada),
    health_score: getColNumber(it, colHealth),
  }))
}

function detectMentor(boardName: string): MembroPorMentor['mentor'] | null {
  const n = boardName.toLowerCase()
  if (n.includes('vilker')) return 'Vilker'
  if (n.includes('vini')) return 'Vini'
  if (n.includes('marcos')) return 'Marcos'
  if (n.includes('luma')) return 'Luma'
  if (n.includes('yas')) return 'Yas'
  if (n.includes('ale ')) return 'Ale'
  if (n.includes('high end')) return 'High End'
  if (n.includes('alavanca')) return 'Alavanca'
  return null
}

/**
 * Extrai respostas NPS de um board (NPS Conselhos / NPS Alavanca / NPS Etapas).
 */
export function extractNPS(
  board: MondayBoard,
  columns: MondayColumn[],
  items: MondayItem[],
): NPSResposta[] {
  const tipo = detectNPSTipo(board.name)
  const colScore = findColumnId(columns, 'nps', 'nota', 'score', 'avaliação', 'avaliacao')
  const colComentario = findColumnId(columns, 'comentário', 'comentario', 'feedback', 'observação')
  const colData = findColumnId(columns, 'data', 'criado', 'recebido')
  const colMentor = findColumnId(columns, 'mentor', 'responsável', 'responsavel', 'closer')
  const colConselho = findColumnId(columns, 'conselho', 'turma', 'grupo')

  return items.map((it) => {
    const score = getColNumber(it, colScore) ?? 0
    return {
      resposta_id: it.id,
      membro_nome: it.name,
      tipo,
      conselho_nome: getColText(it, colConselho),
      mentor: getColText(it, colMentor),
      nps_score: score,
      comentario: getColText(it, colComentario),
      data: getColText(it, colData) ?? '',
      classificacao: score > 0 ? classifyNPS(score) : undefined,
    }
  })
}

function detectNPSTipo(boardName: string): NPSResposta['tipo'] {
  const n = boardName.toLowerCase()
  if (n.includes('conselho')) return 'conselho'
  if (n.includes('alavanca')) return 'alavanca'
  if (n.includes('evento') || n.includes('feedback')) return 'evento'
  return 'turn_lab'
}

/**
 * Extrai conteúdo planejado de boards de cronograma.
 */
export function extractConteudo(
  board: MondayBoard,
  columns: MondayColumn[],
  items: MondayItem[],
): ConteudoPlanejado[] {
  const canalDefault = detectCanal(board.name)
  const colCanal = findColumnId(columns, 'canal', 'plataforma', 'rede')
  const colTipo = findColumnId(columns, 'tipo', 'formato', 'categoria')
  const colStatus = findColumnId(columns, 'status', 'fase')
  const colResp = findColumnId(columns, 'responsável', 'responsavel', 'owner', 'criado por')
  const colData = findColumnId(columns, 'data', 'publicação', 'publicacao', 'agendada')
  const colLink = findColumnId(columns, 'link', 'url')
  const colTema = findColumnId(columns, 'tema', 'pauta', 'assunto')

  return items.map((it) => {
    const canalRaw = getColText(it, colCanal)?.toLowerCase() ?? canalDefault
    return {
      item_id: it.id,
      titulo: it.name,
      canal: normalizeCanal(canalRaw),
      tipo: getColText(it, colTipo),
      status: normalizeStatus(getColText(it, colStatus) ?? 'planejado'),
      responsavel: getColText(it, colResp),
      data_publicacao: getColText(it, colData),
      link: getColText(it, colLink),
      tema: getColText(it, colTema),
    }
  })
}

function detectCanal(boardName: string): string {
  const n = boardName.toLowerCase()
  if (n.includes('instagram') || n.includes('ig ')) return 'instagram'
  if (n.includes('stories')) return 'stories'
  if (n.includes('newsletter')) return 'newsletter'
  if (n.includes('whatsapp') || n.includes('wpp')) return 'whatsapp'
  if (n.includes('founder')) return 'founder_led'
  return 'instagram'
}

function normalizeCanal(s: string | undefined): ConteudoPlanejado['canal'] {
  if (!s) return 'outro'
  const n = s.toLowerCase()
  if (n.includes('instagram')) return 'instagram'
  if (n.includes('story') || n.includes('stories')) return 'stories'
  if (n.includes('feed')) return 'feed'
  if (n.includes('news')) return 'newsletter'
  if (n.includes('whats') || n.includes('wpp')) return 'whatsapp'
  if (n.includes('founder')) return 'founder_led'
  return 'outro'
}

function normalizeStatus(s: string): ConteudoPlanejado['status'] {
  const n = s.toLowerCase()
  if (n.includes('publica') || n.includes('postado') || n.includes('finalizado')) return 'publicado'
  if (n.includes('aprovado') || n.includes('approved')) return 'aprovado'
  if (n.includes('produ') || n.includes('produção')) return 'em_producao'
  if (n.includes('paus') || n.includes('cancela')) return 'pausado'
  return 'planejado'
}

/**
 * Extrai itens de inadimplência / churn / pagamentos.
 */
export function extractInadimplencia(
  _board: MondayBoard,
  columns: MondayColumn[],
  items: MondayItem[],
): InadimplenciaItem[] {
  const colValor = findColumnId(columns, 'valor', 'amount', 'r$', 'price')
  const colDias = findColumnId(columns, 'dias', 'atraso')
  const colMentor = findColumnId(columns, 'mentor', 'responsável', 'responsavel', 'closer')
  const colStatus = findColumnId(columns, 'status', 'situação', 'situacao')
  const colVenc = findColumnId(columns, 'vencimento', 'data vencimento', 'due')
  const colMotivo = findColumnId(columns, 'motivo', 'razão', 'razao', 'observação')

  return items.map((it) => ({
    item_id: it.id,
    membro_nome: it.name,
    valor: getColNumber(it, colValor) ?? 0,
    dias_atraso: getColNumber(it, colDias),
    mentor_responsavel: getColText(it, colMentor),
    status: normalizeInadimpStatus(getColText(it, colStatus) ?? 'aberto'),
    vencimento: getColText(it, colVenc),
    motivo: getColText(it, colMotivo),
  }))
}

function normalizeInadimpStatus(s: string): InadimplenciaItem['status'] {
  const n = s.toLowerCase()
  if (n.includes('pago') || n.includes('paid') || n.includes('quitado')) return 'pago'
  if (n.includes('negoci')) return 'negociando'
  if (n.includes('baixa') || n.includes('perda')) return 'baixa'
  return 'aberto'
}

// =============================================================
// DISPATCHER — escolhe extrator por nome do board
// =============================================================

export type ExtractedView =
  | { kind: 'membros'; rows: MembroPorMentor[] }
  | { kind: 'nps'; rows: NPSResposta[] }
  | { kind: 'conteudo'; rows: ConteudoPlanejado[] }
  | { kind: 'inadimplencia'; rows: InadimplenciaItem[] }
  | { kind: 'unknown'; rows: [] }

export function dispatchBoard(
  board: MondayBoard,
  columns: MondayColumn[],
  items: MondayItem[],
): ExtractedView {
  const n = board.name.toLowerCase()

  // Carteiras de mentor
  if (n.includes('carteira') || n.startsWith('💷') || n.startsWith('carteira ')) {
    return { kind: 'membros', rows: extractCarteiraMentor(board, columns, items) }
  }

  // NPS
  if (n.includes('nps') || n.includes('feedback')) {
    return { kind: 'nps', rows: extractNPS(board, columns, items) }
  }

  // Conteúdo / Cronograma
  if (
    n.includes('cronograma') ||
    n.includes('conteúdo') ||
    n.includes('conteudo') ||
    n.includes('redes sociais') ||
    n.includes('founder led') ||
    n.includes('calendário') ||
    n.includes('calendario')
  ) {
    return { kind: 'conteudo', rows: extractConteudo(board, columns, items) }
  }

  // Inadimplência / Financeiro
  if (
    n.includes('inadimpl') ||
    n.includes('churn') ||
    n.includes('pagamento') ||
    n.includes('solicitações para pagamento')
  ) {
    return { kind: 'inadimplencia', rows: extractInadimplencia(board, columns, items) }
  }

  return { kind: 'unknown', rows: [] }
}
