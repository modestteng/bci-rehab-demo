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
    action: { label: '查看闪烁开关的实现', to: 'ssvep' },
  },
  {
    id: 'data-locality',
    title: '数据不出端',
    principle: '脑电是高度敏感的生物特征数据，不应离开使用者的设备。',
    measure:
      '整个应用不含任何 fetch / XMLHttpRequest 调用与外部资源引用，加载后完全离线可用。' +
      '训练报告的 Word 文档亦在浏览器内本地生成，不经服务端。' +
      '单文件构建产物在断网条件下可正常运行并完成导出，该结论可通过全仓检索直接核验。',
    status: 'implemented',
    evidence: [
      { file: 'src/', symbol: '全仓 0 处网络请求' },
      { file: 'src/features/report/exportDocx.ts', symbol: 'downloadReport（浏览器内生成 .docx）' },
    ],
  },
  {
    id: 'data-minimization',
    title: '数据最小化',
    principle: '不采集、不留存超出当次训练所需的任何数据。',
    measure:
      '全仓不含 localStorage / sessionStorage / IndexedDB 调用：脑电与训练数据不写入持久化存储，页面刷新后即不可恢复。' +
      '训练报告在本机内存中生成为 Word 文档，仅在使用者主动点击导出时写入其自选的下载目录，全程不经网络上传。',
    status: 'implemented',
    evidence: [{ file: 'src/', symbol: '全仓 0 处持久化存储' }],
  },
  {
    id: 'reject',
    title: '低置信度拒识',
    principle: '解码置信度不足时，系统应拒绝执行，而非输出一个未经确认的动作。',
    measure: 'SSVEP 判决设有拒识阈值 ρ ≥ 0.35，低于阈值判为拒识，不触发任何机械臂动作。',
    status: 'implemented',
    evidence: [{ file: 'src/hooks/useSsvepController.ts', symbol: 'accepted = winnerRho >= rejectThreshold' }],
    action: { label: '查看拒识判决', to: 'ssvep' },
  },
  {
    id: 'force',
    title: '过力保护与物理安全',
    principle: '机械臂作用于患者肢体，任何情况下都不得超过安全力阈。',
    measure:
      '力度指令经硬阈值钳制：软阈 72%，硬阈 85%，超限即削减并告警。' +
      '该环路运行于本地 MCU（8ms），不经过存在丢包可能的无线链路。',
    status: 'implemented',
    evidence: [
      { file: 'src/data/scenario.ts', symbol: 'applyForceCap / forceLimits' },
      { file: 'src/data/wireless.ts', symbol: 'SAFETY_LOOP_MS = 8' },
    ],
    action: { label: '触发一次过力保护', to: 'demo' },
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
    principle: '每一次 AI 决策均应给出可追溯的依据，而非黑箱输出。',
    measure: 'AI 康复决策显式列出四项依据：意图结果、姿态评分、疲劳指数、误操作风险。',
    status: 'implemented',
    evidence: [{ file: 'src/hooks/useDemoController.ts', symbol: 'decisionReasons' }],
  },
  {
    id: 'fairness',
    title: '算法公平性',
    principle: '同一系统对不同个体的可用性差异过大，本身即构成一种伤害。',
    measure:
      '通用模型下跨被试标准差 σ 高达 9.2%，个体间可用性差异显著。' +
      '经群体先验迁移与个体自适应校准，σ 降至 3.1%，最差四分位均值由 66% 提升至 84%。' +
      '其目的不在于提升平均指标，而在于提升性能最差个体的可用水平。',
    status: 'partial',
    evidence: [{ file: 'src/data/adaptation.ts', symbol: 'summarize / bottomQuartileMean' }],
    gap:
      '本系统缓解而非消除该现象：个体自适应后，仍有约 1/5 的被试低于 85% 门槛。' +
      'BCI illiteracy（脑机接口失能）是文献中已被反复报道的客观现象。',
    action: { label: '查看 σ 收敛的实测数据', to: 'adaptation' },
  },
  {
    id: 'failsafe',
    title: '失效安全降级',
    principle: '任一部件失效，均不应导致整个系统对使用者不可用。',
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
      '真实临床部署尚需：由治疗师代理的知情同意流程、伦理委员会审查、' +
      '不良事件上报通道。本系统当前不具备上述流程，不可作为临床产品使用。',
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
