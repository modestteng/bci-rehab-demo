import type { Tone } from '../../design/tokens'
import { AppIcon, type IconName } from './Icon'

export type StatItem = {
  label: string
  value: string
  /** chip 变体的着色 */
  tone?: Tone
  /** metric 变体的目标值（如 ≥85%）/ trust 变体的注脚 */
  target?: string
  /** metric 变体的增量（如 +3.0%）/ trust 变体的说明 */
  hint?: string
  icon?: IconName
  /** 给了就整块可点，用于 KPI 下钻 */
  onClick?: () => void
}

type StatGridProps = {
  items: readonly StatItem[]
  columns?: 2 | 3
  variant?: 'mini' | 'chip' | 'metric' | 'trust'
}

/** 取代原来 9 处手抄的 summary-card-grid + MiniStat/Chip/MetricCard */
export function StatGrid({ items, columns = 2, variant = 'mini' }: StatGridProps) {
  return (
    <div className={`summary-card-grid ${columns === 3 ? 'three-up-cards' : 'two-up'}`}>
      {items.map((item) => (
        <StatCell key={item.label} item={item} variant={variant} />
      ))}
    </div>
  )
}

function StatCell({ item, variant }: { item: StatItem; variant: NonNullable<StatGridProps['variant']> }) {
  const clickable = Boolean(item.onClick)
  const Tag = clickable ? 'button' : 'div'
  const extra = clickable ? { type: 'button' as const, onClick: item.onClick } : {}

  if (variant === 'metric') {
    return (
      <Tag className={`metric-card compact utility-surface ${clickable ? 'stat-clickable' : ''}`} {...extra}>
        <div className="metric-title-row">
          {item.icon ? (
            <span className="metric-icon-chip">
              <AppIcon name={item.icon} active />
            </span>
          ) : null}
          <div className="metric-title-copy">
            <p>{item.label}</p>
            {item.target ? <span>{item.target}</span> : null}
          </div>
        </div>
        <strong>{item.value}</strong>
        {item.hint ? <small className="kpi-helper">{item.hint}</small> : null}
        {clickable ? <span className="stat-chevron" aria-hidden="true">›</span> : null}
      </Tag>
    )
  }

  if (variant === 'chip') {
    return (
      <Tag className={`session-preview-chip utility-surface tone-${item.tone ?? 'cyan'} ${clickable ? 'stat-clickable' : ''}`} {...extra}>
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </Tag>
    )
  }

  if (variant === 'trust') {
    return (
      <Tag className={`hero-trust-card utility-surface ${clickable ? 'stat-clickable' : ''}`} {...extra}>
        <span>{item.label}</span>
        <strong>{item.value}</strong>
        {item.hint ? <small>{item.hint}</small> : null}
      </Tag>
    )
  }

  return (
    <Tag className={`mini-stat utility-surface ${clickable ? 'stat-clickable' : ''}`} {...extra}>
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      {item.hint ? <small className="mini-stat-hint">{item.hint}</small> : null}
      {clickable ? <span className="stat-chevron" aria-hidden="true">›</span> : null}
    </Tag>
  )
}

export function Meter({
  label,
  value,
  tone,
  inverse,
}: {
  label: string
  value: number
  tone: Tone
  inverse?: boolean
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="meter-item">
      <div className="meter-label-row">
        <span>{label}</span>
        <strong>{safe}%</strong>
      </div>
      <div className="meter-track">
        <span className={`meter-fill meter-${tone} ${inverse ? 'inverse' : ''}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}

export function FeedbackTile({
  label,
  value,
  tone,
  detail,
  /** 安全阈值标线（0–100），给了就画一根竖线 */
  threshold,
  clipped,
}: {
  label: string
  value: number
  tone: Tone
  detail: string
  threshold?: number
  clipped?: boolean
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`feedback-tile compact utility-surface ${clipped ? 'clipped' : ''}`}>
      <div className="feedback-head">
        <strong>{label}</strong>
        <span>{safe}%</span>
      </div>
      <div className="meter-track">
        <span className={`meter-fill meter-${tone}`} style={{ width: `${safe}%` }} />
        {threshold !== undefined ? (
          <span className="meter-threshold" style={{ left: `${threshold}%` }} aria-hidden="true" />
        ) : null}
      </div>
      <p>{detail}</p>
    </div>
  )
}
