import { CHART_W, ChartFrame } from './ChartFrame'
import {
  ACCURACY_THRESHOLD,
  conditions,
  type CohortSubject,
  type ConditionKey,
  type ConditionStats,
} from '../../data/adaptation'

const H = 224
/** 顶部留出一条图例带，达标线的说明放在那里 —— 放在线上会压到点云 */
const Y_TOP = 30
const Y_BOTTOM = 188
const ACC_MIN = 55
const ACC_MAX = 100
const BAND_HALF = 30
const JITTER = 21

function yFor(accuracy: number) {
  const clamped = Math.max(ACC_MIN, Math.min(ACC_MAX, accuracy))
  return Y_BOTTOM - ((clamped - ACC_MIN) / (ACC_MAX - ACC_MIN)) * (Y_BOTTOM - Y_TOP)
}

function xFor(index: number) {
  // 三列均分：88 / 172 / 256
  return 88 + index * 84
}

type DotPlotProps = {
  cohort: CohortSubject[]
  stats: Record<ConditionKey, ConditionStats>
  /** 高亮某一名被试的三点连线 */
  traced?: CohortSubject | null
}

/**
 * 三列抖动点图 + ±1σ 带。
 * σ 带高度 3 倍收缩，是整个模块的视觉主张：不用读数字，形状自己会说话。
 */
export function DotPlot({ cohort, stats, traced }: DotPlotProps) {
  const thresholdY = yFor(ACCURACY_THRESHOLD)

  return (
    <ChartFrame height={H} title="24 名被试在三种模型条件下的意图识别准确率分布" watermark="合成数据 · 非临床结论">
      {/* 达标线：通用模型的点云大半掉在线下，自适应的浮在线上 */}
      <line x1="26" x2={CHART_W - 14} y1={thresholdY} y2={thresholdY} className="dot-threshold" />
      <line x1="26" x2="44" y1="12" y2="12" className="dot-threshold" />
      <text x="50" y="15.5" className="dot-threshold-label">
        {ACCURACY_THRESHOLD}% 达标线
      </text>

      {conditions.map((condition, i) => {
        const st = stats[condition.key]
        const bandTop = yFor(st.mean + st.std)
        const bandBottom = yFor(st.mean - st.std)
        const cx = xFor(i)

        return (
          <g key={condition.key} className={`dot-col tone-${condition.tone}`}>
            {/* ±1σ 带 */}
            <rect
              x={cx - BAND_HALF}
              y={bandTop}
              width={BAND_HALF * 2}
              height={Math.max(2, bandBottom - bandTop)}
              rx="8"
              className="dot-band"
            />
            {/* 均值线 */}
            <line x1={cx - BAND_HALF} x2={cx + BAND_HALF} y1={yFor(st.mean)} y2={yFor(st.mean)} className="dot-mean" />

            {cohort.map((subject) => (
              <circle
                key={subject.id}
                cx={cx + subject.jitter * JITTER}
                cy={yFor(subject.accuracy[condition.key])}
                r={traced && traced.id === subject.id ? 4 : 2.7}
                className={`dot-point ${traced && traced.id === subject.id ? 'traced' : ''}`}
              />
            ))}

            <text x={cx} y={H - 16} className="dot-col-label">
              {condition.short}
            </text>
            <text x={cx} y={H - 3} className="dot-col-sigma">
              σ {st.std.toFixed(1)}%
            </text>
          </g>
        )
      })}

      {/* 单个被试的配对轨迹 */}
      {traced ? (
        <polyline
          points={conditions.map((c, i) => `${xFor(i) + traced.jitter * JITTER},${yFor(traced.accuracy[c.key])}`).join(' ')}
          className="dot-trace"
          fill="none"
        />
      ) : null}
    </ChartFrame>
  )
}
