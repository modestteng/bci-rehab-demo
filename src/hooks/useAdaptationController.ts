import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CALIBRATION_TRIALS,
  adaptCurves,
  adaptationAccuracy,
  buildCohort,
  initAdaptState,
  personas,
  stepAdaptation,
  summarize,
  weightsFrom,
  type AdaptState,
  type PersonaKey,
} from '../data/adaptation'

export type AdaptPhase = 'idle' | 'priorInit' | 'calibrating' | 'converged'

const SEED = 20260711
const STEP_MS = 650

export function useAdaptationController(active: boolean) {
  const [phase, setPhase] = useState<AdaptPhase>('idle')
  const [personaKey, setPersonaKey] = useState<PersonaKey>('typical')
  const [state, setState] = useState<AdaptState>(initAdaptState)
  const [showCold, setShowCold] = useState(false)
  const timers = useRef<number[]>([])

  const persona = personas.find((p) => p.key === personaKey) ?? personas[0]

  // 队列是确定性的，只算一次
  const cohort = useMemo(() => buildCohort(), [])
  const stats = useMemo(() => summarize(cohort), [cohort])

  function clear() {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => clear, [])

  // 离开页面时停掉推进，避免后台自跑
  useEffect(() => {
    if (!active) {
      clear()
    }
  }, [active])

  // 群体先验载入 → 自动进入校准
  useEffect(() => {
    if (phase !== 'priorInit') {
      return
    }
    const id = window.setTimeout(() => setPhase('calibrating'), 700)
    timers.current.push(id)
    return () => window.clearTimeout(id)
  }, [phase])

  // 逐次校准
  useEffect(() => {
    if (phase !== 'calibrating' || !active) {
      return
    }
    if (state.k >= CALIBRATION_TRIALS) {
      setPhase('converged')
      return
    }
    const id = window.setTimeout(() => {
      setState((prev) => stepAdaptation(prev, persona, SEED))
    }, STEP_MS)
    timers.current.push(id)
    return () => window.clearTimeout(id)
  }, [phase, state.k, persona, active])

  const weights = useMemo(() => weightsFrom(state), [state])

  const warmAccuracy = adaptationAccuracy(adaptCurves.warm, state.k)
  const coldAccuracy = adaptationAccuracy(adaptCurves.cold, state.k)

  const phaseText =
    phase === 'idle'
      ? '等待新用户接入'
      : phase === 'priorInit'
        ? '记忆功能启动 · 载入群体先验'
        : phase === 'calibrating'
          ? `个体校准中 ${state.k} / ${CALIBRATION_TRIALS}`
          : '已收敛 · 达成首页 KPI'

  function handleEnroll(next: PersonaKey) {
    clear()
    setPersonaKey(next)
    setState(initAdaptState())
    setPhase('priorInit')
  }

  function handleStep() {
    if (state.k >= CALIBRATION_TRIALS) {
      return
    }
    setState((prev) => stepAdaptation(prev, persona, SEED))
  }

  function handleReset() {
    clear()
    setState(initAdaptState())
    setPhase('idle')
  }

  return {
    phase,
    phaseText,
    persona,
    personaKey,
    state,
    weights,
    cohort,
    stats,
    warmAccuracy,
    coldAccuracy,
    showCold,
    setShowCold,
    handleEnroll,
    handleStep,
    handleReset,
  }
}
