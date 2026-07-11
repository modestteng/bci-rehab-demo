import type { CSSProperties } from 'react'
import { paradigmComparison, ssvepConfig, ssvepNotes, ssvepPipeline, ssvepTargets } from '../../data/ssvep'
import { ChartFrame, Series } from '../../components/charts/ChartFrame'
import { CollapseCard, NavCard, SectionCard } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Pill'
import { StatGrid } from '../../components/ui/Stat'
import { spectrumX, type useSsvepController } from '../../hooks/useSsvepController'
import { useNav } from '../../hooks/useNavigation'

type Props = { ssvep: ReturnType<typeof useSsvepController> }

function phaseLabel(phase: number) {
  const quarter = Math.round((phase / Math.PI) * 2)
  return ['0', 'π/2', 'π', '3π/2'][quarter] ?? phase.toFixed(2)
}

export function SsvepScreen({ ssvep }: Props) {
  const { push } = useNav()
  const {
    flicker,
    phase,
    phaseText,
    gazeIntent,
    decodedIntent,
    attendedTarget,
    progress,
    selections,
    spectrum,
    occipitalWaves,
    rhoMap,
    accepted,
    itr,
    secondsPerSelection,
    handleGaze,
    handleSsvepReset,
    handleFlickerToggle,
  } = ssvep

  const decodedTarget = ssvepTargets.find((target) => target.intent === decodedIntent) ?? null
  const statusTone = phase === 'locked' ? 'success' : phase === 'idle' ? (flicker ? 'cyan' : 'idle') : 'active'

  return (
    <div className="mobile-screen ssvep-screen">
      <SectionCard
        kicker="范式 / 被动接受"
        title="SSVEP 稳态视觉诱发范式"
        description="被动接受式脑机接口：无需运动想象，注视闪烁目标即可解码意图。"
        aside={<StatusPill tone={statusTone}>{phaseText}</StatusPill>}
      >
        <div className="ssvep-safety-row utility-surface">
          <div className="ssvep-safety-copy">
            <strong>闪烁刺激 · 8–15 Hz</strong>
            <span>处于光敏性癫痫风险频段，默认关闭</span>
          </div>
          <button
            type="button"
            className={`switch-pill ${flicker ? 'on' : ''}`}
            onClick={handleFlickerToggle}
            role="switch"
            aria-checked={flicker}
            aria-label="闪烁刺激开关"
          >
            <span className="switch-knob" />
            <span className="switch-text">{flicker ? '闪烁中' : '已关闭'}</span>
          </button>
        </div>

        <button type="button" className="inline-link" onClick={() => push('ethics')}>
          为什么默认关闭？看光敏防护的实现 ›
        </button>

        <div className="ssvep-target-grid">
          {ssvepTargets.map((target) => {
            const gazing = phase !== 'idle' && gazeIntent === target.intent
            const face: CSSProperties = flicker
              ? {
                  animationDuration: `${(1 / target.freq).toFixed(4)}s`,
                  animationDelay: `-${(target.phase / (2 * Math.PI * target.freq)).toFixed(4)}s`,
                }
              : {}

            return (
              <button
                key={target.intent}
                type="button"
                className={`ssvep-target tone-${target.tone} ${flicker ? 'flickering' : ''} ${gazing ? 'gazing' : ''} ${decodedIntent === target.intent ? 'decoded' : ''}`}
                onClick={() => handleGaze(target.intent)}
                disabled={!flicker}
                aria-label={`模拟注视 ${target.intent}，刺激频率 ${target.freq} 赫兹`}
              >
                <span className="ssvep-target-face" style={face} aria-hidden="true" />
                <span className="ssvep-target-body">
                  <strong>{target.intent}</strong>
                  <span className="ssvep-target-freq">{target.freq.toFixed(1)} Hz</span>
                  <small>φ = {phaseLabel(target.phase)}</small>
                </span>
              </button>
            )
          })}
        </div>

        {flicker ? (
          <p className="section-helper ssvep-hint">点击目标 = 模拟注视，连续采集 2.0s 后自动解码。</p>
        ) : (
          <div className="ssvep-consent">
            <p className="section-helper ssvep-hint">
              未开启闪烁就无法诱发稳态视觉响应——这正是「被动接受刺激」范式的前提。确认无光敏性癫痫风险后再开启。
            </p>
            <button type="button" className="primary-button" onClick={handleFlickerToggle}>
              开始闪烁刺激
            </button>
          </div>
        )}

        <div className="ssvep-progress">
          <div className="meter-track">
            <span className="meter-fill meter-cyan" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span className="metric-note">
            {phase === 'stimulating'
              ? `刺激累积 ${(progress * ssvepConfig.stimulusSeconds).toFixed(1)}s / ${ssvepConfig.stimulusSeconds.toFixed(1)}s`
              : `单次刺激时长 ${ssvepConfig.stimulusSeconds.toFixed(1)}s`}
          </span>
        </div>

        {decodedTarget ? (
          <div className="ssvep-result-card surface-hero" role="status" aria-live="polite">
            <p className="section-kicker">解码结果</p>
            <h3>
              {decodedTarget.intent} · {decodedTarget.freq.toFixed(1)} Hz
            </h3>
            <p>
              ρ = {rhoMap[decodedTarget.intent].toFixed(3)}，
              {rhoMap[decodedTarget.intent] >= ssvepConfig.rejectThreshold ? '高于拒识阈值，判决通过' : '低于拒识阈值，判为拒识'}；
              对应机械臂动作「{decodedTarget.action}」。
            </p>
            <button type="button" className="ghost-button compact-button" onClick={handleSsvepReset}>
              重置范式演示
            </button>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        kicker="信号"
        title="枕区脑电响应"
        description="注视开始后，枕区通道逐渐出现与刺激同频的稳态正弦成分。"
        aside={<StatusPill tone="cyan">{ssvepConfig.sampleRate} Hz</StatusPill>}
      >
        <div className="channel-legend">
          {ssvepConfig.channels.map((channel, index) => (
            <span key={channel} className={`channel-chip trace-${index}`}>
              {channel}
            </span>
          ))}
        </div>
        <ChartFrame height={132} title="枕区三通道脑电波形" className="occipital-svg">
          {occipitalWaves.map((points, index) => (
            <polyline key={ssvepConfig.channels[index]} points={points} className={`occipital-trace trace-${index}`} fill="none" />
          ))}
        </ChartFrame>
        <StatGrid
          columns={3}
          items={[
            { label: '带通滤波', value: ssvepConfig.bandpass },
            { label: '工频陷波', value: ssvepConfig.notch },
            { label: '刺激来源', value: attendedTarget ? `${attendedTarget.freq.toFixed(1)} Hz` : '未注视' },
          ]}
        />
      </SectionCard>

      <SectionCard
        kicker="解码"
        title="功率谱与 FBCCA 判决"
        description="基频与二次谐波同时出现，是稳态视觉诱发响应的判据。"
        aside={<StatusPill tone={accepted ? 'success' : 'idle'}>{accepted ? '判决通过' : '拒识'}</StatusPill>}
      >
        <ChartFrame height={150} title="枕区脑电功率谱" className="spectrum-svg">
          <path d="M26 132 H302" className="chart-axis" />
          <path d="M26 16 V132" className="chart-axis" />
          {ssvepTargets.map((target) => (
            <line
              key={`tick-${target.intent}`}
              x1={spectrumX(target.freq)}
              x2={spectrumX(target.freq)}
              y1="16"
              y2="132"
              className={`spectrum-tick ${attendedTarget?.intent === target.intent ? 'active' : ''}`}
            />
          ))}
          <polygon points={spectrum.area} className="spectrum-area" />
          <Series points={spectrum.line} tone="cyan" width={2} />
          {spectrum.peak ? (
            <>
              <circle cx={spectrum.peak.x} cy={spectrum.peak.y} r="3.6" className="spectrum-peak" />
              <text x={spectrum.peak.x} y={spectrum.peak.y - 8} className="spectrum-annot">
                f
              </text>
            </>
          ) : null}
          {spectrum.harmonic ? (
            <>
              <circle cx={spectrum.harmonic.x} cy={spectrum.harmonic.y} r="2.8" className="spectrum-peak harmonic" />
              <text x={spectrum.harmonic.x} y={spectrum.harmonic.y - 7} className="spectrum-annot">
                2f
              </text>
            </>
          ) : null}
          {ssvepTargets.map((target) => (
            <text key={`axis-${target.intent}`} x={spectrumX(target.freq)} y="145" className="spectrum-axis-label">
              {target.freq}
            </text>
          ))}
          <text x="302" y="145" className="spectrum-axis-label unit">
            Hz
          </text>
        </ChartFrame>

        <div className="rho-list">
          {ssvepTargets.map((target) => {
            const rho = rhoMap[target.intent]
            const isWinner = decodedIntent === target.intent
            return (
              <div key={`rho-${target.intent}`} className={`rho-row ${isWinner ? 'winner' : ''}`}>
                <span className="rho-name">
                  {target.intent}
                  <small>{target.freq.toFixed(1)} Hz</small>
                </span>
                <span className="rho-track">
                  <span className={`rho-fill tone-${target.tone}`} style={{ width: `${Math.round(rho * 100)}%` }} />
                  <span className="rho-threshold" style={{ left: `${ssvepConfig.rejectThreshold * 100}%` }} />
                </span>
                <strong>{rho.toFixed(3)}</strong>
              </div>
            )
          })}
        </div>
        <span className="metric-note">虚线为拒识阈值 ρ = {ssvepConfig.rejectThreshold.toFixed(2)}，低于它不触发任何动作。</span>
      </SectionCard>

      <SectionCard kicker="性能" title="范式性能指标" description="信息传输率按 Wolpaw 公式由目标数、准确率与单次选择耗时计算。">
        <StatGrid
          items={[
            { label: '离线解码准确率', value: `${(ssvepConfig.offlineAccuracy * 100).toFixed(1)}%` },
            { label: '信息传输率 ITR', value: `${itr.toFixed(1)} bits/min` },
            { label: '单次选择耗时', value: `${secondsPerSelection.toFixed(1)}s` },
            { label: '本次已完成选择', value: `${selections} 次` },
          ]}
        />
      </SectionCard>

      <NavCard
        to="wireless"
        title="这个范式需要什么硬件？"
        desc="枕区 3 通道 + 外挂刺激器；主动范式则是运动区 5 通道、无需刺激器"
        badge="范式的形式体现"
        tone="violet"
      />

      <CollapseCard id="ssvep-pipeline" kicker="流程" title="解码流程" summary={`${ssvepPipeline.length} 个环节`}>
        <div className="plan-list stagger-list">
          {ssvepPipeline.map((item, index) => (
            <div key={item.step} className="pipeline-item utility-surface" style={{ animationDelay: `${index * 70}ms` }}>
              <span className="pipeline-index">0{index + 1}</span>
              <div className="pipeline-copy">
                <strong>{item.step}</strong>
                <p>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapseCard>

      <CollapseCard id="ssvep-compare" kicker="对比" title="主动型 vs 被动型范式" summary="混合 BCI 互补">
        <div className="compare-table">
          <div className="compare-head">
            <span />
            <span className="compare-tag active-tag">主动 · 运动想象</span>
            <span className="compare-tag passive-tag">被动 · SSVEP</span>
          </div>
          {paradigmComparison.map((row) => (
            <div key={row.dimension} className="compare-row utility-surface">
              <span className="compare-dimension">{row.dimension}</span>
              <span className="compare-cell">{row.active}</span>
              <span className="compare-cell passive">{row.passive}</span>
            </div>
          ))}
        </div>
        <button type="button" className="inline-link" onClick={() => push('adaptation')}>
          校准成本：10 试次 vs 冷启动 180 试次 ›
        </button>
      </CollapseCard>

      <CollapseCard id="ssvep-notes" kicker="说明" title="工程与安全说明" summary={`${ssvepNotes.length} 条`}>
        <div className="accordion-list compact-list">
          {ssvepNotes.map((note) => (
            <p key={note} className="ssvep-note utility-surface">
              {note}
            </p>
          ))}
        </div>
      </CollapseCard>
    </div>
  )
}
