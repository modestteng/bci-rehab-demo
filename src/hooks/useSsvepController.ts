import { useEffect, useMemo, useRef, useState } from 'react'
import type { Intent } from '../data/scenario'
import {
  SPECTRUM_END,
  SPECTRUM_START,
  spectrumPower,
  ssvepConfig,
  ssvepPeakRho,
  ssvepTargets,
  type SsvepTarget,
} from '../data/ssvep'

export type SsvepPhase = 'idle' | 'stimulating' | 'decoding' | 'locked'

const SPECTRUM_BINS = 121
const WAVE_SAMPLES = 160
const WAVE_WIDTH = 320
const WAVE_BASELINES = [30, 66, 102]
const CHANNEL_GAIN = [0.85, 1, 0.9]

export function spectrumX(freq: number) {
  return 26 + ((freq - SPECTRUM_START) / (SPECTRUM_END - SPECTRUM_START)) * 276
}

export function spectrumY(power: number) {
  // 上限留出 1.35 的余量，避免基频峰顶到达坐标区上沿、压住标注文字
  return 132 - Math.min(power, 1.35) * (116 / 1.35)
}

export function buildSpectrum(attended: SsvepTarget | null, scale: number, tick: number) {
  const coords: string[] = []
  for (let index = 0; index < SPECTRUM_BINS; index += 1) {
    const freq = SPECTRUM_START + (index * (SPECTRUM_END - SPECTRUM_START)) / (SPECTRUM_BINS - 1)
    const power = spectrumPower(freq, attended, scale, tick)
    coords.push(`${spectrumX(freq).toFixed(1)},${spectrumY(power).toFixed(1)}`)
  }

  const line = coords.join(' ')
  const area = `${line} ${spectrumX(SPECTRUM_END).toFixed(1)},132 ${spectrumX(SPECTRUM_START).toFixed(1)},132`

  const visible = Boolean(attended) && scale > 0.18
  const peak =
    attended && visible
      ? { x: spectrumX(attended.freq), y: spectrumY(spectrumPower(attended.freq, attended, scale, tick)) }
      : null
  const harmonic =
    attended && visible && attended.freq * 2 <= SPECTRUM_END
      ? {
          x: spectrumX(attended.freq * 2),
          y: spectrumY(spectrumPower(attended.freq * 2, attended, scale, tick)),
        }
      : null

  return { line, area, peak, harmonic }
}

export function buildOccipitalWave(attended: SsvepTarget | null, scale: number, tick: number, channel: number) {
  const baseline = WAVE_BASELINES[channel]
  const gain = CHANNEL_GAIN[channel]
  const drift = tick * 0.28
  const coords: string[] = []

  for (let index = 0; index <= WAVE_SAMPLES; index += 1) {
    const seconds = index / WAVE_SAMPLES
    const x = (index / WAVE_SAMPLES) * WAVE_WIDTH
    const noise =
      Math.sin(seconds * 61.7 + channel * 3.1 + tick * 0.9) * 2 +
      Math.cos(seconds * 97.3 - tick * 0.6 + channel) * 1.3

    let y = baseline - noise

    if (attended && scale > 0) {
      y -= 11 * gain * scale * Math.sin(2 * Math.PI * attended.freq * seconds + attended.phase + drift)
      y -= 3.5 * gain * scale * Math.sin(4 * Math.PI * attended.freq * seconds + drift)
    }

    coords.push(`${x.toFixed(1)},${y.toFixed(2)}`)
  }

  return coords.join(' ')
}

export function buildRhoMap(attended: SsvepTarget | null, scale: number, tick: number) {
  const result = {} as Record<Intent, number>

  for (const target of ssvepTargets) {
    if (!attended || scale <= 0) {
      result[target.intent] = 0.08 + 0.02 * Math.abs(Math.sin(target.freq + tick * 0.2))
      continue
    }

    if (target.intent === attended.intent) {
      result[target.intent] = 0.12 + (ssvepPeakRho[target.intent] - 0.12) * scale
      continue
    }

    // 频率越接近，混淆越大
    const confusion = 0.34 - Math.min(0.14, Math.abs(attended.freq - target.freq) * 0.02)
    const jitter = 0.008 * Math.sin(tick * 0.4 + target.freq)
    result[target.intent] = Math.max(0.02, confusion * (0.55 + 0.45 * scale) + jitter)
  }

  return result
}

/** Wolpaw 信息传输率，单位 bits/min */
export function wolpawItr(targets: number, accuracy: number, secondsPerSelection: number) {
  if (accuracy >= 1) {
    return (Math.log2(targets) * 60) / secondsPerSelection
  }
  if (accuracy <= 1 / targets) {
    return 0
  }

  const bits =
    Math.log2(targets) +
    accuracy * Math.log2(accuracy) +
    (1 - accuracy) * Math.log2((1 - accuracy) / (targets - 1))

  return (bits * 60) / secondsPerSelection
}

/** 深链 ?gaze=握拳 用于答辩时直达解码结果 */
function getInitialGaze(): Intent | null {
  const param = new URLSearchParams(window.location.search).get('gaze')
  return ssvepTargets.find((target) => target.intent === param)?.intent ?? null
}

export function useSsvepController(active: boolean) {
  // 8–15Hz 闪烁位于光敏性癫痫风险频段，默认关闭，须用户显式开启（?gaze= 深链视为已确认）
  const [flicker, setFlicker] = useState(() => Boolean(getInitialGaze()))
  const [phase, setPhase] = useState<SsvepPhase>(() => (getInitialGaze() ? 'stimulating' : 'idle'))
  const [gazeIntent, setGazeIntent] = useState<Intent | null>(getInitialGaze)
  const [decodedIntent, setDecodedIntent] = useState<Intent | null>(null)
  const [progress, setProgress] = useState(0)
  const [selections, setSelections] = useState(0)
  const [runId, setRunId] = useState(0)
  const [tick, setTick] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (!active) {
      return
    }
    const interval = window.setInterval(() => {
      setTick((value) => value + 1)
    }, 120)
    return () => window.clearInterval(interval)
  }, [active])

  useEffect(() => {
    if (phase !== 'stimulating') {
      return
    }

    startRef.current = performance.now()
    const interval = window.setInterval(() => {
      const elapsed = (performance.now() - startRef.current) / (ssvepConfig.stimulusSeconds * 1000)
      if (elapsed >= 1) {
        setProgress(1)
        setPhase('decoding')
        return
      }
      setProgress(elapsed)
    }, 40)

    return () => window.clearInterval(interval)
  }, [phase, runId])

  useEffect(() => {
    if (phase !== 'decoding') {
      return
    }

    const timer = window.setTimeout(() => {
      setDecodedIntent(gazeIntent)
      setSelections((value) => value + 1)
      setPhase('locked')
    }, 480)

    return () => window.clearTimeout(timer)
  }, [phase, gazeIntent])

  const attendedTarget = useMemo(
    () => (phase === 'idle' ? null : (ssvepTargets.find((item) => item.intent === gazeIntent) ?? null)),
    [phase, gazeIntent],
  )

  const responseScale = phase === 'idle' ? 0 : phase === 'stimulating' ? progress : 1

  const spectrum = useMemo(
    () => buildSpectrum(attendedTarget, responseScale, tick),
    [attendedTarget, responseScale, tick],
  )
  const occipitalWaves = useMemo(
    () => ssvepConfig.channels.map((_, index) => buildOccipitalWave(attendedTarget, responseScale, tick, index)),
    [attendedTarget, responseScale, tick],
  )
  const rhoMap = useMemo(() => buildRhoMap(attendedTarget, responseScale, tick), [attendedTarget, responseScale, tick])

  const secondsPerSelection = ssvepConfig.stimulusSeconds + ssvepConfig.gapSeconds
  const itr = wolpawItr(ssvepTargets.length, ssvepConfig.offlineAccuracy, secondsPerSelection)

  const winnerIntent = useMemo(() => {
    let best: Intent = ssvepTargets[0].intent
    for (const target of ssvepTargets) {
      if (rhoMap[target.intent] > rhoMap[best]) {
        best = target.intent
      }
    }
    return best
  }, [rhoMap])

  const winnerRho = rhoMap[winnerIntent]
  const accepted = winnerRho >= ssvepConfig.rejectThreshold

  const phaseText = !flicker
    ? '刺激未开启'
    : phase === 'stimulating'
      ? `采集中 ${Math.round(progress * 100)}%`
      : phase === 'decoding'
        ? '解码中'
        : phase === 'locked'
          ? `已锁定 · ${decodedIntent ?? ''}`
          : '等待注视'

  function handleGaze(intent: Intent) {
    if (!flicker) {
      return
    }
    setDecodedIntent(null)
    setGazeIntent(intent)
    setProgress(0)
    setRunId((value) => value + 1)
    setPhase('stimulating')
  }

  function handleSsvepReset() {
    setPhase('idle')
    setGazeIntent(null)
    setDecodedIntent(null)
    setProgress(0)
    setSelections(0)
  }

  function handleFlickerToggle() {
    const next = !flicker
    setFlicker(next)
    if (!next) {
      setPhase('idle')
      setGazeIntent(null)
      setDecodedIntent(null)
      setProgress(0)
    }
  }

  return {
    flicker,
    phase,
    phaseText,
    gazeIntent,
    decodedIntent,
    attendedTarget,
    progress,
    responseScale,
    selections,
    spectrum,
    occipitalWaves,
    rhoMap,
    winnerIntent,
    winnerRho,
    accepted,
    itr,
    secondsPerSelection,
    handleGaze,
    handleSsvepReset,
    handleFlickerToggle,
  }
}
