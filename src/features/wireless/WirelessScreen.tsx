import { useState } from 'react'
import {
  LATENCY_CAVEAT,
  LATENCY_HEADROOM,
  LATENCY_LIMIT,
  LATENCY_TOTAL,
  LATENCY_WIRED_TOTAL,
  SAFETY_LOOP_MS,
  WIRELESS_COST,
  WIRELESS_MS,
  WIRELESS_SHARE,
  electrodes,
  latencyBudget,
  paradigmForms,
  wirelessSpecs,
  type ParadigmKey,
} from '../../data/wireless'
import { BudgetBar } from '../../components/charts/BudgetBar'
import { HeadMontage } from '../../components/charts/HeadMontage'
import { CollapseCard, NavCard, SectionCard } from '../../components/ui/Card'
import { OptionGroup, StatusPill } from '../../components/ui/Pill'
import { StatGrid } from '../../components/ui/Stat'

const PARADIGMS = [
  { key: 'active' as const, label: '主动 · 运动想象' },
  { key: 'passive' as const, label: '被动 · SSVEP' },
]

const LINK_MODES = [
  { key: 'wireless' as const, label: '无线（BLE）' },
  { key: 'wired' as const, label: '有线对照' },
]

export function WirelessScreen() {
  const [paradigm, setParadigm] = useState<ParadigmKey>('active')
  const [link, setLink] = useState<'wireless' | 'wired'>('wireless')
  const [picked, setPicked] = useState<string | null>(null)

  const form = paradigmForms[paradigm]
  const channels = electrodes.filter((e) => e.paradigm === paradigm)
  const wired = link === 'wired'
  const total = wired ? LATENCY_WIRED_TOTAL : LATENCY_TOTAL

  return (
    <div className="mobile-screen wireless-screen">
      <SectionCard
        kicker="延迟预算"
        title="端到端时延预算分解"
        description={`首页指标「响应延迟 ${LATENCY_TOTAL}ms ≤ ${LATENCY_LIMIT}ms」并非孤立数值，而由五个环节构成，各环节均有明确的物理依据。`}
        aside={<StatusPill tone={total <= LATENCY_LIMIT ? 'success' : 'magenta'}>{total}ms</StatusPill>}
      >
        <OptionGroup label="链路形态" options={LINK_MODES} value={link} onChange={setLink} />

        <BudgetBar segments={latencyBudget} wired={wired} active={picked} onPick={setPicked} />

        <div className="plan-list">
          {latencyBudget.map((segment) => {
            const ms = wired ? segment.wiredMs : segment.ms
            return (
              <button
                key={segment.key}
                type="button"
                className={`budget-legend utility-surface tone-${segment.tone} ${picked === segment.key ? 'active' : ''} ${ms === 0 ? 'zeroed' : ''}`}
                onClick={() => setPicked(picked === segment.key ? null : segment.key)}
              >
                <span className="budget-dot" />
                <span className="budget-legend-copy">
                  <strong>
                    {segment.stage} · {ms}ms
                  </strong>
                  <span>{segment.detail}</span>
                </span>
              </button>
            )
          })}
        </div>

        <StatGrid
          columns={3}
          items={[
            { label: '无线链路', value: `${WIRELESS_MS}ms`, hint: `占预算 ${(WIRELESS_SHARE * 100).toFixed(1)}%` },
            { label: '无线的代价', value: `+${WIRELESS_COST}ms`, hint: `有线 ${LATENCY_WIRED_TOTAL}ms` },
            { label: '剩余余量', value: `${LATENCY_HEADROOM}ms`, hint: `上限 ${LATENCY_LIMIT}ms` },
          ]}
        />

        <div className="inline-note">
          <span>
            无线化存在明确的时延代价：采集打包与 BLE 传输合计 {WIRELESS_MS}ms，占整个时延预算的{' '}
            {(WIRELESS_SHARE * 100).toFixed(1)}%。以 +{WIRELESS_COST}ms 的时延换取患者摆脱线缆束缚，
            是一项可量化的工程权衡。
          </span>
        </div>

        <div className="inline-note warn-note">
          <span>
            <strong>安全环路不经无线链路。</strong>过力保护运行于本地 MCU，环路时延 {SAFETY_LOOP_MS}ms。
            安全机制不应依赖存在丢包可能的无线链路。
          </span>
        </div>
      </SectionCard>

      <SectionCard
        kicker="范式的形式体现"
        title="范式与硬件形态的对应关系"
        description="无线采集与范式并非彼此独立：所需电极位置、是否需要外部刺激器，均由所采用的范式直接决定。"
      >
        <OptionGroup label="范式" options={PARADIGMS} value={paradigm} onChange={setParadigm} />

        <div className="montage-row utility-surface">
          <HeadMontage paradigm={paradigm} />
          <div className="montage-copy">
            <strong>{form.label}</strong>
            <p>{form.channels}</p>
            <span className="montage-chips">
              {channels.map((e) => (
                <span key={e.id} className="channel-chip trace-0">
                  {e.id}
                </span>
              ))}
            </span>
          </div>
        </div>

        <StatGrid
          items={[
            { label: '外部刺激器', value: form.stimulator },
            { label: '视觉通道', value: form.visualChannel },
            { label: '头戴形态', value: form.headset },
            { label: '校准成本', value: form.calibration },
          ]}
        />

        <div className="inline-note">
          <span>{form.note}</span>
        </div>

        <div className="inline-note success-note">
          <span>
            <strong>工程实现：</strong>单顶 8 通道无线头戴即可同时覆盖两种范式所需的电极子集。
            切换范式仅需切换通道子集并启停刺激器，<strong>无需更换硬件</strong>。普适性扩展由此在硬件层得到落地。
          </span>
        </div>
      </SectionCard>

      <CollapseCard id="wireless-specs" kicker="硬件" title="采集头戴规格" summary="8 通道 · 250Hz · BLE 5.0">
        <StatGrid items={wirelessSpecs.map((s) => ({ label: s.label, value: s.value, hint: s.hint }))} />
      </CollapseCard>

      <CollapseCard id="wireless-paradigm" kicker="说明" title="量纲说明" summary="176ms ≠ 2.5s">
        <p className="ssvep-note utility-surface">{LATENCY_CAVEAT}</p>
      </CollapseCard>

      <NavCard to="adaptation" title="校准试次对比" desc="群体先验 10 次，冷启动 180 次" badge="18×" tone="green" />
    </div>
  )
}
