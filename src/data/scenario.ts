export const stages = [
  '脑电信号模拟',
  '运动意图识别',
  '光电感知校验',
  'AI康复决策',
  '机器人动作响应',
  '触觉反馈',
  '训练报告生成',
] as const

export const intents = ['抬手', '伸肘', '握拳', '放松'] as const

export const actionTabs = ['肩部辅助抬升', '肘部屈伸', '手部抓握', '放松恢复'] as const

export type Intent = (typeof intents)[number]
export type Stage = (typeof stages)[number]
export type RobotAction = (typeof actionTabs)[number]
export type DemoMode = 'auto' | 'manual'

export const stageDetails: Record<
  Stage,
  {
    label: string
    metric: string
    helper: string
  }
> = {
  脑电信号模拟: {
    label: '模拟输入 / 仿真验证',
    metric: 'EEG 通道稳定度 93%',
    helper: '模拟前额叶脑电输入，为后续运动意图识别提供信号基线。',
  },
  运动意图识别: {
    label: '四类意图分类',
    metric: '当前识别置信度 91%',
    helper: '支持抬手、伸肘、握拳、放松四类运动意图，并动态联动后续决策。',
  },
  光电感知校验: {
    label: 'RGB / NIR / ToF 交叉校验',
    metric: '姿态评分 92 / 100',
    helper: '利用多模态光电链路对动作姿态、偏差和安全空间进行二次确认。',
  },
  AI康复决策: {
    label: '动作与力度策略生成',
    metric: '保护策略已启用',
    helper: '根据意图、疲劳和姿态评分生成训练方案，并解释每个决策依据。',
  },
  机器人动作响应: {
    label: '机械臂轨迹执行',
    metric: '控制精度目标 ≤5mm',
    helper: '显示目标轨迹与实际轨迹对比，并反馈控制误差和抓握力度。',
  },
  触觉反馈: {
    label: '压力 / 振动 / 位置感闭环',
    metric: '反馈延迟 48ms',
    helper: '将压力、振动和位置感反馈与当前动作任务同步，构成感觉运动闭环。',
  },
  训练报告生成: {
    label: '训练结果沉淀与建议',
    metric: '汇总 8 项训练指标',
    helper: '汇总本次训练结果，输出指标、变化趋势与康复建议。',
  },
}

export const kpis = [
  {
    label: '意图识别准确率',
    target: '≥85%',
    value: '88.0%',
    delta: '+3.0%',
  },
  {
    label: '响应延迟',
    target: '≤200ms',
    value: '176ms',
    delta: '-24ms',
  },
  {
    label: '控制精度',
    target: '≤5mm',
    value: '3.8mm',
    delta: '-1.2mm',
  },
  {
    label: '抓握力度误差',
    target: '≤10%',
    value: '7.0%',
    delta: '-3.0%',
  },
] as const

export const intentProfiles: Record<
  Intent,
  {
    confidence: number
    risk: string
    riskValue: number
    robotAction: RobotAction
    poseScore: number
    lowLightScore: number
    trajectoryDeviation: number
    safetyCheck: string
    fatigue: number
    aiPlan: string[]
    haptic: {
      pressure: number
      vibration: number
      proprioception: number
    }
    report: {
      completedReps: number
      duration: string
      accuracy: string
      latency: string
      precision: string
      gripError: string
      fatigueDelta: string
      recommendation: string
    }
  }
> = {
  抬手: {
    confidence: 0.86,
    risk: '低风险',
    riskValue: 0.18,
    robotAction: '肩部辅助抬升',
    poseScore: 88,
    lowLightScore: 0.84,
    trajectoryDeviation: 4.1,
    safetyCheck: '通过',
    fatigue: 0.27,
    aiPlan: ['肩部抬升辅助', '中低力度', '缓速执行', '振动+位置感反馈', '保持关节保护'],
    haptic: {
      pressure: 0.52,
      vibration: 0.44,
      proprioception: 0.58,
    },
    report: {
      completedReps: 14,
      duration: '10 分钟',
      accuracy: '86.0%',
      latency: '184ms',
      precision: '4.1mm',
      gripError: '8.8%',
      fatigueDelta: '+0.05',
      recommendation: '继续肩部辅助抬升训练，下一轮可增加单次保持时长。',
    },
  },
  伸肘: {
    confidence: 0.89,
    risk: '低风险',
    riskValue: 0.12,
    robotAction: '肘部屈伸',
    poseScore: 90,
    lowLightScore: 0.87,
    trajectoryDeviation: 3.9,
    safetyCheck: '通过',
    fatigue: 0.25,
    aiPlan: ['肘部屈伸辅助', '标准力度', '中速执行', '压力+位置感反馈', '开启误差修正'],
    haptic: {
      pressure: 0.58,
      vibration: 0.39,
      proprioception: 0.61,
    },
    report: {
      completedReps: 16,
      duration: '11 分钟',
      accuracy: '89.0%',
      latency: '179ms',
      precision: '3.9mm',
      gripError: '7.6%',
      fatigueDelta: '+0.04',
      recommendation: '肘部屈伸轨迹稳定，可逐步提高节律稳定度要求。',
    },
  },
  握拳: {
    confidence: 0.91,
    risk: '低风险',
    riskValue: 0.08,
    robotAction: '手部抓握',
    poseScore: 92,
    lowLightScore: 0.89,
    trajectoryDeviation: 3.8,
    safetyCheck: '通过',
    fatigue: 0.24,
    aiPlan: ['辅助抓握', '标准力度', '中速执行', '压力+振动反馈', '开启过力保护'],
    haptic: {
      pressure: 0.62,
      vibration: 0.46,
      proprioception: 0.58,
    },
    report: {
      completedReps: 18,
      duration: '12 分钟',
      accuracy: '88.0%',
      latency: '176ms',
      precision: '3.8mm',
      gripError: '7.0%',
      fatigueDelta: '+0.10',
      recommendation: '继续握拳训练，下一轮可小幅提升阻力并维持过力保护。',
    },
  },
  放松: {
    confidence: 0.84,
    risk: '中风险',
    riskValue: 0.26,
    robotAction: '放松恢复',
    poseScore: 85,
    lowLightScore: 0.8,
    trajectoryDeviation: 4.4,
    safetyCheck: '需复核',
    fatigue: 0.31,
    aiPlan: ['放松恢复训练', '低力度', '缓速执行', '轻振动+位置感反馈', '提高保护阈值敏感度'],
    haptic: {
      pressure: 0.39,
      vibration: 0.28,
      proprioception: 0.51,
    },
    report: {
      completedReps: 12,
      duration: '9 分钟',
      accuracy: '84.0%',
      latency: '193ms',
      precision: '4.4mm',
      gripError: '9.3%',
      fatigueDelta: '+0.12',
      recommendation: '当前更适合放松恢复和低强度训练，建议降低速度并增加安抚反馈。',
    },
  },
}

export const actionProfiles: Record<
  RobotAction,
  {
    deviation: number
    grip: string
    actualOffset: number
    target: Array<[number, number]>
  }
> = {
  肩部辅助抬升: {
    deviation: 4.1,
    grip: '42%',
    actualOffset: 8,
    target: [
      [48, 170],
      [112, 152],
      [182, 120],
      [252, 92],
      [360, 70],
    ],
  },
  肘部屈伸: {
    deviation: 3.9,
    grip: '55%',
    actualOffset: 5,
    target: [
      [48, 150],
      [112, 98],
      [182, 150],
      [252, 98],
      [360, 142],
    ],
  },
  手部抓握: {
    deviation: 3.8,
    grip: '63%',
    actualOffset: 3,
    target: [
      [48, 162],
      [112, 134],
      [182, 112],
      [252, 100],
      [360, 94],
    ],
  },
  放松恢复: {
    deviation: 4.4,
    grip: '28%',
    actualOffset: 10,
    target: [
      [48, 108],
      [112, 122],
      [182, 136],
      [252, 148],
      [360, 158],
    ],
  },
}

/**
 * 过力保护。此前它只是 aiPlan 数组里的一个字符串「开启过力保护」，背后零代码 ——
 * 现在它是真的：力度指令必须经此钳制后才能下发。
 * 该环路运行在本地 MCU（见 wireless.ts 的 SAFETY_LOOP_MS），不经过可能丢包的无线链路。
 */
export const forceLimits = {
  /** 软阈：超过即削减到此值 */
  softCap: 0.72,
  /** 硬阈：绝不允许越过 */
  hardCap: 0.85,
  /** 本地环路响应时间 */
  cutoffMs: 8,
} as const

export function applyForceCap(demand: number, limits = forceLimits) {
  const clipped = demand > limits.hardCap
  const applied = clipped ? limits.softCap : Math.max(0, demand)
  return {
    demand,
    applied,
    clipped,
    /** 距硬阈还剩多少余量 */
    margin: limits.hardCap - applied,
  }
}

export const opticalCards = [
  {
    key: 'RGB',
    title: 'RGB 可见光校验',
    detail: '用于上肢关键点与抓握目标识别，联动 YOLO 做肢体区域检测。',
    metric: '清晰度 91',
  },
  {
    key: 'NIR',
    title: 'NIR 近红外增强',
    detail: '弱光训练环境补偿与边界增强，强化 Zero-DCE 的低照度表现。',
    metric: '弱光可见性 89%',
  },
  {
    key: 'ToF',
    title: 'ToF 深度安全校验',
    detail: '用于深度距离估计与动作轨迹偏差检测，保障执行空间安全。',
    metric: '深度稳定度 87%',
  },
] as const

export const algorithmBadges = [
  'Zero-DCE · 低照度增强',
  'YOLO · 上肢关键区域检测',
  'R(2+1)D-BERT · 动作序列判定',
] as const

export const architectureLayers = [
  {
    title: '感知层',
    items: ['EEG 模拟输入', 'RGB / NIR / ToF', '力觉与触觉采样'],
  },
  {
    title: '意图理解层',
    items: ['运动意图分类', '姿态评分', '疲劳与风险估计'],
  },
  {
    title: '决策控制层',
    items: ['AI 康复决策', '机械臂轨迹规划', '过力保护规则'],
  },
  {
    title: '反馈评估层',
    items: ['压力 / 振动 / 位置感反馈', '训练报告', '个体化记忆更新'],
  },
] as const
