/**
 * AdFlow v4 chart widgets. Every widget composes with ChartCard
 * and uses Recharts under the hood. Import from here.
 */

export { default as LineChartWidget } from './LineChartWidget'
export type { LineSeries, LineChartWidgetProps } from './LineChartWidget'

export { default as AreaChartWidget } from './AreaChartWidget'
export type { AreaChartWidgetProps } from './AreaChartWidget'

export { default as BarChartWidget } from './BarChartWidget'
export type { BarSeries, BarChartWidgetProps } from './BarChartWidget'

export { default as DonutChartWidget } from './DonutChartWidget'
export type { DonutSegment, DonutChartWidgetProps } from './DonutChartWidget'

export { default as FunnelChartWidget } from './FunnelChartWidget'
export type { FunnelStage, FunnelChartWidgetProps } from './FunnelChartWidget'

export { default as GaugeWidget } from './GaugeWidget'
export type { GaugeWidgetProps } from './GaugeWidget'

export { default as TableWidget } from './TableWidget'
export type { TableColumn, TableWidgetProps } from './TableWidget'

export { default as WidgetRenderer } from './WidgetRenderer'
