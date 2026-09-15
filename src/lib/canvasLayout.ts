/**
 * Constantes de layout do canvas do Planner (ReactFlow).
 *
 * Antes esses números viviam duplicados e soltos dentro de `useMetaSync.ts` e
 * `metaAdsSync.ts` (cada import de campanha do Meta Ads recalculava posição
 * com "magic numbers" diferentes). Centralizar aqui evita divergência entre
 * os dois pontos de sync e deixa o espaçamento fácil de ajustar num lugar só.
 *
 * Valores aumentados em relação ao original (colGap 250→320, rowGap 200→260)
 * porque os nós ficaram fisicamente maiores (ver src/components/Nodes) — com
 * o espaçamento antigo, nós maiores encostavam uns nos outros.
 */
export const PLANNER_LAYOUT = {
  /** Posição do nó de Campanha (topo da árvore). */
  campaign: { x: 250, y: 150 },
  /** X fixo da coluna de Ad Sets, Y inicial antes de aplicar rowGap * index. */
  adSet: { x: 250, yStart: 380 },
  /** X inicial da primeira coluna de Ads dentro de um Ad Set, Y inicial. */
  ad: { xStart: 100, yStart: 620 },
  /** Distância horizontal entre nós irmãos (ex: Ads lado a lado). */
  colGap: 180,
  /** Distância vertical entre "linhas" da árvore (ex: Ad Sets, Ads). */
  rowGap: 150,
  /** Zoom inicial do viewport ao abrir um flow recém-importado. */
  initialZoom: 0.9,
} as const
