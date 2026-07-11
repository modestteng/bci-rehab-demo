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
  { key: 'none' as const, label: '群体分布' },
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
        title="跨被试性能方差的收敛"
        description="通用模型对新用户的平均准确率偏低，且跨个体标准差高达 σ 9.2%，导致部分被试的实际可用性显著不足。"
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
                ? '。最佳被试性能有所回落，这是收缩估计的数学必然，此处如实呈现。'
                : '。该个体的准确率提升，即跨被试标准差收敛在单一受试者身上的体现。'}
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
        title="性能方差与算法公平性"
        description="跨被试标准差反映同一系统在不同个体上的可用性差异，是评估算法公平性的直接指标。"
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
            本系统缓解而非消除该现象：个体自适应后仍有 {adaptive.pass.total - adaptive.pass.count} / {adaptive.pass.total} 名被试
            低于 {ACCURACY_THRESHOLD}% 门槛。BCI illiteracy（脑机接口失能）是文献中已被反复报道的客观现象。
          </span>
        </div>
        <NavCard to="ethics" title="伦理：算法公平性" desc="个体间的性能差异本身即构成一种伤害" tone="cyan" />
      </SectionCard>

      <SectionCard
        kicker="记忆功能"
        title="群体先验与个体校准"
        description="群体先验将校准试次由冷启动的 180 次降至 10 次，此即需求书所述「记忆功能启动」在临床上的直接意义。"
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
          卒中患者在训练约 10 分钟后疲劳指数即显著上升，24 分钟的纯校准时长在临床上不可接受。
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
          浅色基准条为群体先验权重（24 名历史被试的累计效果），实心条为当前个体的融合权重。
          可直观观察个体权重自群体先验逐步偏移的过程。
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
            若采用纯 softmax，初始权重仅 {(weights[4].prior * 100).toFixed(1)}% 的「律动跳舞」在 10 次校准中可能一次都不被抽中：
            群体先验将使小众但对特定个体有效的策略长期得不到探索机会。本系统将先验实现为<strong>伪计数</strong>，
            并以 UCB 准则打分 —— 跳舞的初始伪计数不足 1，探索项极大，因而在早期必然被采样。
            由此，「给予较大权重」与「保留小众策略的探索机会」在同一组公式下同时成立。
          </span>
        </div>
      </CollapseCard>

      <CollapseCard id="adapt-fairness" kicker="日志" title="本次校准的抽样序列" summary={`${state.log.length} 条`}>
        {state.log.length === 0 ? (
          <p className="section-helper">尚未开始校准。请先选择接入的用户类型，或点击「下一次反馈」逐次推进。</p>
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
