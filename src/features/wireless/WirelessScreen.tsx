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
        title={`${LATENCY_TOTAL}ms 是怎么来的`}
        description={`首页那个「响应延迟 ${LATENCY_TOTAL}ms ≤ ${LATENCY_LIMIT}ms」不是一个孤立的数字，它由五段构成，每段都有物理出处。`}
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
            无线化不是免费的：采集打包 + BLE 传输合计 {WIRELESS_MS}ms，占了整个延迟预算的{' '}
            {(WIRELESS_SHARE * 100).toFixed(1)}%。我们把这个代价拆出来给你看 —— 用 +{WIRELESS_COST}ms 换患者不被线缆束缚，
            这是一个量化的权衡，不是一句口号。
          </span>
        </div>

        <div className="inline-note warn-note">
          <span>
            <strong>安全环路不走无线。</strong>过力保护运行在本地 MCU 上，环路 {SAFETY_LOOP_MS}ms ——
            安全不能依赖一条可能丢包的无线链路。
          </span>
        </div>
      </SectionCard>

      <SectionCard
        kicker="范式的形式体现"
        title="范式决定硬件形态"
        description="「无线采集」和「范式」不是两件事：需要哪些电极、要不要外挂刺激器，是由范式直接决定的。"
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
            <strong>工程收口：</strong>一顶 8 通道无线头戴同时覆盖两个范式的电极子集 ——
            切换范式 = 切换通道子集 + 开关刺激器，<strong>不换硬件</strong>。这就是「普适性扩展」在硬件层的落地。
          </span>
        </div>
      </SectionCard>

      <CollapseCard id="wireless-specs" kicker="硬件" title="采集头戴规格" summary="8 通道 · 250Hz · BLE 5.0">
        <StatGrid items={wirelessSpecs.map((s) => ({ label: s.label, value: s.value, hint: s.hint }))} />
      </CollapseCard>

      <CollapseCard id="wireless-paradigm" kicker="说明" title="量纲说明" summary="176ms ≠ 2.5s">
        <p className="ssvep-note utility-surface">{LATENCY_CAVEAT}</p>
      </CollapseCard>

      <NavCard to="adaptation" title="校准要做几次？" desc="有群体先验 10 次，冷启动 180 次" badge="18×" tone="green" />
    </div>
  )
}
