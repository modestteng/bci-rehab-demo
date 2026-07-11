import { useState } from 'react'
import {
  ACCURACY_THRESHOLD,
  CALIBRATION_TRIALS,
  TRIAL_SECONDS,
  adaptCurves,
  comfortStrategies,
  conditions,
  personas,
  trialsToReach,
  type PersonaKey,
} from '../../data/adaptation'
import { DotPlot } from '../../components/charts/DotPlot'
import { CollapseCard, NavCard, SectionCard } from '../../components/ui/Card'
import { OptionGroup, StatusPill } from '../../components/ui/Pill'
import { StatGrid } from '../../components/ui/Stat'
import type { useAdaptationController } from '../../hooks/useAdaptationController'

type Props = { adapt: ReturnType<typeof useAdaptationController> }

const TRACE_CHOICES = [
  { key: 'none' as const, label: '不看个体' },
  { key: 'worst' as const, label: '最差被试' },
  { key: 'best' as const, label: '最佳被试' },
]

const warmTrials = trialsToReach(adaptCurves.warm, 88)
const coldTrials = trialsToReach(adaptCurves.cold, 88)

export function AdaptationScreen({ adapt }: Props) {
  const { phase, phaseText, persona, personaKey, state, weights, cohort, stats, handleEnroll, handleStep, handleReset } = adapt
  const [trace, setTrace] = useState<'none' | 'worst' | 'best'>('none')

  const sorted = [...cohort].sort((a, b) => a.z - b.z)
  const worst = sorted[0]
  const best = sorted[sorted.length - 1]
  const traced = trace === 'worst' ? worst : trace === 'best' ? best : null

  const generic = stats.generic
  const adaptive = stats.adaptive
  const sigmaDrop = Math.round((1 - adaptive.std / generic.std) * 100)

  return (
    <div className="mobile-screen adaptation-screen">
      <SectionCard
        kicker="个体支持性"
        title="让最差的那个人也能用上"
        description="通用模型对新用户不仅平均准确率低，而且跨个体方差极大 —— 有人几乎完全可用，有人几乎完全不可用。"
        aside={<StatusPill tone="green">σ ↓{sigmaDrop}%</StatusPill>}
      >
        <DotPlot cohort={cohort} stats={stats} traced={traced} />

        <OptionGroup
          label="查看单个被试的轨迹"
          options={TRACE_CHOICES}
          value={trace}
          onChange={setTrace}
          columns={3}
        />

        {traced ? (
          <div className="inline-note">
            <span>
              {traced.id}：{conditions.map((c) => `${traced.accuracy[c.key].toFixed(1)}%`).join(' → ')}（
              {traced.accuracy.adaptive - traced.accuracy.generic >= 0 ? '+' : ''}
              {(traced.accuracy.adaptive - traced.accuracy.generic).toFixed(1)}pp）
              {trace === 'best'
                ? '。最佳被试反而下降 —— 这是收缩估计的数学必然，我们没有隐藏它。'
                : '。这就是「减少 std 方差」在一个真实个体身上的意义。'}
            </span>
          </div>
        ) : null}

        <StatGrid
          columns={3}
          items={conditions.map((c) => ({
            label: c.short,
            value: `${stats[c.key].mean.toFixed(1)}%`,
            hint: `σ ${stats[c.key].std.toFixed(1)}%`,
          }))}
        />
      </SectionCard>

      <SectionCard
        kicker="公平性"
        title="σ 大就是不公平"
        description="标准差不是一个统计学摆设。它衡量的是：同一套设备，对不同的人是不是同样可用。"
      >
        <StatGrid
          items={[
            { label: '最差四分位均值', value: `${generic.bottomQuartile.toFixed(1)}% → ${adaptive.bottomQuartile.toFixed(1)}%` },
            { label: '极差（最好−最差）', value: `${generic.span.toFixed(1)} → ${adaptive.span.toFixed(1)}pp` },
            { label: `达标人数（≥${ACCURACY_THRESHOLD}%）`, value: `${generic.pass.count} → ${adaptive.pass.count} / ${adaptive.pass.total}` },
            { label: '仍未达标', value: `${adaptive.pass.total - adaptive.pass.count} 人` },
          ]}
        />
        <div className="inline-note warn-note">
          <span>
            我们不宣称消除了它：即使个体自适应之后，仍有 {adaptive.pass.total - adaptive.pass.count} / {adaptive.pass.total} 名被试
            低于 {ACCURACY_THRESHOLD}% 门槛。BCI illiteracy（脑机接口失能）是真实存在的现象，本系统只能缓解，不能消除。
          </span>
        </div>
        <NavCard to="ethics" title="伦理：算法公平性" desc="性能差异本身就是一种伤害" tone="cyan" />
      </SectionCard>

      <SectionCard
        kicker="记忆功能"
        title="新用户接入"
        description="群体先验把校准从冷启动的 180 次压到 10 次 —— 这就是「记忆功能启动」的临床意义。"
        aside={<StatusPill tone={phase === 'converged' ? 'success' : phase === 'idle' ? 'idle' : 'active'}>{phaseText}</StatusPill>}
      >
        <StatGrid
          columns={3}
          items={[
            { label: '有先验', value: `${warmTrials.toFixed(0)} 次`, hint: `${(warmTrials * TRIAL_SECONDS).toFixed(0)} 秒` },
            { label: '冷启动', value: `${coldTrials.toFixed(0)} 次`, hint: `${Math.round((coldTrials * TRIAL_SECONDS) / 60)} 分钟` },
            { label: '提速', value: `${(coldTrials / warmTrials).toFixed(0)}×`, hint: '同一目标准确率' },
          ]}
        />
        <span className="metric-note">
          对一个训练 10 分钟疲劳指数就明显上升的卒中患者，24 分钟的纯校准意味着这套系统根本不能用。
        </span>

        <OptionGroup
          label="选择接入的用户类型"
          options={personas.map((p) => ({ key: p.key as PersonaKey, label: p.label }))}
          value={personaKey}
          onChange={handleEnroll}
          columns={3}
        />
        <p className="section-helper">{persona.note}</p>

        <div className="adapt-progress">
          <div className="meter-track">
            <span className="meter-fill meter-green" style={{ width: `${(state.k / CALIBRATION_TRIALS) * 100}%` }} />
          </div>
          <span className="metric-note">
            个体校准 {state.k} / {CALIBRATION_TRIALS} 次 · 当前准确率 {adapt.warmAccuracy.toFixed(1)}%
            {phase === 'converged' ? ' · 已达首页 KPI 88.0%' : ''}
          </span>
        </div>

        <div className="hero-actions-grid two-actions">
          <button type="button" className="primary-button" onClick={handleStep} disabled={state.k >= CALIBRATION_TRIALS}>
            下一次反馈
          </button>
          <button type="button" className="secondary-button" onClick={handleReset}>
            重置
          </button>
        </div>
      </SectionCard>

      <CollapseCard
        id="adapt-memory"
        kicker="策略池"
        title="多形态安抚的奖励记忆"
        summary={`${comfortStrategies.length} 种形态`}
      >
        <p className="section-helper">
          幽灵条 = 群体先验权重（24 名历史被试的累计效果）；实心条 = 当前个体的融合权重。
          个体从先验上「长出来」的过程是看得见的。
        </p>

        <div className="rho-list">
          {weights.map((row) => {
            const meta = comfortStrategies.find((s) => s.key === row.key)!
            return (
              <div key={row.key} className="rho-row">
                <span className="rho-name">
                  {meta.glyph} {meta.label}
                  <small>
                    群体 {meta.groupHits}/{meta.groupTrials} · 个体 {row.individualTrials} 次
                  </small>
                </span>
                <span className="rho-track">
                  <span className="rho-ghost" style={{ width: `${row.prior * 100}%` }} />
                  <span className={`rho-fill tone-${meta.tone}`} style={{ width: `${row.blended * 100}%` }} />
                </span>
                <strong className={row.delta > 0.02 ? 'up' : row.delta < -0.02 ? 'down' : ''}>
                  {(row.blended * 100).toFixed(0)}%
                </strong>
              </div>
            )
          })}
        </div>

        <div className="inline-note">
          <span>
            纯 softmax 会让初始权重仅 {(weights[4].prior * 100).toFixed(1)}% 的「律动跳舞」在 10 次校准里一次都不被抽中 ——
            群体先验会把小众有效策略活活饿死。解法是把先验实现为<strong>伪计数</strong>，再用 UCB 打分：
            跳舞初始伪计数不足 1，探索奖励极大，前几次必被试到。
            「给予较大权重」和「不饿死小众」由同一行公式同时成立。
          </span>
        </div>
      </CollapseCard>

      <CollapseCard id="adapt-fairness" kicker="日志" title="本次校准的抽样序列" summary={`${state.log.length} 条`}>
        {state.log.length === 0 ? (
          <p className="section-helper">尚未开始校准。点上方「下一次反馈」或选择一个用户类型接入。</p>
        ) : (
          <div className="adapt-log">
            {state.log.map((entry) => {
              const meta = comfortStrategies.find((s) => s.key === entry.strategy)!
              return (
                <span key={entry.k} className={`adapt-log-chip utility-surface ${entry.hit ? 'hit' : 'miss'}`}>
                  {entry.k}. {meta.glyph} {meta.label} {entry.hit ? '✓' : '✗'}
                </span>
              )
            })}
          </div>
        )}
      </CollapseCard>
    </div>
  )
}
