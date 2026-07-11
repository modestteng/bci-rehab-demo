import type { RouteId } from '../app/navigation'

/**
 * 伦理与安全。
 *
 * 设计原则：每一条主张都必须指向可核查的代码，或者诚实地写出缺口。
 * evidence 只写「文件 + 符号」而不写行号 —— 行号会随重构漂移，
 * 一份指着错行号的「证据」比没有证据更糟。
 */

export type EthicsStatus = 'implemented' | 'partial' | 'planned'

export type EthicsEvidence = {
  file: string
  symbol: string
}

export type EthicsItem = {
  id: string
  title: string
  /** 伦理原则 */
  principle: string
  /** 本系统的具体措施 */
  measure: string
  status: EthicsStatus
  evidence?: EthicsEvidence[]
  /** 诚实的缺口。partial / planned 必填。 */
  gap?: string
  action?: { label: string; to: RouteId }
}

export const ethicsStatusLabel: Record<EthicsStatus, string> = {
  implemented: '已实现',
  partial: '部分实现',
  planned: '规划中',
}

export const ethicsItems: readonly EthicsItem[] = [
  {
    id: 'photosensitive',
    title: '光敏性癫痫防护',
    principle: '不得让使用者在毫无预警的情况下暴露于致痫性视觉刺激。',
    measure:
      'SSVEP 的 8–15Hz 闪烁落在 3–30Hz 风险频段，因此默认关闭，必须由使用者显式点击开启；' +
      '采用低对比度亮度调制；并遵循系统的 prefers-reduced-motion 设置。深链只预选目标，不代替使用者同意。',
    status: 'implemented',
    evidence: [
      { file: 'src/hooks/useSsvepController.ts', symbol: 'flicker 初始值 false' },
      { file: 'src/styles/globals.css', symbol: '@media (prefers-reduced-motion: reduce)' },
    ],
    action: { label: '去看闪烁开关', to: 'ssvep' },
  },
  {
    id: 'data-locality',
    title: '数据不出端',
    principle: '脑电是高度敏感的生物特征数据，不应离开使用者的设备。',
    measure:
      '整个应用零 fetch / XMLHttpRequest / 外部资源引用，加载后完全离线可用。' +
      '单文件构建产物断网可跑 —— 这一条可以当场 grep 给评委看。',
    status: 'implemented',
    evidence: [{ file: 'src/', symbol: '全仓 0 处网络请求' }],
  },
  {
    id: 'data-minimization',
    title: '数据最小化',
    principle: '不采集、不留存超出当次训练所需的任何数据。',
    measure:
      '全仓零 localStorage / sessionStorage / IndexedDB —— 脑电与训练数据从不落盘，刷新即遗忘。' +
      '报告导出为本地演示快照，不写文件、不上传。',
    status: 'implemented',
    evidence: [{ file: 'src/', symbol: '全仓 0 处持久化存储' }],
  },
  {
    id: 'reject',
    title: '不确定就不动',
    principle: '解码置信度不足时，系统应当拒绝执行，而不是猜一个动作。',
    measure: 'SSVEP 判决设有拒识阈值 ρ ≥ 0.35，低于阈值判为拒识，不触发任何机械臂动作。',
    status: 'implemented',
    evidence: [{ file: 'src/hooks/useSsvepController.ts', symbol: 'accepted = winnerRho >= rejectThreshold' }],
    action: { label: '去看拒识判决', to: 'ssvep' },
  },
  {
    id: 'force',
    title: '过力保护与物理安全',
    principle: '机械臂作用于患者肢体，任何情况下都不得超过安全力阈。',
    measure:
      '力度指令经硬阈值钳制：软阈 72%，硬阈 85%，超限即削减并告警。' +
      '该环路运行在本地 MCU 上（8ms），不经过可能丢包的无线链路。',
    status: 'implemented',
    evidence: [
      { file: 'src/data/scenario.ts', symbol: 'applyForceCap / forceLimits' },
      { file: 'src/data/wireless.ts', symbol: 'SAFETY_LOOP_MS = 8' },
    ],
    action: { label: '当场触发一次', to: 'demo' },
  },
  {
    id: 'human-in-loop',
    title: '人在回路',
    principle: '康复决策不能全自动，治疗师与患者必须能随时介入和终止。',
    measure: '手动模式下每一步都需显式确认；步骤按顺序解锁，不可跳跃；随时可重置。',
    status: 'implemented',
    evidence: [{ file: 'src/hooks/useDemoController.ts', symbol: 'handleManualNext / handleStepExpand 的步骤锁定' }],
  },
  {
    id: 'explainable',
    title: '决策可解释',
    principle: '每一次 AI 决策都应能说清依据，而不是一个黑箱输出。',
    measure: 'AI 康复决策显式列出四项依据：意图结果、姿态评分、疲劳指数、误操作风险。',
    status: 'implemented',
    evidence: [{ file: 'src/hooks/useDemoController.ts', symbol: 'decisionReasons' }],
  },
  {
    id: 'fairness',
    title: '算法公平性',
    principle: '同一套系统对不同个体的可用性差异过大，本身就是一种伤害。',
    measure:
      '通用模型下跨被试标准差 σ 高达 9.2%：有人几乎完全可用，有人几乎完全不可用。' +
      '群体先验 + 个体自适应把 σ 压到 3.1%，最差四分位从 66% 提到 84% —— ' +
      '目的不是让指标好看，是让最差的那个人也能用上。',
    status: 'partial',
    evidence: [{ file: 'src/data/adaptation.ts', symbol: 'summarize / bottomQuartileMean' }],
    gap:
      '我们不宣称消除了它：即使个体自适应之后，仍有约 1/5 的被试低于 85% 门槛。' +
      'BCI illiteracy（脑机接口失能）是真实存在的现象，本系统只能缓解，不能消除。',
    action: { label: '看 σ 收敛的证据', to: 'adaptation' },
  },
  {
    id: 'failsafe',
    title: '失效安全降级',
    principle: '任何一个部件失效，都不应让整个系统对使用者不可用。',
    measure:
      'WebGL 不可用时 3D 面板降级为静态说明，训练指标不受影响；' +
      '任何子树渲染异常只降级该子树；未启用 JavaScript 时给出明确提示。',
    status: 'implemented',
    evidence: [
      { file: 'src/components/ErrorBoundary.tsx', symbol: 'ErrorBoundary / AppCrashFallback' },
      { file: 'src/components/RobotArm3D.tsx', symbol: 'RobotArmFallback' },
    ],
  },
  {
    id: 'vulnerable',
    title: '脆弱人群保护',
    principle: '卒中、失语、认知障碍患者难以完整表达同意，需要更高的保护标准。',
    measure: '所有具风险的交互（闪烁刺激、力度提升）均为显式开启、默认关闭，且随时可中止。',
    status: 'partial',
    gap:
      '真实临床部署还需要：由治疗师代理的知情同意流程、伦理委员会审查、' +
      '不良事件上报通道。本演示不具备这些，也不应被当作临床产品使用。',
  },
  {
    id: 'no-overclaim',
    title: '不夸大宣传',
    principle: '演示数据不得被呈现为临床结论。',
    measure:
      '个体支持性模块的队列为合成数据（24 名虚拟被试，确定性生成），图表角标明确标注' +
      '「合成数据 · 非临床结论」。所有脑电信号均为仿真，不来自真实采集。',
    status: 'implemented',
    evidence: [{ file: 'src/data/adaptation.ts', symbol: 'buildCohort（确定性合成）' }],
  },
] as const

export function countByStatus(items: readonly EthicsItem[] = ethicsItems): Record<EthicsStatus, number> {
  return items.reduce(
    (acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }),
    { implemented: 0, partial: 0, planned: 0 } as Record<EthicsStatus, number>,
  )
}

/**
 * 运行时自校验：本页实际发出了多少个跨域请求？
 * 一个在运行时自己验证自己的伦理主张。只读浏览器 API，零网络。
 */
export function countExternalRequests(): number | null {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return null
  }
  try {
    return performance
      .getEntriesByType('resource')
      .filter((entry) => !entry.name.startsWith(window.location.origin) && !entry.name.startsWith('data:'))
      .length
  } catch {
    return null
  }
}
