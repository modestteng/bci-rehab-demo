import type { ComponentType } from 'react'
import {
  actionTabs,
  intents,
  opticalCards,
  type Stage,
} from '../../data/scenario'
import { LATENCY_TOTAL, SAFETY_LOOP_MS } from '../../data/wireless'
import { ChartFrame, Series } from '../../components/charts/ChartFrame'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { RobotArm3D, RobotArmFallback } from '../../components/RobotArm3D'
import { NavCard } from '../../components/ui/Card'
import { OptionGroup } from '../../components/ui/Pill'
import { FeedbackTile, Meter, StatGrid } from '../../components/ui/Stat'
import { useDemo } from './DemoContext'

export type StagePanelDef = {
  Panel: ComponentType
  /**
   * 折叠后是否保持挂载。
   * 只有「机器人动作响应」为 true —— RobotArm3D 是 []-deps 的常驻 three.js 场景，
   * 反复卸载重挂会不断新建 WebGL context（浏览器上限约 16 个），
   * 反复展开折叠会导致 3D 场景失效变黑。
   */
  keepMounted?: boolean
}

function EegPanel() {
  const { profile, waveformPoints } = useDemo()
  return (
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
      <ChartFrame height={120} title="EEG 动态波形" framed={false}>
        <path d="M0 60 H320" className="wave-baseline" />
        <Series points={waveformPoints} tone="violet" />
      </ChartFrame>
    </div>
  )
}

function IntentPanel() {
  const { selectedIntent, handleIntentSelect, profile } = useDemo()
  return (
    <div className="step-detail-block">
      <OptionGroup label="运动意图" options={intents} value={selectedIntent} onChange={handleIntentSelect} />
      <div className="meter-stack">
        <Meter label="识别置信度" value={profile.confidence * 100} tone="violet" />
        <Meter label="误操作风险值" value={profile.riskValue * 100} tone="magenta" inverse />
      </div>
    </div>
  )
}

function OpticalPanel() {
  const { activeSensor, handleSensorSelect, profile } = useDemo()
  return (
    <div className="step-detail-block">
      <OptionGroup
        label="光电校验通道"
        options={opticalCards.map((sensor) => sensor.key)}
        value={activeSensor}
        onChange={handleSensorSelect}
        columns={3}
      />
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
  )
}

function DecisionPanel() {
  const { selectedIntent, profile } = useDemo()
  return (
    <div className="step-detail-block">
      <StatGrid
        items={[
          { label: '当前意图', value: selectedIntent },
          { label: '姿态评分', value: `${profile.poseScore} / 100` },
          { label: '安全结论', value: profile.safetyCheck },
          { label: '低光评分', value: `${Math.round(profile.lowLightScore * 100)}%` },
        ]}
      />
      <div className="plan-list stagger-list">
        {profile.aiPlan.map((item, index) => (
          <div key={item} className="plan-item utility-surface" style={{ animationDelay: `${index * 70}ms` }}>
            <span className="plan-dot" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RobotPanel() {
  const {
    robotAction,
    handleActionSelect,
    activeStageIndex,
    expandedStepIndex,
    actionProfile,
    targetTrajectory,
    actualTrajectory,
  } = useDemo()

  return (
    <div className="step-detail-block">
      <OptionGroup label="机械臂训练动作" options={actionTabs} value={robotAction} onChange={handleActionSelect} />

      <ErrorBoundary fallback={<RobotArmFallback action={robotAction} />}>
        <RobotArm3D action={robotAction} running={activeStageIndex === 4} visible={expandedStepIndex === 4} />
      </ErrorBoundary>

      <div className="trajectory-legend">
        <span className="legend-item legend-target">目标轨迹</span>
        <span className="legend-item legend-actual">实际轨迹</span>
      </div>
      <ChartFrame height={210} title="目标轨迹与实际轨迹对比" framed={false}>
        <path d="M24 176 H296" className="chart-axis" />
        <path d="M24 36 V176" className="chart-axis" />
        <Series points={targetTrajectory} tone="cyan" />
        <Series points={actualTrajectory} tone="orange" opacity={activeStageIndex >= 4 ? 1 : 0.45} />
      </ChartFrame>

      <StatGrid
        columns={3}
        items={[
          { label: '控制误差', value: `${actionProfile.deviation.toFixed(1)}mm` },
          { label: '抓握力度', value: actionProfile.grip },
          {
            label: '执行状态',
            value: activeStageIndex > 4 ? '执行完成' : activeStageIndex === 4 ? '执行中' : '待执行',
          },
        ]}
      />
    </div>
  )
}

function HapticPanel() {
  const { profile, force, forceLimits, forceSurged, handleForceSurge, handleForceRelease } = useDemo()
  const hardCapPct = forceLimits.hardCap * 100

  return (
    <div className="step-detail-block">
      <div className="feedback-column">
        <FeedbackTile
          label="压力反馈"
          value={force.applied * 100}
          tone="magenta"
          threshold={hardCapPct}
          clipped={force.clipped}
          detail={
            force.clipped
              ? `需求 ${Math.round(force.demand * 100)}% 超过硬阈 ${Math.round(hardCapPct)}%，已削减至 ${Math.round(force.applied * 100)}%`
              : `延迟 48ms · 硬阈 ${Math.round(hardCapPct)}% · 余量 ${Math.round(force.margin * 100)}%`
          }
        />
        <FeedbackTile label="振动反馈" value={profile.haptic.vibration * 100} tone="violet" detail="延迟 42ms · 安全阈值 75%" />
        <FeedbackTile label="位置感反馈" value={profile.haptic.proprioception * 100} tone="cyan" detail="延迟 55ms · 安全阈值 78%" />
      </div>

      {force.clipped ? (
        <div className="force-banner" role="status" aria-live="polite">
          <strong>过力保护已触发</strong>
          <span>
            力度需求 {Math.round(force.demand * 100)}% 超过硬阈值，本地 MCU 于 {SAFETY_LOOP_MS}ms 内将其削减至{' '}
            {Math.round(force.applied * 100)}%。该安全环路不经无线链路。
          </span>
        </div>
      ) : null}

      <button type="button" className="secondary-button" onClick={forceSurged ? handleForceRelease : handleForceSurge}>
        {forceSurged ? '恢复正常力度' : '施加超阈力度（触发过力保护）'}
      </button>

      <span className="metric-note">
        端到端时延 {LATENCY_TOTAL}ms；安全环路独立运行于本地，不依赖存在丢包可能的无线链路。
      </span>
    </div>
  )
}

function ReportSummaryPanel() {
  const { profile, decisionReasons } = useDemo()
  return (
    <div className="step-detail-block">
      <StatGrid
        items={[
          { label: '训练时长', value: profile.report.duration },
          { label: '完成次数', value: `${profile.report.completedReps} 次` },
          { label: '平均响应延迟', value: profile.report.latency },
          { label: '疲劳指数变化', value: profile.report.fatigueDelta },
        ]}
      />
      <div className="reason-chips">
        {decisionReasons.map((reason) => (
          <span key={reason} className="reason-chip utility-surface">
            {reason}
          </span>
        ))}
      </div>
      <NavCard to="adaptation" title="本次反馈已更新个体权重" desc="查看其向 88.0% 收敛的过程" badge="σ 9.2 → 3.1" tone="green" />
    </div>
  )
}

/**
 * 按 Stage 名派发，不再按 index。
 * Record<Stage, …> 让 TS 在 stages 数组增删改时强制报错 ——
 * 此前调换 stages 顺序会静默地把 EEG 波形挂到「触觉反馈」上。
 */
export const stagePanels: Record<Stage, StagePanelDef> = {
  脑电信号模拟: { Panel: EegPanel },
  运动意图识别: { Panel: IntentPanel },
  光电感知校验: { Panel: OpticalPanel },
  AI康复决策: { Panel: DecisionPanel },
  机器人动作响应: { Panel: RobotPanel, keepMounted: true },
  触觉反馈: { Panel: HapticPanel },
  训练报告生成: { Panel: ReportSummaryPanel },
}

export type StepStatus = 'done' | 'current' | 'next' | 'locked'

export function stageStatus(index: number, activeIndex: number): StepStatus {
  if (activeIndex < 0) {
    return index === 0 ? 'next' : 'locked'
  }
  if (index < activeIndex) {
    return 'done'
  }
  if (index === activeIndex) {
    return 'current'
  }
  return index === activeIndex + 1 ? 'next' : 'locked'
}

export const STATUS_TEXT: Record<StepStatus, string> = {
  done: '已完成',
  current: '当前步骤',
  next: '待开始',
  locked: '待解锁',
}

export const STATUS_TONE: Record<StepStatus, 'green' | 'active' | 'cyan' | 'idle'> = {
  done: 'green',
  current: 'active',
  next: 'cyan',
  locked: 'idle',
}
