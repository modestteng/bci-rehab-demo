import type { ReactNode } from 'react'
import type { Tone } from '../../design/tokens'

/** 全项目统一图表宽度，只让高度可变 */
export const CHART_W = 320

type ChartFrameProps = {
  height: number
  /** 无障碍标题 */
  title: string
  /** 套一层 .waveform-card 外壳（原先 4 处手贴） */
  framed?: boolean
  children: ReactNode
  className?: string
  /** 右下角水印，例如「合成数据 · 非临床结论」 */
  watermark?: string
}

export function ChartFrame({ height, title, framed = true, children, className, watermark }: ChartFrameProps) {
  const svg = (
    <svg
      viewBox={`0 0 ${CHART_W} ${height}`}
      className={`chart-svg ${className ?? ''}`.trim()}
      role="img"
      aria-label={title}
    >
      {children}
    </svg>
  )

  if (!framed) {
    return svg
  }

  return (
    <div className="waveform-card utility-surface chart-card">
      {svg}
      {/* 水印做成图下的题注而不是浮层 —— 浮层一定会压到某个数据标签上 */}
      {watermark ? <span className="chart-watermark">{watermark}</span> : null}
    </div>
  )
}

/** 坐标轴。原先在两处被手抄成不同坐标的 <path className="chart-axis" />。 */
export function Axes({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  return (
    <>
      <path d={`M${x0} ${y1} H${x1}`} className="chart-axis" />
      <path d={`M${x0} ${y0} V${y1}`} className="chart-axis" />
    </>
  )
}

type SeriesProps = {
  /** 沿用现有的 "x,y x,y" 字符串协议，数据层零改动 */
  points: string
  tone: Tone
  width?: number
  opacity?: number
  dashed?: boolean
}

/** 折线系列。描边一律 var(--t)，取代原先四种互不相同的着色写法。 */
export function Series({ points, tone, width = 3, opacity = 1, dashed }: SeriesProps) {
  return (
    <polyline
      points={points}
      className={`chart-series tone-${tone} ${dashed ? 'dashed' : ''}`}
      fill="none"
      strokeWidth={width}
      opacity={opacity}
    />
  )
}
