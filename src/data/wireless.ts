import type { Tone } from '../design/tokens'

/**
 * 无线采集与范式的硬件形态。
 *
 * 核心主张：「范式的形式体现」= 范式决定硬件形态。
 * 被动 SSVEP 只需枕区 3 通道但必须外挂刺激器（占满视觉通道）；
 * 主动 MI 需要运动区 5 通道但不需要任何刺激器（视觉通道空出来，
 * 而康复场景里视觉通道往往必须留给「看着自己的手在动」这件事本身）。
 * 一顶 8 通道无线头戴同时覆盖两个范式的电极子集 —— 切范式 = 切通道子集，不换硬件。
 */

export type LatencySegment = {
  key: string
  stage: string
  ms: number
  tone: Tone
  detail: string
  /** 是否属于无线链路（用于算「无线化的代价」） */
  wireless: boolean
  /** 有线方案下同一环节的耗时 */
  wiredMs: number
}

/** 端到端延迟预算。每一段都有物理出处，不是凑数。 */
export const latencyBudget: readonly LatencySegment[] = [
  {
    key: 'acquire',
    stage: '脑电采集与打包',
    ms: 64,
    wiredMs: 32,
    tone: 'cyan',
    detail: '250Hz × 16 样本/包 = 恰好 64ms 的包周期；有线可用 8 样本/包降到 32ms',
    wireless: true,
  },
  {
    key: 'ble',
    stage: 'BLE 无线传输',
    ms: 30,
    wiredMs: 0,
    tone: 'violet',
    detail: 'BLE 5.0 连接间隔 15ms，一次可靠投递上界 = 15 × 2',
    wireless: true,
  },
  {
    key: 'decode',
    stage: '预处理与解码',
    ms: 42,
    wiredMs: 42,
    tone: 'green',
    detail: '6–40Hz 带通 + 50Hz 陷波 + CSP / FBCCA + LDA 前向',
    wireless: false,
  },
  {
    key: 'decide',
    stage: 'AI 康复决策',
    ms: 11,
    wiredMs: 11,
    tone: 'orange',
    detail: '规则 + 轻量策略网络，以查表为主',
    wireless: false,
  },
  {
    key: 'actuate',
    stage: '指令下发与伺服启动',
    ms: 29,
    wiredMs: 29,
    tone: 'magenta',
    detail: 'CAN 下发 + 伺服启动死区',
    wireless: false,
  },
] as const

/** 由数组求和得出，绝不硬写 —— 任何一段被改，首页 KPI 与本页不会对不上。 */
export const LATENCY_TOTAL = latencyBudget.reduce((sum, s) => sum + s.ms, 0)
export const LATENCY_WIRED_TOTAL = latencyBudget.reduce((sum, s) => sum + s.wiredMs, 0)
/** 首页 KPI 的「响应延迟 ≤200ms」 */
export const LATENCY_LIMIT = 200
export const LATENCY_HEADROOM = LATENCY_LIMIT - LATENCY_TOTAL

export const WIRELESS_MS = latencyBudget.filter((s) => s.wireless).reduce((sum, s) => sum + s.ms, 0)
export const WIRELESS_SHARE = WIRELESS_MS / LATENCY_TOTAL
export const WIRELESS_COST = LATENCY_TOTAL - LATENCY_WIRED_TOTAL

/** 过力保护走本地 MCU 环路，不经过 BLE —— 安全不能依赖一条可能丢包的无线链路。 */
export const SAFETY_LOOP_MS = 8

export type ParadigmKey = 'active' | 'passive'

export type Electrode = {
  id: string
  /** 10-20 系统的二维投影，单位为头模半径的比例 */
  x: number
  y: number
  paradigm: ParadigmKey
  region: string
}

export const electrodes: readonly Electrode[] = [
  { id: 'C3', x: -0.35, y: 0, paradigm: 'active', region: '运动区' },
  { id: 'Cz', x: 0, y: 0, paradigm: 'active', region: '运动区' },
  { id: 'C4', x: 0.35, y: 0, paradigm: 'active', region: '运动区' },
  { id: 'CP3', x: -0.36, y: 0.22, paradigm: 'active', region: '运动区' },
  { id: 'CP4', x: 0.36, y: 0.22, paradigm: 'active', region: '运动区' },
  { id: 'O1', x: -0.28, y: 0.78, paradigm: 'passive', region: '枕区' },
  { id: 'Oz', x: 0, y: 0.82, paradigm: 'passive', region: '枕区' },
  { id: 'O2', x: 0.28, y: 0.78, paradigm: 'passive', region: '枕区' },
] as const

export const paradigmForms: Record<ParadigmKey, {
  label: string
  channels: string
  stimulator: string
  headset: string
  visualChannel: string
  calibration: string
  note: string
}> = {
  active: {
    label: '主动 · 运动想象',
    channels: '运动区 C3 / Cz / C4 / CP3 / CP4（5 通道）',
    stimulator: '不需要 —— 自发脑电，闭眼也能用',
    headset: '需覆盖运动皮层，电极更多、对位要求更高',
    visualChannel: '空出来 —— 可以留给「看着自己的手在动」',
    calibration: '10 试次（有群体先验）/ 180 试次（冷启动）',
    note: '视觉反馈是运动康复的核心机制。主动范式不占用视觉通道，这是它在康复里不可替代的理由。',
  },
  passive: {
    label: '被动 · SSVEP',
    channels: '枕区 O1 / Oz / O2（3 通道）',
    stimulator: '必须外挂闪烁屏 / LED',
    headset: '三电极轻头带即可，患者几乎无感',
    visualChannel: '被刺激器占满 —— 患者必须能视物并维持注视',
    calibration: '基本免训练，即戴即用',
    note: '认知负担低、免校准，适合康复早期与重度运动障碍患者作为低负荷备用通道。',
  },
}

export const wirelessSpecs = [
  { label: '电极', value: '半干电极', hint: '免涂导电膏，5 分钟佩戴' },
  { label: '通道', value: '8 通道', hint: '运动区 5 + 枕区 3，双范式共用一顶头戴' },
  { label: '采样', value: '250 Hz', hint: '24-bit ADC' },
  { label: '无线', value: 'BLE 5.0', hint: '连接间隔 15ms · MTU 247B' },
  { label: '阻抗', value: '< 20 kΩ', hint: '实时监测，> 50 kΩ 报警' },
  { label: '丢包率', value: '< 0.5%', hint: '3m 视距 · 32 包环形缓冲重传' },
  { label: '续航', value: '6.5 h', hint: '350 mAh，连续采集' },
  { label: '重量', value: '118 g', hint: '整机含电池' },
] as const

/**
 * 必须主动写清的量纲问题（行家会盯）：
 * 176ms 是 MI 通路的「响应延迟」（意图起始 → 机械臂启动）；
 * SSVEP 的 2.5s 是「单次选择耗时」（含 2.0s 刺激累积）。两者量纲不同，不可直接比较。
 */
export const LATENCY_CAVEAT =
  '本页的 176ms 是主动范式（运动想象）的响应延迟：从意图起始到机械臂启动。' +
  'SSVEP 页的 2.5s 是单次选择耗时（含 2.0s 刺激累积），两者量纲不同，不可直接比较。'
