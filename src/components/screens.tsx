import { useEffect, type CSSProperties, type ReactNode } from 'react'
import {
  actionTabs,
  algorithmBadges,
  appTabs,
  architectureLayers,
  extensionCards,
  intents,
  kpis,
  opticalCards,
  stageDetails,
  stages,
} from '../data/scenario'
import {
  paradigmComparison,
  ssvepConfig,
  ssvepNotes,
  ssvepPipeline,
  ssvepTargets,
} from '../data/ssvep'
import type { useDemoController } from '../hooks/useDemoController'
import { spectrumX, type useSsvepController } from '../hooks/useSsvepController'
import { ErrorBoundary } from './ErrorBoundary'
import { RobotArm3D, RobotArmFallback } from './RobotArm3D'

type DemoController = ReturnType<typeof useDemoController>
type SsvepController = ReturnType<typeof useSsvepController>
type Tone = 'violet' | 'cyan' | 'green' | 'orange' | 'magenta'
type IconName = 'home' | 'demo' | 'ssvep' | 'report' | 'system' | 'brain' | 'latency' | 'precision' | 'force' | 'check'

type SectionCardProps = {
  title: string
  kicker: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}

type ScreenProps = {
  demo: DemoController
}

type ShellProps = {
  demo: DemoController
  ssvep: SsvepController
}

const heroTrustStats = [
  { label: '识别准确率', value: kpis[0].value, note: '已达比赛阈值' },
  { label: '平均延迟', value: kpis[1].value, note: '动作响应更快' },
  { label: '控制精度', value: kpis[2].value, note: '轨迹误差可控' },
] as const

const tabIcons: Record<(typeof appTabs)[number]['key'], IconName> = {
  home: 'home',
  demo: 'demo',
  ssvep: 'ssvep',
  report: 'report',
  system: 'system',
}

const kpiIcons: IconName[] = ['brain', 'latency', 'precision', 'force']

export function AppShell({ demo, ssvep }: ShellProps) {
  const { activeTab, handleTabChange, screenDirection, sessionStatus } = demo

  return (
    <div className="mobile-shell-wrap">
      <div className="mobile-shell">
        <header className="app-header">
          <StatusBar />
          <div className="app-header-top">
            <p className="eyebrow">Local Demo · EEG / 光电 / 机械臂 / 触觉</p>
            <span className="live-indicator">
              <span className="live-dot" />
              闭环演示在线
            </span>
          </div>
          <h1>脑机协同康复机械臂闭环可视化系统</h1>
          <div className="session-strip">
            <span>当前状态</span>
            <strong>{sessionStatus}</strong>
          </div>
        </header>

        <div className="screen-area">
          <div key={activeTab} className={`screen-stage direction-${screenDirection}`}>
            {activeTab === 'home' && <HomeScreen demo={demo} />}
            {activeTab === 'demo' && <DemoScreen demo={demo} />}
            {activeTab === 'ssvep' && <SsvepScreen demo={demo} ssvep={ssvep} />}
            {activeTab === 'report' && <ReportScreen demo={demo} />}
            {activeTab === 'system' && <SystemScreen demo={demo} />}
          </div>
        </div>

        <nav
          className="bottom-tab-bar"
          aria-label="底部导航"
          style={{ '--tab-count': appTabs.length } as CSSProperties}
        >
          {appTabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                className={`bottom-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span className="tab-icon-chip">
                  <AppIcon name={tabIcons[tab.key]} active={isActive} />
                </span>
                <span>{tab.label}</span>
                <small>{tab.shortLabel}</small>
              </button>
            )
          })}
          <span className="home-indicator" aria-hidden="true" />
        </nav>
      </div>
    </div>
  )
}

export function HomeScreen({ demo }: ScreenProps) {
  const {
    selectedIntent,
    activeSensor,
    profile,
    robotAction,
    currentStage,
    reportState,
    handleStartDemo,
    handleGenerateReport,
    handleReset,
    handleTabChange,
    openCards,
    handleCardToggle,
  } = demo

  return (
    <div className="mobile-screen home-screen">
      <section className="mobile-hero-card surface-hero">
        <span className="panel-tag">七环节康复训练闭环</span>
        <h2>脑机协同康复训练，一屏完成闭环演示。</h2>
        <p>脑电模拟 → 意图识别 → 光电校验 → AI 决策 → 机器人响应 → 触觉反馈 → 训练报告。</p>
        <div className="hero-trust-grid">
          {heroTrustStats.map((item) => (
            <HeroTrustCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </div>
        <div className="hero-actions-grid">
          <button type="button" className="primary-button" onClick={handleStartDemo}>
            开始演示
          </button>
          <button type="button" className="secondary-button" onClick={() => handleTabChange('demo')}>
            进入训练
          </button>
          <button type="button" className="secondary-button" onClick={() => handleTabChange('report')}>
            查看报告
          </button>
          <button type="button" className="ghost-button" onClick={handleReset}>
            重置状态
          </button>
        </div>
      </section>

      <CollapseCard
        kicker="比赛指标"
        title="关键指标"
        summary="4 项全部达标"
        open={Boolean(openCards['home-kpi'])}
        onToggle={() => handleCardToggle('home-kpi')}
      >
        <div className="summary-card-grid two-up">
          {kpis.map((item, index) => (
            <article key={item.label} className="metric-card compact utility-surface">
              <div className="metric-title-row">
                <span className="metric-icon-chip">
                  <AppIcon name={kpiIcons[index]} active />
                </span>
                <div className="metric-title-copy">
                  <p>{item.label}</p>
                  <span>{item.target}</span>
                </div>
              </div>
              <strong>{item.value}</strong>
              <small className="kpi-helper">{item.delta}</small>
            </article>
          ))}
        </div>
      </CollapseCard>

      <CollapseCard
        kicker="当前会话"
        title="闭环状态摘要"
        summary={currentStage ?? '待启动'}
        open={Boolean(openCards['home-status'])}
        onToggle={() => handleCardToggle('home-status')}
      >
        <div className="summary-card-grid two-up">
          <SessionPreviewChip label="当前意图" value={selectedIntent} tone="violet" />
          <SessionPreviewChip label="主校验通道" value={activeSensor} tone="cyan" />
          <SessionPreviewChip label="安全状态" value={profile.safetyCheck} tone="green" />
          <SessionPreviewChip label="当前动作" value={robotAction} tone="orange" />
        </div>
        <div className="compact-loop-panel utility-surface">
          <p className="section-helper">当前闭环阶段</p>
          <strong>{currentStage ?? '待启动'}</strong>
          <div className="compact-loop-tags">
            <Badge tone="violet">EEG</Badge>
            <Badge tone="cyan">ToF</Badge>
            <Badge tone="green">保护策略</Badge>
            <Badge tone={reportState === 'ready' || reportState === 'exported' ? 'green' : reportState === 'generating' ? 'cyan' : 'magenta'}>
              {reportState === 'ready' || reportState === 'exported' ? '报告已就绪' : reportState === 'generating' ? '报告生成中' : '报告待生成'}
            </Badge>
          </div>
          <button type="button" className="ghost-button compact-button" onClick={handleGenerateReport}>
            直接生成报告
          </button>
        </div>
      </CollapseCard>
    </div>
  )
}

export function DemoScreen({ demo }: ScreenProps) {
  const {
    demoMode,
    setDemoMode,
    selectedIntent,
    activeSensor,
    profile,
    actionProfile,
    robotAction,
    activeStageIndex,
    expandedStepIndex,
    progressValue,
    waveformPoints,
    targetTrajectory,
    actualTrajectory,
    decisionReasons,
    reportState,
    handleIntentSelect,
    handleSensorSelect,
    handleActionSelect,
    handleStartDemo,
    handleManualNext,
    handleReset,
    handleStepExpand,
  } = demo

  const nextLabel = activeStageIndex >= stages.length - 1 ? '生成报告' : '下一步'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (expandedStepIndex <= 0) {
        document.querySelector('.screen-area')?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const card = document.getElementById(`step-card-${expandedStepIndex}`)
      card?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 360)

    return () => {
      window.clearTimeout(timer)
    }
  }, [expandedStepIndex])

  return (
    <div className="mobile-screen demo-screen">
      <SectionCard
        kicker="训练 / 闭环演示"
        title="7 步闭环训练演示"
        description="自动模式可完整演示，手动模式适合答辩逐步讲解。"
        aside={<StatusPill tone={reportState === 'generating' ? 'active' : 'cyan'}>进度 {Math.round(progressValue)}%</StatusPill>}
      >
        <div className="mode-toggle-row">
          <button
            type="button"
            className={`mode-pill ${demoMode === 'auto' ? 'selected' : ''}`}
            onClick={() => setDemoMode('auto')}
          >
            自动演示
          </button>
          <button
            type="button"
            className={`mode-pill ${demoMode === 'manual' ? 'selected' : ''}`}
            onClick={() => setDemoMode('manual')}
          >
            手动讲解
          </button>
        </div>
        <div className="hero-actions-grid two-actions">
          <button type="button" className="primary-button" onClick={handleStartDemo}>
            开始训练
          </button>
          <button type="button" className="secondary-button" onClick={demoMode === 'manual' ? handleManualNext : handleReset}>
            {demoMode === 'manual' ? nextLabel : '重置'}
          </button>
        </div>
      </SectionCard>

      <div className="accordion-list">
        {stages.map((stage, index) => {
          const expanded = expandedStepIndex === index
          const done = index < activeStageIndex
          const current = index === activeStageIndex
          const locked = activeStageIndex < 0 ? index > 0 : index > activeStageIndex + 1
          const statusTone = done ? 'green' : current ? 'active' : locked ? 'idle' : 'cyan'
          const statusText = done ? '已完成' : current ? '当前步骤' : locked ? '待解锁' : '待开始'

          return (
            <article
              key={stage}
              id={`step-card-${index}`}
              className={`accordion-card ${expanded ? 'expanded' : ''} ${done ? 'done' : ''} ${locked ? 'locked' : ''}`}
            >
              <button type="button" className="accordion-toggle" onClick={() => handleStepExpand(index)} disabled={locked} aria-expanded={expanded}>
                <div className="accordion-header">
                  <div className="accordion-index">0{index + 1}</div>
                  <div className="accordion-copy">
                    <h3>{stage}</h3>
                    <p>{stageDetails[stage].label}</p>
                  </div>
                  <div className="accordion-header-meta">
                    <StatusPill tone={statusTone}>{statusText}</StatusPill>
                    <span className={`accordion-chevron ${expanded ? 'open' : ''}`}>⌄</span>
                  </div>
                </div>
              </button>

              <div className={`fold-wrap ${expanded ? 'open' : ''}`}>
                <div className="fold-inner accordion-body">
                  <p className="section-helper">{stageDetails[stage].helper}</p>
                  <span className="metric-note">{stageDetails[stage].metric}</span>

                  {index === 0 ? (
                    <div className="waveform-card active-panel-glow utility-surface">
                      <div className="waveform-meta">
                        <div>
                          <span className="section-kicker">模拟脑电输入</span>
                          <strong>前额叶通道活跃</strong>
                        </div>
                        <div>
                          <span className="section-kicker">疲劳指数</span>
                          <strong>{Math.round(profile.fatigue * 100)}%</strong>
                        </div>
                      </div>
                      <svg viewBox="0 0 320 120" className="waveform-svg" role="img" aria-label="EEG 动态波形">
                        <defs>
                          <linearGradient id="wave-gradient-mobile" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="rgba(124,108,240,0.2)" />
                            <stop offset="100%" stopColor="rgba(124,108,240,0.95)" />
                          </linearGradient>
                        </defs>
                        <path d="M0 60 H320" className="wave-baseline" />
                        <polyline fill="none" stroke="url(#wave-gradient-mobile)" strokeWidth="3" points={waveformPoints} />
                      </svg>
                    </div>
                  ) : null}

                  {index === 1 ? (
                    <div className="step-detail-block">
                      <div className="intent-grid compact-intent-grid">
                        {intents.map((intent) => (
                          <button
                            key={intent}
                            type="button"
                            className={`intent-pill ${selectedIntent === intent ? 'selected' : ''}`}
                            onClick={() => handleIntentSelect(intent)}
                          >
                            {intent}
                          </button>
                        ))}
                      </div>
                      <div className="meter-stack">
                        <Meter label="识别置信度" value={profile.confidence * 100} tone="violet" />
                        <Meter label="误操作风险值" value={profile.riskValue * 100} tone="magenta" inverse />
                      </div>
                    </div>
                  ) : null}

                  {index === 2 ? (
                    <div className="step-detail-block">
                      <div className="sensor-tabs">
                        {opticalCards.map((sensor) => (
                          <button
                            key={sensor.key}
                            type="button"
                            className={`sensor-chip ${activeSensor === sensor.key ? 'selected' : ''}`}
                            onClick={() => handleSensorSelect(sensor.key)}
                          >
                            {sensor.key}
                          </button>
                        ))}
                      </div>
                      <div className="sensor-visual compact-visual active-panel-glow utility-surface">
                        <div className={`sensor-overlay sensor-${activeSensor.toLowerCase()}`} />
                        <div className="sensor-outline sensor-outline-head" />
                        <div className="sensor-outline sensor-outline-arm" />
                        <div className="sensor-outline sensor-outline-grip" />
                        <div className="sensor-legend">
                          <span>姿态评分 {profile.poseScore}</span>
                          <span>轨迹偏差 {profile.trajectoryDeviation.toFixed(1)}mm</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {index === 3 ? (
                    <div className="step-detail-block">
                      <div className="summary-card-grid two-up">
                        <MiniStat label="当前意图" value={selectedIntent} />
                        <MiniStat label="姿态评分" value={`${profile.poseScore} / 100`} />
                        <MiniStat label="安全结论" value={profile.safetyCheck} />
                        <MiniStat label="低光评分" value={`${Math.round(profile.lowLightScore * 100)}%`} />
                      </div>
                      <div className="plan-list stagger-list">
                        {profile.aiPlan.map((planItem, planIndex) => (
                          <div key={planItem} className="plan-item utility-surface" style={{ animationDelay: `${planIndex * 70}ms` }}>
                            <span className="plan-dot" />
                            <span>{planItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {index === 4 ? (
                    <div className="step-detail-block">
                      <div className="tab-row small-tabs">
                        {actionTabs.map((action) => (
                          <button
                            key={action}
                            type="button"
                            className={`tab-pill ${robotAction === action ? 'selected' : ''}`}
                            onClick={() => handleActionSelect(action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                      <ErrorBoundary fallback={<RobotArmFallback action={robotAction} />}>
                        <RobotArm3D action={robotAction} running={activeStageIndex === 4} visible={expandedStepIndex === 4} />
                      </ErrorBoundary>
                      <div className="trajectory-legend">
                        <span className="legend-item legend-target">目标轨迹</span>
                        <span className="legend-item legend-actual">实际轨迹</span>
                      </div>
                      <svg viewBox="0 0 320 210" className="trajectory-svg" role="img" aria-label="目标轨迹与实际轨迹对比图">
                        <path d="M24 176 H296" className="chart-axis" />
                        <path d="M24 36 V176" className="chart-axis" />
                        <polyline fill="none" stroke="var(--tone-cyan)" strokeWidth="3" points={targetTrajectory} />
                        <polyline fill="none" stroke="var(--tone-orange)" strokeWidth="3" points={actualTrajectory} opacity={activeStageIndex >= 4 ? 1 : 0.45} />
                      </svg>
                      <div className="summary-card-grid three-up-cards">
                        <MiniStat label="控制误差" value={`${actionProfile.deviation.toFixed(1)}mm`} />
                        <MiniStat label="抓握力度" value={actionProfile.grip} />
                        <MiniStat label="执行状态" value={activeStageIndex > 4 ? '执行完成' : activeStageIndex === 4 ? '执行中' : '待执行'} />
                      </div>
                    </div>
                  ) : null}

                  {index === 5 ? (
                    <div className="step-detail-block">
                      <div className="feedback-column">
                        <FeedbackTile label="压力反馈" value={profile.haptic.pressure * 100} tone="magenta" detail="延迟 48ms · 安全阈值 80%" compact />
                        <FeedbackTile label="振动反馈" value={profile.haptic.vibration * 100} tone="violet" detail="延迟 42ms · 安全阈值 75%" compact />
                        <FeedbackTile label="位置感反馈" value={profile.haptic.proprioception * 100} tone="cyan" detail="延迟 55ms · 安全阈值 78%" compact />
                      </div>
                    </div>
                  ) : null}

                  {index === 6 ? (
                    <div className="step-detail-block">
                      <div className="summary-card-grid two-up">
                        <MiniStat label="训练时长" value={profile.report.duration} />
                        <MiniStat label="完成次数" value={`${profile.report.completedReps} 次`} />
                        <MiniStat label="平均响应延迟" value={profile.report.latency} />
                        <MiniStat label="疲劳指数变化" value={profile.report.fatigueDelta} />
                      </div>
                      <div className="reason-chips">
                        {decisionReasons.map((reason) => (
                          <span key={reason} className="reason-chip utility-surface">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {expanded ? null : (
                <div className="accordion-summary-row">
                  <span>{done ? stageDetails[stage].metric : locked ? '待前一环节完成后解锁' : '点击展开当前步骤详情'}</span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function SsvepScreen({ demo, ssvep }: ShellProps) {
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
  const { openCards, handleCardToggle } = demo

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
        <div className="waveform-card active-panel-glow utility-surface">
          <svg viewBox="0 0 320 132" className="occipital-svg" role="img" aria-label="枕区三通道脑电波形">
            {occipitalWaves.map((points, index) => (
              <polyline key={ssvepConfig.channels[index]} points={points} className={`occipital-trace trace-${index}`} fill="none" />
            ))}
          </svg>
        </div>
        <div className="summary-card-grid three-up-cards">
          <MiniStat label="带通滤波" value={ssvepConfig.bandpass} />
          <MiniStat label="工频陷波" value={ssvepConfig.notch} />
          <MiniStat label="刺激来源" value={attendedTarget ? `${attendedTarget.freq.toFixed(1)} Hz` : '未注视'} />
        </div>
      </SectionCard>

      <SectionCard
        kicker="解码"
        title="功率谱与 FBCCA 判决"
        description="基频与二次谐波同时出现，是稳态视觉诱发响应的判据。"
        aside={<StatusPill tone={accepted ? 'success' : 'idle'}>{accepted ? '判决通过' : '拒识'}</StatusPill>}
      >
        <div className="waveform-card utility-surface">
          <svg viewBox="0 0 320 150" className="spectrum-svg" role="img" aria-label="枕区脑电功率谱">
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
            <polyline points={spectrum.line} className="spectrum-line" fill="none" />
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
          </svg>
        </div>

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
        <span className="metric-note">虚线为拒识阈值 ρ = {ssvepConfig.rejectThreshold.toFixed(2)}</span>
      </SectionCard>

      <SectionCard kicker="性能" title="范式性能指标" description="信息传输率按 Wolpaw 公式由目标数、准确率与单次选择耗时计算。">
        <div className="summary-card-grid two-up">
          <MiniStat label="离线解码准确率" value={`${(ssvepConfig.offlineAccuracy * 100).toFixed(1)}%`} />
          <MiniStat label="信息传输率 ITR" value={`${itr.toFixed(1)} bits/min`} />
          <MiniStat label="单次选择耗时" value={`${secondsPerSelection.toFixed(1)}s`} />
          <MiniStat label="本次已完成选择" value={`${selections} 次`} />
        </div>
      </SectionCard>

      <CollapseCard
        kicker="流程"
        title="解码流程"
        summary={`${ssvepPipeline.length} 个环节`}
        open={Boolean(openCards['ssvep-pipeline'])}
        onToggle={() => handleCardToggle('ssvep-pipeline')}
      >
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

      <CollapseCard
        kicker="对比"
        title="主动型 vs 被动型范式"
        summary="混合 BCI 互补"
        open={Boolean(openCards['ssvep-compare'])}
        onToggle={() => handleCardToggle('ssvep-compare')}
      >
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
      </CollapseCard>

      <CollapseCard
        kicker="说明"
        title="工程与安全说明"
        summary={`${ssvepNotes.length} 条`}
        open={Boolean(openCards['ssvep-notes'])}
        onToggle={() => handleCardToggle('ssvep-notes')}
      >
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

function phaseLabel(phase: number) {
  const quarter = Math.round((phase / Math.PI) * 2)
  return ['0', 'π/2', 'π', '3π/2'][quarter] ?? phase.toFixed(2)
}

export function ReportScreen({ demo }: ScreenProps) {
  const { reportState, selectedIntent, reportMetrics, profile, lastExportNote, handleStartDemo, handleExport } = demo

  const reportStatusText =
    reportState === 'generating'
      ? '生成中'
      : reportState === 'exporting'
        ? '导出中'
        : reportState === 'exported'
          ? '已导出'
          : reportState === 'ready'
            ? '已就绪'
            : '待生成'

  const exportLabel = reportState === 'exporting' ? '导出中...' : reportState === 'exported' ? '已导出' : '导出报告'

  return (
    <div className="mobile-screen report-screen">
      <SectionCard
        kicker="报告 / 记录"
        title="当前训练会话报告"
        description="将本次闭环结果压缩成移动端易读的结果卡和建议卡。"
        aside={<StatusPill tone={reportState === 'generating' || reportState === 'exporting' ? 'active' : reportState === 'idle' ? 'idle' : 'success'}>{reportStatusText}</StatusPill>}
      >
        <div className="report-hero-card surface-hero">
          <p className="section-kicker">最近一次会话</p>
          <h3>{selectedIntent} 意图闭环演示报告</h3>
          <p>{profile.report.recommendation}</p>
          <div className="hero-actions-grid two-actions">
            <button type="button" className="secondary-button" onClick={handleStartDemo}>
              重新演示
            </button>
            <button type="button" className="primary-button" onClick={handleExport} disabled={reportState === 'exporting'}>
              {exportLabel}
            </button>
          </div>
        </div>

        <div className="summary-card-grid two-up">
          {reportMetrics.map((metric) => (
            <MiniStat key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>

        <CollapseCard
          kicker="明细"
          title="核心指标明细"
          summary={`准确率 ${profile.report.accuracy}`}
          open={Boolean(demo.openCards['report-detail'])}
          onToggle={() => demo.handleCardToggle('report-detail')}
        >
          <div className="feedback-column">
            <FeedbackTile label="意图识别准确率" value={88} tone="green" detail={profile.report.accuracy} compact />
            <FeedbackTile label="控制精度误差" value={76} tone="cyan" detail={profile.report.precision} compact />
            <FeedbackTile label="抓握力度误差" value={70} tone="orange" detail={profile.report.gripError} compact />
          </div>
        </CollapseCard>

        {lastExportNote ? (
          <div className="inline-note success-note">
            <span className="success-icon-chip">
              <AppIcon name="check" active />
            </span>
            <span>{lastExportNote}</span>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export function SystemScreen({ demo }: ScreenProps) {
  const { activeSensor, currentStage, sessionStatus, reportState, openCards, handleCardToggle } = demo

  return (
    <div className="mobile-screen system-screen">
      <SectionCard kicker="系统 / 技术" title="技术结构与扩展能力" description="点击下方分组卡片展开对应的技术明细。">
        <div className="system-summary-card utility-surface">
          <div className="summary-card-grid two-up">
            <SessionPreviewChip label="主校验通道" value={activeSensor} tone="cyan" />
            <SessionPreviewChip label="当前阶段" value={currentStage ?? '待启动'} tone="violet" />
            <SessionPreviewChip label="系统状态" value={sessionStatus} tone="green" />
            <SessionPreviewChip
              label="报告状态"
              value={reportState === 'exported' ? '已导出' : reportState === 'ready' ? '已就绪' : reportState === 'generating' ? '生成中' : '待生成'}
              tone="orange"
            />
          </div>
        </div>
      </SectionCard>

      <CollapseCard
        kicker="感知"
        title="光电模组"
        summary={`主通道 ${activeSensor}`}
        open={Boolean(openCards['system-optical'])}
        onToggle={() => handleCardToggle('system-optical')}
      >
        <div className="accordion-list compact-list">
          {opticalCards.map((sensor) => (
            <article key={sensor.key} className={`feature-card ${activeSensor === sensor.key ? 'selected system-selected-card' : ''}`}>
              <strong>{sensor.title}</strong>
              <p>{sensor.detail}</p>
              <span>{sensor.metric}</span>
            </article>
          ))}
        </div>
        <div className="chip-scroll-row">
          {algorithmBadges.map((badge) => (
            <Badge key={badge} tone="cyan">
              {badge}
            </Badge>
          ))}
        </div>
      </CollapseCard>

      <CollapseCard
        kicker="架构"
        title="技术架构"
        summary="感知 → 意图 → 决策 → 反馈"
        open={Boolean(openCards['system-arch'])}
        onToggle={() => handleCardToggle('system-arch')}
      >
        <div className="accordion-list compact-list">
          {architectureLayers.map((layer) => (
            <article key={layer.title} className="architecture-card compact-card utility-surface">
              <h4>{layer.title}</h4>
              <ul>
                {layer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </CollapseCard>

      <CollapseCard
        kicker="扩展"
        title="扩展能力"
        summary="3 项未来能力"
        open={Boolean(openCards['system-ext'])}
        onToggle={() => handleCardToggle('system-ext')}
      >
        <div className="accordion-list compact-list">
          {extensionCards.map((card, index) => (
            <article key={card.title} className="extension-card mobile-extension-card utility-surface">
              <div className="extension-meta-row">
                <span className="extension-number">0{index + 1}</span>
                <span className="extension-chip">未来能力</span>
              </div>
              <strong>{card.title}</strong>
              <p className="extension-text">{card.description}</p>
              <span className="extension-footnote">{card.footnote}</span>
            </article>
          ))}
        </div>
      </CollapseCard>
    </div>
  )
}

type CollapseCardProps = {
  kicker?: string
  title: string
  summary?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

function CollapseCard({ kicker, title, summary, open, onToggle, children }: CollapseCardProps) {
  return (
    <article className={`collapse-card ${open ? 'open' : ''}`}>
      <button type="button" className="collapse-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="collapse-copy">
          {kicker ? <span className="section-kicker">{kicker}</span> : null}
          <span className="collapse-title">{title}</span>
        </span>
        <span className="collapse-meta">
          {summary ? <span className="collapse-summary">{summary}</span> : null}
          <span className={`accordion-chevron ${open ? 'open' : ''}`}>⌄</span>
        </span>
      </button>
      <div className={`fold-wrap ${open ? 'open' : ''}`}>
        <div className="fold-inner collapse-body">{children}</div>
      </div>
    </article>
  )
}

function SectionCard({ title, kicker, description, aside, children, className }: SectionCardProps) {
  return (
    <article className={`panel mobile-panel ${className ?? ''}`.trim()}>
      <div className="panel-header mobile-panel-header">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h3>{title}</h3>
          {description ? <p className="section-helper">{description}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </article>
  )
}

function StatusBar() {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="status-bar" aria-hidden="true">
      <span>{time}</span>
      <span className="status-bar-icons">
        <svg viewBox="0 0 18 12" className="status-glyph">
          <path d="M1.5 10.5h2v-3h-2Zm4.5 0h2v-5H6Zm4.5 0h2v-7h-2Zm4.5 0h2v-9h-2Z" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 16 12" className="status-glyph">
          <path
            d="M8 10.8 5.9 8.6a3 3 0 0 1 4.2 0Zm3.6-3.7a5.4 5.4 0 0 0-7.2 0L2.9 5.6a7.6 7.6 0 0 1 10.2 0Z"
            fill="currentColor"
          />
        </svg>
        <svg viewBox="0 0 22 12" className="status-glyph">
          <rect x="0.8" y="1" width="17" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <rect x="2.8" y="3" width="10.5" height="6" rx="1.6" fill="currentColor" />
          <path d="M19.6 4v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" />
        </svg>
      </span>
    </div>
  )
}

function Badge({ children, tone }: { children: ReactNode; tone: Tone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function StatusPill({ children, tone }: { children: ReactNode; tone: 'idle' | 'active' | 'success' | 'cyan' | 'green' | 'orange' | 'magenta' }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>
}

function Meter({ label, value, tone, inverse }: { label: string; value: number; tone: 'violet' | 'magenta' | 'cyan'; inverse?: boolean }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="meter-item">
      <div className="meter-label-row">
        <span>{label}</span>
        <strong>{safeValue}%</strong>
      </div>
      <div className="meter-track">
        <span className={`meter-fill meter-${tone} ${inverse ? 'inverse' : ''}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat utility-surface">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FeedbackTile({ label, value, tone, detail, compact }: { label: string; value: number; tone: 'magenta' | 'violet' | 'cyan' | 'green' | 'orange'; detail: string; compact?: boolean }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`feedback-tile ${compact ? 'compact' : ''} utility-surface`}>
      <div className="feedback-head">
        <strong>{label}</strong>
        <span>{safeValue}%</span>
      </div>
      <div className="meter-track">
        <span className={`meter-fill meter-${tone}`} style={{ width: `${safeValue}%` }} />
      </div>
      <p>{detail}</p>
    </div>
  )
}

function HeroTrustCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="hero-trust-card utility-surface">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function SessionPreviewChip({ label, value, tone }: { label: string; value: string; tone: 'violet' | 'cyan' | 'green' | 'orange' }) {
  return (
    <div className={`session-preview-chip utility-surface tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AppIcon({ name, active }: { name: IconName; active?: boolean }) {
  const stroke = active ? 'var(--tone-cyan-deep)' : 'var(--text-muted)'
  const fill = active ? 'rgba(79, 182, 230, 0.12)' : 'transparent'

  return (
    <svg viewBox="0 0 20 20" className="app-icon" aria-hidden="true">
      {name === 'home' ? (
        <>
          <path d="M4 9.5 10 4l6 5.5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 8.8V15h7V8.8" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </>
      ) : null}
      {name === 'demo' ? (
        <>
          <rect x="3.5" y="3.5" width="13" height="13" rx="4" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M8 7.5 13 10 8 12.5Z" fill={stroke} stroke={stroke} strokeLinejoin="round" />
        </>
      ) : null}
      {name === 'ssvep' ? (
        <>
          <rect x="2.8" y="3.2" width="7.2" height="7.2" rx="2.2" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M12.5 4.6a4.8 4.8 0 0 1 0 6.4" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15.2 2.8a8.2 8.2 0 0 1 0 10" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M2.8 15.4c1.1 0 1.1 1.8 2.2 1.8s1.1-3.2 2.2-3.2 1.1 3.2 2.2 3.2 1.1-1.8 2.2-1.8"
            fill="none"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
      {name === 'report' ? (
        <>
          <rect x="4" y="3.5" width="12" height="13" rx="3.5" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M7 8.5h6M7 11h6M7 13.5h3.5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {name === 'system' ? (
        <>
          <circle cx="10" cy="10" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M10 3.8v2M10 14.2v2M3.8 10h2M14.2 10h2M5.6 5.6l1.4 1.4M13 13l1.4 1.4M14.4 5.6 13 7M7 13l-1.4 1.4" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === 'brain' ? (
        <path d="M4 11c0-2.3 1.9-4.2 4.2-4.2.9-1.3 2.7-1.8 4.1-1.1 1.4.7 2.3 2.1 2.3 3.7 1 .5 1.7 1.6 1.7 2.9 0 1.8-1.5 3.3-3.3 3.3H7.2C5.4 15.6 4 14.1 4 12.3Z" fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
      ) : null}
      {name === 'latency' ? (
        <>
          <circle cx="10" cy="10" r="6" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M10 6.8v3.6l2.4 1.4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {name === 'precision' ? (
        <>
          <circle cx="10" cy="10" r="5.8" fill="none" stroke={stroke} strokeWidth="1.8" />
          <circle cx="10" cy="10" r="2.4" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        </>
      ) : null}
      {name === 'force' ? (
        <>
          <path d="M5.2 12.8c1.1-2.4 3.2-4.1 5.7-4.7 1.2-.3 2.6-.1 3.8.7" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.8 13.6h6.8c1.2 0 2.2 1 2.2 2.2v.2H8.4c-1.4 0-2.6-1-2.6-2.4Z" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </>
      ) : null}
      {name === 'check' ? (
        <path d="M4.5 10.2 8.4 14l7-8" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  )
}
