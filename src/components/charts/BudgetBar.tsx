import type { LatencySegment } from '../../data/wireless'
import { LATENCY_LIMIT } from '../../data/wireless'

type BudgetBarProps = {
  segments: readonly LatencySegment[]
  /** 用有线耗时代替无线耗时 */
  wired?: boolean
  active?: string | null
  onPick?: (key: string | null) => void
}

/**
 * 端到端延迟预算堆叠条。横轴代表 200ms 的预算上限（不是 176ms），
 * 所以「余量」是看得见的一段虚线空白。
 */
export function BudgetBar({ segments, wired = false, active, onPick }: BudgetBarProps) {
  const total = segments.reduce((sum, s) => sum + (wired ? s.wiredMs : s.ms), 0)
  const headroom = LATENCY_LIMIT - total

  return (
    <div className="budget-bar-wrap">
      <div className="budget-bar" role="img" aria-label={`延迟预算 ${total}ms，上限 ${LATENCY_LIMIT}ms`}>
        {segments.map((segment) => {
          const ms = wired ? segment.wiredMs : segment.ms
          if (ms === 0) {
            return null
          }
          return (
            <button
              key={segment.key}
              type="button"
              className={`budget-seg tone-${segment.tone} ${active === segment.key ? 'active' : ''}`}
              style={{ flexGrow: ms }}
              onClick={() => onPick?.(active === segment.key ? null : segment.key)}
              aria-label={`${segment.stage} ${ms}ms`}
            >
              <span className="budget-seg-ms">{ms}</span>
            </button>
          )
        })}
        {headroom > 0 ? (
          <div className="budget-headroom" style={{ flexGrow: headroom }}>
            <span>余量 {headroom}</span>
          </div>
        ) : null}
      </div>
      <div className="budget-scale">
        <span>0</span>
        <strong>
          {total}ms / {LATENCY_LIMIT}ms
        </strong>
        <span>{LATENCY_LIMIT}</span>
      </div>
    </div>
  )
}
