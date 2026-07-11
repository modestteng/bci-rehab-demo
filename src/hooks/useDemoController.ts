import { useEffect, useMemo, useRef, useState } from 'react'
import {
  stages,
  intentProfiles,
  actionProfiles,
  applyForceCap,
  forceLimits,
  type DemoMode,
  type Intent,
  type RobotAction,
} from '../data/scenario'
import type { NavApi } from './useNavigation'
import { useTicker } from './useTicker'

export type ReportState = 'idle' | 'generating' | 'ready' | 'exporting' | 'exported'
export type SensorKey = 'RGB' | 'NIR' | 'ToF'

function getInitialStage(): number {
  const param = Number(new URLSearchParams(window.location.search).get('step'))
  return Number.isInteger(param) && param >= 1 && param <= stages.length ? param - 1 : -1
}

/** 导航不再由本 hook 持有，显式作为依赖传入 —— 它现在只管演示编排。 */
export function useDemoController(nav: Pick<NavApi, 'go' | 'activeTab'>) {
  const [demoMode, setDemoMode] = useState<DemoMode>('auto')
  const [selectedIntent, setSelectedIntent] = useState<Intent>('握拳')
  const [activeSensor, setActiveSensor] = useState<SensorKey>('RGB')
  const [robotAction, setRobotAction] = useState<RobotAction>('手部抓握')
  const [activeStageIndex, setActiveStageIndex] = useState<number>(getInitialStage)
  const [expandedStepIndex, setExpandedStepIndex] = useState<number>(0)
  const [isRunning, setIsRunning] = useState(false)
  const [reportState, setReportState] = useState<ReportState>('idle')
  const [lastExportNote, setLastExportNote] = useState('')
  /** 演示用：把力度需求推到硬阈之上，当场触发过力保护 */
  const [forceDemand, setForceDemand] = useState<number | null>(null)
  const timersRef = useRef<number[]>([])
  const uiTimersRef = useRef<number[]>([])
  const selectedIntentRef = useRef<Intent>(selectedIntent)
  const manualActionRef = useRef<RobotAction | null>(null)
  const navRef = useRef(nav)

  useEffect(() => {
    navRef.current = nav
  })

  useEffect(() => {
    selectedIntentRef.current = selectedIntent
  }, [selectedIntent])

  const profile = intentProfiles[selectedIntent]
  const currentStage = activeStageIndex >= 0 ? stages[activeStageIndex] : null
  const progressValue = activeStageIndex >= 0 ? ((activeStageIndex + 1) / stages.length) * 100 : 0

  // EEG 波形只在训练页第 1 步展开时可见；其余时候不必让它每秒触发 5.5 次全树重渲染
  const waveTick = useTicker(180, nav.activeTab === 'demo' && expandedStepIndex === 0)

  /** 过力保护：真实的钳制，不是一句文案 */
  const force = applyForceCap(forceDemand ?? profile.haptic.pressure)

  useEffect(() => {
    return () => {
      clearTimers(timersRef.current)
      clearTimers(uiTimersRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isRunning || demoMode !== 'auto') {
      return
    }

    const stepSchedule = stages.map((_, index) => index * 1350)

    clearTimers(timersRef.current)
    timersRef.current = stepSchedule.map((delay, index) =>
      window.setTimeout(() => {
        advanceToStage(index)
      }, delay),
    )

    return () => {
      clearTimers(timersRef.current)
    }
  }, [isRunning, demoMode])

  useEffect(() => {
    setRobotAction(intentProfiles[selectedIntent].robotAction)
  }, [selectedIntent])

  useEffect(() => {
    if (activeStageIndex >= 0) {
      setExpandedStepIndex(activeStageIndex)
    } else {
      setExpandedStepIndex(0)
    }
  }, [activeStageIndex])

  const waveformPoints = useMemo(() => createWaveformPoints(selectedIntent, waveTick), [selectedIntent, waveTick])
  const actionProfile = actionProfiles[robotAction]
  const targetTrajectory = useMemo(() => toTrajectoryPoints(actionProfiles[robotAction].target), [robotAction])
  const actualTrajectory = useMemo(
    () =>
      toTrajectoryPoints(
        applyTrajectoryOffset(
          actionProfiles[robotAction].target,
          activeStageIndex >= 4 ? actionProfiles[robotAction].actualOffset : 12,
        ),
      ),
    [activeStageIndex, robotAction],
  )

  const decisionReasons = [
    `意图结果：${selectedIntent}`,
    `姿态评分：${profile.poseScore} / 100`,
    `疲劳指数：${profile.fatigue.toFixed(2)}`,
    `误操作风险：${profile.risk}`,
  ]

  const sessionStatus =
    reportState !== 'idle'
      ? SESSION_STATUS[reportState]
      : isRunning
        ? '闭环演示进行中'
        : currentStage
          ? `${currentStage} 已就绪`
          : '等待开始训练'

  const reportMetrics = [
    { label: '训练时长', value: profile.report.duration },
    { label: '完成次数', value: `${profile.report.completedReps} 次` },
    { label: '平均响应延迟', value: profile.report.latency },
    { label: '疲劳指数变化', value: profile.report.fatigueDelta },
  ]

  function handleStartDemo() {
    clearTimers(timersRef.current)
    clearTimers(uiTimersRef.current)
    manualActionRef.current = null
    setLastExportNote('')
    setActiveSensor('RGB')
    setRobotAction(intentProfiles[selectedIntent].robotAction)
    setReportState('idle')
    setIsRunning(demoMode === 'auto')
    setActiveStageIndex(0)
    setExpandedStepIndex(0)
    navRef.current.go('demo')

    if (demoMode === 'manual') {
      advanceToStage(0)
    }
  }

  function handleReset() {
    clearTimers(timersRef.current)
    clearTimers(uiTimersRef.current)
    manualActionRef.current = null
    setIsRunning(false)
    setActiveStageIndex(-1)
    setExpandedStepIndex(0)
    setSelectedIntent('握拳')
    setActiveSensor('RGB')
    setRobotAction('手部抓握')
    setReportState('idle')
    setLastExportNote('')
  }

  function handleIntentSelect(intent: Intent) {
    manualActionRef.current = null
    setSelectedIntent(intent)
    setActiveStageIndex((value) => (value < 1 ? 1 : value))
    setReportState('idle')
    setLastExportNote('')
  }

  function handleSensorSelect(sensor: SensorKey) {
    setActiveSensor(sensor)
    setActiveStageIndex((value) => (value < 2 ? 2 : value))
  }

  function handleActionSelect(action: RobotAction) {
    manualActionRef.current = action
    setRobotAction(action)
    setActiveStageIndex((value) => (value < 4 ? 4 : value))
    setReportState('idle')
    setLastExportNote('')
  }

  function handleGenerateReport() {
    clearTimers(uiTimersRef.current)
    setActiveStageIndex(stages.length - 1)
    setExpandedStepIndex(stages.length - 1)
    setReportState('generating')
    setIsRunning(false)
    navRef.current.go('report')

    uiTimersRef.current.push(
      window.setTimeout(() => {
        setReportState('ready')
      }, 650),
    )
  }

  function handleExport() {
    clearTimers(uiTimersRef.current)
    setLastExportNote('')
    setReportState('exporting')

    uiTimersRef.current.push(
      window.setTimeout(() => {
        setReportState('exported')
        setLastExportNote('已保存为本地演示快照（模拟导出）')
      }, 520),
    )
  }

  function handleManualNext() {
    if (demoMode !== 'manual') {
      return
    }

    if (activeStageIndex < 0) {
      advanceToStage(0)
      return
    }

    if (activeStageIndex < stages.length - 1) {
      advanceToStage(activeStageIndex + 1)
      return
    }

    handleGenerateReport()
  }

  function handleStepExpand(index: number) {
    const maxReachable = activeStageIndex < 0 ? 0 : Math.min(stages.length - 1, activeStageIndex + 1)
    if (index > maxReachable) {
      return
    }
    setExpandedStepIndex(index)
  }

  function advanceToStage(index: number) {
    setActiveStageIndex(index)

    if (index === 1) {
      setSelectedIntent((current) => current || '握拳')
    }

    if (index === 2) {
      setActiveSensor('ToF')
    }

    if (index === 4) {
      setRobotAction(manualActionRef.current ?? intentProfiles[selectedIntentRef.current].robotAction)
    }

    if (index === stages.length - 1) {
      setIsRunning(false)
      setReportState('generating')
      clearTimers(uiTimersRef.current)
      uiTimersRef.current.push(
        window.setTimeout(() => {
          setReportState('ready')
          navRef.current.go('report')
        }, 700),
      )
    }
  }

  function handleForceSurge() {
    // 演示按钮：把力度需求推到硬阈之上，让过力保护当场触发
    setForceDemand(0.9)
    setActiveStageIndex((value) => (value < 5 ? 5 : value))
  }

  function handleForceRelease() {
    setForceDemand(null)
  }

  return {
    demoMode,
    setDemoMode,
    selectedIntent,
    activeSensor,
    robotAction,
    activeStageIndex,
    expandedStepIndex,
    isRunning,
    reportState,
    waveTick,
    lastExportNote,
    profile,
    actionProfile,
    currentStage,
    progressValue,
    waveformPoints,
    targetTrajectory,
    actualTrajectory,
    decisionReasons,
    sessionStatus,
    reportMetrics,
    force,
    forceLimits,
    forceSurged: forceDemand !== null,
    handleForceSurge,
    handleForceRelease,
    handleStartDemo,
    handleReset,
    handleIntentSelect,
    handleSensorSelect,
    handleActionSelect,
    handleGenerateReport,
    handleExport,
    handleManualNext,
    handleStepExpand,
  }
}

const SESSION_STATUS: Record<ReportState, string> = {
  idle: '等待开始训练',
  generating: '训练报告生成中',
  ready: '训练报告已生成',
  exporting: '报告导出中',
  exported: '报告已导出（模拟）',
}

export function createWaveformPoints(intent: Intent, tick: number) {
  const config: Record<Intent, { amplitude: number; frequency: number; bias: number }> = {
    抬手: { amplitude: 16, frequency: 0.58, bias: -4 },
    伸肘: { amplitude: 18, frequency: 0.62, bias: -1 },
    握拳: { amplitude: 22, frequency: 0.78, bias: 0 },
    放松: { amplitude: 10, frequency: 0.42, bias: 5 },
  }

  const { amplitude, frequency, bias } = config[intent]

  return Array.from({ length: 36 }, (_, index) => {
    const x = index * 9
    const dynamic = Math.sin((index + tick) * frequency) * amplitude
    const detail = Math.cos((index + tick * 0.7) * 0.38) * 6
    const y = 60 - dynamic - detail + bias
    return `${x},${y.toFixed(2)}`
  }).join(' ')
}

export function toTrajectoryPoints(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(' ')
}

export function applyTrajectoryOffset(points: Array<[number, number]>, offset: number) {
  return points.map(([x, y], index) => {
    if (index === 0) {
      return [x, y] as [number, number]
    }
    const sign = index % 2 === 1 ? -1 : 1
    return [x, y + sign * offset] as [number, number]
  })
}

function clearTimers(timers: number[]) {
  timers.forEach((timer) => window.clearTimeout(timer))
  timers.length = 0
}
