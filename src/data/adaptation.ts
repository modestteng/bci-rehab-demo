import type { Tone } from '../design/tokens'

/**
 * 个体支持性 —— 群体先验 → 个体自适应 → 跨被试方差收敛。
 *
 * 数学骨架是收缩估计（shrinkage / 经验贝叶斯）：
 *   群体先验 = 伪计数；个体反馈 = 真计数；收缩系数 w(k) = k/(k+λ)。
 * 「记忆功能启动、给予较大权重」里的「记忆有多重」就是先验强度 λ。
 * 同一个 w(k) 同时驱动准确率收敛曲线与安抚策略权重迁移 —— 这是它们本是一个系统的原因。
 */

export const COHORT_SIZE = 24
/** 比赛门槛，与首页 KPI「意图识别准确率 ≥85%」同源 */
export const ACCURACY_THRESHOLD = 85

export type ConditionKey = 'generic' | 'prior' | 'adaptive'

export type Condition = {
  key: ConditionKey
  label: string
  short: string
  tone: Tone
  /** 目标均值/标准差。样本由 buildCohort 生成，其 mean/stdev 恒等于这两个值。 */
  mean: number
  std: number
  note: string
}

export const conditions: readonly Condition[] = [
  {
    key: 'generic',
    label: '通用模型',
    short: '通用',
    tone: 'magenta',
    mean: 78.0,
    std: 9.2,
    note: '不进行任何个体化，将跨被试通用解码器直接应用于新用户。',
  },
  {
    key: 'prior',
    label: '群体先验迁移',
    short: '先验',
    tone: 'orange',
    mean: 84.0,
    std: 5.6,
    note: '以 24 名历史被试的群体先验初始化新用户参数，即需求书所述的「记忆功能」。',
  },
  {
    key: 'adaptive',
    label: '个体自适应校准',
    short: '自适应',
    tone: 'green',
    mean: 88.0,
    std: 3.1,
    note: '在群体先验之上，用该个体前 10 次训练反馈在线微调。',
  },
] as const

export type CohortSubject = {
  id: string
  /** 标准化能力分：跨 24 人严格 mean=0、sd=1 */
  z: number
  /** 点图的确定性横向抖动 [-1,1] */
  jitter: number
  accuracy: Record<ConditionKey, number>
}

/** 确定性 PRNG。全模块禁用 Math.random —— 每次演示的点云必须完全一致。 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 标准正态分位数（Acklam 近似），用于 Blom 分位点 */
export function invNorm(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425

  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** 统计量：全模块唯一实现。UI 只准调它，不准硬编码 σ。 */
export function mean(xs: number[]): number {
  return xs.reduce((sum, x) => sum + x, 0) / xs.length
}

/** 总体标准差（÷N），全项目统一口径 */
export function stdev(xs: number[]): number {
  const m = mean(xs)
  return Math.sqrt(xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / xs.length)
}

export function passRate(xs: number[], threshold = ACCURACY_THRESHOLD) {
  const count = xs.filter((x) => x >= threshold).length
  return { count, total: xs.length, ratio: count / xs.length }
}

/** 最差四分位均值：衡量性能最差个体可用水平的量化指标 */
export function bottomQuartileMean(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b)
  const n = Math.max(1, Math.round(sorted.length * 0.25))
  return mean(sorted.slice(0, n))
}

/**
 * 构建合成队列。三步保证 mean/stdev 从数据点上真算出来恰好等于目标值：
 *   1) Blom 分位点（确定性、对称、有界）
 *   2) 有界抖动（固定种子），打破格点感
 *   3) 重新标准化后仿射映射到 (μ_c, σ_c)
 * 三个条件共享同一个 ẑ → 配对数据，可以画同一个人的三点连线。
 */
export function buildCohort(size = COHORT_SIZE, seed = 20260711): CohortSubject[] {
  const rand = mulberry32(seed)

  const raw = Array.from({ length: size }, (_, i) => invNorm((i + 1 - 0.375) / (size + 0.25)) + (rand() * 2 - 1) * 0.18)
  const m = mean(raw)
  const s = stdev(raw)
  const z = raw.map((value) => (value - m) / s)

  const jitters = Array.from({ length: size }, () => rand() * 2 - 1)

  return z.map((zi, i) => ({
    id: `S${String(i + 1).padStart(2, '0')}`,
    z: zi,
    jitter: jitters[i],
    accuracy: Object.fromEntries(
      conditions.map((c) => [c.key, c.mean + c.std * zi]),
    ) as Record<ConditionKey, number>,
  }))
}

export type ConditionStats = {
  key: ConditionKey
  mean: number
  std: number
  pass: { count: number; total: number; ratio: number }
  bottomQuartile: number
  min: number
  max: number
  span: number
}

export function summarize(cohort: CohortSubject[]): Record<ConditionKey, ConditionStats> {
  return Object.fromEntries(
    conditions.map((c) => {
      const xs = cohort.map((s) => s.accuracy[c.key])
      return [
        c.key,
        {
          key: c.key,
          mean: mean(xs),
          std: stdev(xs),
          pass: passRate(xs),
          bottomQuartile: bottomQuartileMean(xs),
          min: Math.min(...xs),
          max: Math.max(...xs),
          span: Math.max(...xs) - Math.min(...xs),
        },
      ]
    }),
  ) as Record<ConditionKey, ConditionStats>
}

/* ---------- 在线自适应：校准试次数 ---------- */

export type AdaptCurve = {
  key: 'warm' | 'cold'
  label: string
  tone: Tone
  /** k=0 的起点 */
  a0: number
  /** 该个体的生理上限（两条曲线相同：同一个人的天花板不会因算法而变） */
  aInf: number
  /** 先验等效试次数 —— 「记忆有多重」 */
  lambda: number
}

export const adaptCurves: Record<'warm' | 'cold', AdaptCurve> = {
  warm: { key: 'warm', label: '群体先验初始化', tone: 'green', a0: 84.0, aInf: 89.0, lambda: 2.5 },
  cold: { key: 'cold', label: '冷启动（无先验）', tone: 'magenta', a0: 78.0, aInf: 89.0, lambda: 18 },
}

export const CALIBRATION_TRIALS = 10
/** 一次运动想象校准试次：提示 + 想象 + 休息 */
export const TRIAL_SECONDS = 8

/** 收缩系数：个体数据占多大权重。与策略权重共用同一条律。 */
export function shrinkWeight(k: number, lambda: number): number {
  return k / (k + lambda)
}

/** acc(k) = a∞ − (a∞ − a0)·λ/(k+λ)  ≡  a0 + (a∞ − a0)·w(k) */
export function adaptationAccuracy(curve: AdaptCurve, k: number): number {
  return curve.aInf - (curve.aInf - curve.a0) * (curve.lambda / (k + curve.lambda))
}

/** 解析反解：达到目标准确率所需的试次数 */
export function trialsToReach(curve: AdaptCurve, target: number): number {
  if (target >= curve.aInf) {
    return Infinity
  }
  return (curve.lambda * (curve.aInf - curve.a0)) / (curve.aInf - target) - curve.lambda
}

/* ---------- 奖励记忆：多形态安抚策略池 ---------- */

export type ComfortKey = 'expression' | 'voice' | 'posture' | 'singing' | 'dancing'

export type ComfortStrategy = {
  key: ComfortKey
  label: string
  glyph: string
  tone: Tone
  /** 24 名历史被试的累计触发与命中 */
  groupHits: number
  groupTrials: number
}

/** CLAUDE.md 要求的五种形态：表情 / 语言 / 姿势 / 唱歌 / 跳舞 */
export const comfortStrategies: readonly ComfortStrategy[] = [
  { key: 'expression', label: '表情安抚', glyph: '☺', tone: 'green', groupHits: 96, groupTrials: 120 },
  { key: 'voice', label: '语音引导', glyph: '♪', tone: 'cyan', groupHits: 84, groupTrials: 120 },
  { key: 'posture', label: '姿势示范', glyph: '⤢', tone: 'violet', groupHits: 62, groupTrials: 116 },
  { key: 'singing', label: '节奏唱歌', glyph: '♬', tone: 'orange', groupHits: 41, groupTrials: 96 },
  { key: 'dancing', label: '律动跳舞', glyph: '✦', tone: 'magenta', groupHits: 27, groupTrials: 88 },
] as const

/** 温度越低，「给予较大权重」越激进 */
export const SOFTMAX_TAU = 0.12
/** 强制探索预算：防止小众有效策略被群体先验饿死 */
export const EXPLORE_EPS = 0.15
/** 先验强度：每个策略等效多少次个体触发 */
export const PRIOR_LAMBDA = 3
export const UCB_C = 0.35

/** Beta(1,1) 拉普拉斯平滑后的后验命中率 */
export function posteriorHitRate(hits: number, trials: number): number {
  return (hits + 1) / (trials + 2)
}

/**
 * 群体先验初始权重 = 温度 softmax + ε 探索地板，Σ=1。
 * 表情 ≈55.5%，跳舞 ≈3.9% —— 「记忆功能启动、给予较大权重」= 14 倍差距。
 */
export function priorWeights(strategies: readonly ComfortStrategy[] = comfortStrategies): Record<ComfortKey, number> {
  const scores = strategies.map((s) => Math.exp(posteriorHitRate(s.groupHits, s.groupTrials) / SOFTMAX_TAU))
  const total = scores.reduce((sum, x) => sum + x, 0)
  const floor = EXPLORE_EPS / strategies.length

  return Object.fromEntries(
    strategies.map((s, i) => [s.key, (1 - EXPLORE_EPS) * (scores[i] / total) + floor]),
  ) as Record<ComfortKey, number>
}

/**
 * 先验的伪计数形式。这是整个模块最关键的一步：
 * 纯 softmax 会使初始权重仅 3.9% 的跳舞在 10 次校准中一次都不被抽中：群体先验将使小众但有效的策略长期得不到探索机会。
 * 把先验实现为伪计数后，跳舞初始 n≈0.59 → UCB 探索奖励极大 → 前几次必被试到。
 * 于是「给予较大权重」和「不饿死小众」由同一行公式同时成立。
 */
export function priorPseudoCounts(): Record<ComfortKey, number> {
  const w = priorWeights()
  const scale = PRIOR_LAMBDA * comfortStrategies.length
  return Object.fromEntries(comfortStrategies.map((s) => [s.key, scale * w[s.key]])) as Record<ComfortKey, number>
}

export type PersonaKey = 'typical' | 'atypical' | 'fatigued'

export type Persona = {
  key: PersonaKey
  label: string
  note: string
  /** 该个体对每种策略的真实响应率 —— 演示时用它判命中，但算法看不到 */
  trueHit: Record<ComfortKey, number>
}

export const personas: readonly Persona[] = [
  {
    key: 'typical',
    label: '常规型',
    note: '个体响应与群体分布接近，群体先验即可满足需求，策略权重基本不发生偏移。',
    trueHit: { expression: 0.8, voice: 0.7, posture: 0.53, singing: 0.43, dancing: 0.31 },
  },
  {
    key: 'atypical',
    label: '非典型型',
    note: '个体偏好与群体相反。强先验使「表情」策略具有较高惯性，约需 8 次反例方能被推翻，对应「强先验对非典型个体响应迟缓」的公平性风险。',
    trueHit: { expression: 0.3, voice: 0.45, posture: 0.55, singing: 0.8, dancing: 0.85 },
  },
  {
    key: 'fatigued',
    label: '重度疲劳型',
    note: '仅低唤醒度的语音与姿势策略有效，高唤醒度的唱歌与跳舞反而加重疲劳。',
    trueHit: { expression: 0.35, voice: 0.78, posture: 0.72, singing: 0.25, dancing: 0.12 },
  },
] as const

export type AdaptState = {
  k: number
  hits: Record<ComfortKey, number>
  trials: Record<ComfortKey, number>
  log: Array<{ k: number; strategy: ComfortKey; hit: boolean }>
}

export function initAdaptState(): AdaptState {
  const zero = () => Object.fromEntries(comfortStrategies.map((s) => [s.key, 0])) as Record<ComfortKey, number>
  return { k: 0, hits: zero(), trials: zero(), log: [] }
}

/** 纯 reducer：UCB 抽策略 → 按 persona 的真实响应率判命中 → 更新计数 */
export function stepAdaptation(state: AdaptState, persona: Persona, seed: number): AdaptState {
  const pseudo = priorPseudoCounts()
  const priorHit = Object.fromEntries(
    comfortStrategies.map((s) => [s.key, posteriorHitRate(s.groupHits, s.groupTrials)]),
  ) as Record<ComfortKey, number>

  let best: ComfortKey = comfortStrategies[0].key
  let bestScore = -Infinity

  for (const s of comfortStrategies) {
    const n = pseudo[s.key] + state.trials[s.key]
    const blended = (pseudo[s.key] * priorHit[s.key] + state.hits[s.key]) / n
    const score = blended + UCB_C * Math.sqrt(Math.log(state.k + 2) / n)
    if (score > bestScore) {
      bestScore = score
      best = s.key
    }
  }

  const hit = mulberry32(seed + state.k * 7919)() < persona.trueHit[best]

  return {
    k: state.k + 1,
    hits: { ...state.hits, [best]: state.hits[best] + (hit ? 1 : 0) },
    trials: { ...state.trials, [best]: state.trials[best] + 1 },
    log: [...state.log, { k: state.k + 1, strategy: best, hit }],
  }
}

export type StrategyWeight = {
  key: ComfortKey
  /** 群体先验权重（图中的浅色基准条） */
  prior: number
  /** 融合后的当前个体权重（实心条） */
  blended: number
  delta: number
  individualTrials: number
}

/** 由 AdaptState 派生显示权重。柱子顺序固定不重排，变的是数值与 Δ。 */
export function weightsFrom(state: AdaptState): StrategyWeight[] {
  const prior = priorWeights()
  const pseudo = priorPseudoCounts()

  const posterior = comfortStrategies.map((s) => {
    const n = pseudo[s.key] + state.trials[s.key]
    const priorRate = posteriorHitRate(s.groupHits, s.groupTrials)
    return (pseudo[s.key] * priorRate + state.hits[s.key]) / n
  })

  const scores = posterior.map((p) => Math.exp(p / SOFTMAX_TAU))
  const total = scores.reduce((sum, x) => sum + x, 0)
  const floor = EXPLORE_EPS / comfortStrategies.length

  return comfortStrategies.map((s, i) => {
    const blended = (1 - EXPLORE_EPS) * (scores[i] / total) + floor
    return {
      key: s.key,
      prior: prior[s.key],
      blended,
      delta: blended - prior[s.key],
      individualTrials: state.trials[s.key],
    }
  })
}

/* ---------- 不变式护栏：任何人动了上面的参数，dev 下立刻炸出来 ---------- */
if (import.meta.env?.DEV) {
  const stats = summarize(buildCohort())
  console.assert(
    Math.abs(stats.adaptive.mean - 88.0) < 0.01,
    `个体自适应均值 ${stats.adaptive.mean.toFixed(2)}% 与首页 KPI 88.0% 脱钩了`,
  )
  console.assert(
    Math.abs(stats.generic.std - 9.2) < 0.01 && Math.abs(stats.adaptive.std - 3.1) < 0.01,
    'σ 未能从样本点真实算出，点图会与文案矛盾',
  )
  console.assert(
    Math.abs(adaptationAccuracy(adaptCurves.warm, CALIBRATION_TRIALS) - 88.0) < 0.01,
    '有先验的 10 次校准应恰好达到 88.0%',
  )
}
