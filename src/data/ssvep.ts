import type { Intent, RobotAction } from './scenario'

export type SsvepTone = 'violet' | 'cyan' | 'green' | 'orange'

export type SsvepTarget = {
  intent: Intent
  freq: number
  /** 相位调制（JFPM），单位弧度 */
  phase: number
  tone: SsvepTone
  action: RobotAction
}

/**
 * 四目标频率-相位联合调制（JFPM）。
 * 频率取 8/10/12/15 Hz 是 SSVEP 的经典低频段配置：α–β 交界处诱发响应最强。
 */
export const ssvepTargets: SsvepTarget[] = [
  { intent: '抬手', freq: 8, phase: 0, tone: 'violet', action: '肩部辅助抬升' },
  { intent: '伸肘', freq: 10, phase: Math.PI / 2, tone: 'cyan', action: '肘部屈伸' },
  { intent: '握拳', freq: 12, phase: Math.PI, tone: 'green', action: '手部抓握' },
  { intent: '放松', freq: 15, phase: (3 * Math.PI) / 2, tone: 'orange', action: '放松恢复' },
]

export const ssvepConfig = {
  channels: ['O1', 'Oz', 'O2'] as const,
  sampleRate: 250,
  bandpass: '6–40 Hz',
  notch: '50 Hz',
  refreshRate: 60,
  stimulusSeconds: 2,
  gapSeconds: 0.5,
  /** 离线评估准确率，用于 ITR 计算 */
  offlineAccuracy: 0.95,
  /** ρ 低于该阈值判为拒识，避免无注视时误触发 */
  rejectThreshold: 0.35,
}

/** 各目标被注视时收敛到的 CCA 相关系数 ρ */
export const ssvepPeakRho: Record<Intent, number> = {
  抬手: 0.79,
  伸肘: 0.83,
  握拳: 0.86,
  放松: 0.81,
}

export const ssvepPipeline = [
  { step: '刺激呈现', detail: '4 目标频率-相位联合调制（8 / 10 / 12 / 15 Hz），单次刺激 2.0s' },
  { step: '信号采集', detail: `枕区 ${['O1', 'Oz', 'O2'].join(' / ')} 三通道，250 Hz 采样` },
  { step: '预处理', detail: '6–40 Hz 带通滤波 + 50 Hz 工频陷波，抑制漂移与电源干扰' },
  { step: '特征解码', detail: 'FBCCA 滤波器组典型相关分析，联合基频与二次谐波' },
  { step: '判决输出', detail: '取 ρ 最大者为判决结果；当最大 ρ < 0.35 时判为拒识，不触发任何动作' },
] as const

/**
 * 主动式与反应式范式的对比。
 *
 * 第二列为「反应式（reactive）」：SSVEP 的使用者有意识地选择注视目标，
 * 外部刺激仅作为意图的载体。被动式（passive）范式指系统读取使用者状态而使用者不发出指令，
 * 本系统由疲劳指数驱动的训练强度自适应即属此类 —— 范式三分见 data/acquisition.ts。
 */
export const paradigmComparison = [
  {
    dimension: '信号来源',
    active: '自发脑电 · 运动皮层 μ / β 节律 ERD',
    reactive: '诱发脑电 · 枕区稳态视觉响应',
  },
  {
    dimension: '意图表达',
    active: '自发产生控制信号，全程无需外部刺激',
    reactive: '有意识地注视特定刺激以发出指令',
  },
  {
    dimension: '认知负担',
    active: '需持续进行运动想象，负担较高',
    reactive: '仅需维持注视，负担较低',
  },
  {
    dimension: '训练成本',
    active: '需个体化训练与逐人校准',
    reactive: '基本免训练，即戴即用',
  },
  {
    dimension: '适用人群',
    active: '保有残余运动想象能力者',
    reactive: '重度运动障碍、康复早期患者',
  },
  {
    dimension: '典型指标',
    active: '准确率 88.0% · 响应延迟 176ms',
    reactive: '准确率 95.0% · ITR 39.2 bits/min',
  },
] as const

export const ssvepNotes = [
  'SSVEP 属于反应式（reactive）范式，而非被动式（passive）。使用者仍在有意识地选择注视目标，只是借助外部刺激作为意图的载体；被动式范式指系统读取使用者的状态（疲劳、负荷、注意力）而使用者并未发出任何指令。分类依据：Zander & Kothe, J. Neural Eng. 8(2), 2011。',
  '刺激频率受屏幕刷新率约束：在 60Hz 屏幕上部署时，需取 60/N 或采用频率近似法逼近目标频率。',
  '枕区 α 节律（≈10Hz）与刺激频段重叠，故解码依赖 FBCCA 的谐波信息，而非单一基频幅值。',
  '8–15Hz 闪烁落在光敏性癫痫的风险频段（3–30Hz），故本页刺激默认关闭，须由使用者显式开启，并采用低对比度亮度调制；系统同时遵循 prefers-reduced-motion 设置。',
] as const

/** 高斯峰，用于合成功率谱 */
function gauss(f: number, mu: number, amp: number, sigma: number) {
  return amp * Math.exp(-((f - mu) ** 2) / (2 * sigma ** 2))
}

export const SPECTRUM_START = 4
export const SPECTRUM_END = 34

/** 合成某一频点的功率谱值：本底噪声 + α 节律 + 注视目标的基频/谐波峰 */
export function spectrumPower(freq: number, attended: SsvepTarget | null, scale: number, tick: number) {
  let power = 0.14 / (1 + (freq - SPECTRUM_START) * 0.05)
  power += 0.012 * Math.sin(freq * 5.7 + tick * 0.35) + 0.012 * Math.cos(freq * 11.3 - tick * 0.22)
  power += gauss(freq, 10, 0.1, 0.9)

  if (attended && scale > 0) {
    power += gauss(freq, attended.freq, scale, 0.34)
    power += gauss(freq, attended.freq * 2, 0.42 * scale, 0.38)
    if (attended.freq * 3 <= SPECTRUM_END) {
      power += gauss(freq, attended.freq * 3, 0.15 * scale, 0.4)
    }
    for (const other of ssvepTargets) {
      if (other.intent === attended.intent) {
        continue
      }
      power += gauss(freq, other.freq, 0.09 * scale, 0.3)
    }
  }

  return Math.max(0.02, power)
}
