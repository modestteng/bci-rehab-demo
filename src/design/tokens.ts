/** 色调令牌。CSS 侧对应 .tone-* 工具类，组件一律靠 var(--t) 着色。 */
export const TONES = ['cyan', 'green', 'violet', 'orange', 'magenta'] as const
export type Tone = (typeof TONES)[number]

/** 状态语义色：Tone 的超集，仅状态类组件（StatusPill 等）使用 */
export type StatusTone = Tone | 'idle' | 'active' | 'success'

/**
 * 可折叠卡片的全部 id。用联合类型而非裸 string，
 * 拼错时 TS 直接报错，不会像以前那样静默失效。
 */
export type CardKey =
  | 'home-kpi'
  | 'home-status'
  | 'ssvep-pipeline'
  | 'ssvep-compare'
  | 'ssvep-notes'
  | 'report-detail'
  | 'system-optical'
  | 'system-arch'
  | 'system-ext'
  | 'adapt-memory'
  | 'adapt-fairness'
  | 'wireless-specs'
  | 'wireless-paradigm'
  | 'ethics-notes'
