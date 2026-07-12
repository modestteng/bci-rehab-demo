import type { ReactNode } from 'react'

type Paint = { stroke: string; fill: string }

/**
 * 图标注册表。IconName 由此推导 —— 加图标 = 加一个 key，
 * 不必再同步一个手写的联合类型。
 */
const ICONS = {
  home: (p: Paint) => (
    <>
      <path d="M4 9.5 10 4l6 5.5" fill="none" stroke={p.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 8.8V15h7V8.8" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  demo: (p: Paint) => (
    <>
      <rect x="3.5" y="3.5" width="13" height="13" rx="4" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <path d="M8 7.5 13 10 8 12.5Z" fill={p.stroke} stroke={p.stroke} strokeLinejoin="round" />
    </>
  ),
  ssvep: (p: Paint) => (
    <>
      <rect x="2.8" y="3.2" width="7.2" height="7.2" rx="2.2" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <path d="M12.5 4.6a4.8 4.8 0 0 1 0 6.4" fill="none" stroke={p.stroke} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.2 2.8a8.2 8.2 0 0 1 0 10" fill="none" stroke={p.stroke} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M2.8 15.4c1.1 0 1.1 1.8 2.2 1.8s1.1-3.2 2.2-3.2 1.1 3.2 2.2 3.2 1.1-1.8 2.2-1.8"
        fill="none"
        stroke={p.stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  report: (p: Paint) => (
    <>
      <rect x="4" y="3.5" width="12" height="13" rx="3.5" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <path d="M7 8.5h6M7 11h6M7 13.5h3.5" fill="none" stroke={p.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  system: (p: Paint) => (
    <>
      <circle cx="10" cy="10" r="2.2" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <path
        d="M10 3.8v2M10 14.2v2M3.8 10h2M14.2 10h2M5.6 5.6l1.4 1.4M13 13l1.4 1.4M14.4 5.6 13 7M7 13l-1.4 1.4"
        fill="none"
        stroke={p.stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  brain: (p: Paint) => (
    <path
      d="M4 11c0-2.3 1.9-4.2 4.2-4.2.9-1.3 2.7-1.8 4.1-1.1 1.4.7 2.3 2.1 2.3 3.7 1 .5 1.7 1.6 1.7 2.9 0 1.8-1.5 3.3-3.3 3.3H7.2C5.4 15.6 4 14.1 4 12.3Z"
      fill={p.fill}
      stroke={p.stroke}
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  ),
  latency: (p: Paint) => (
    <>
      <circle cx="10" cy="10" r="6" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <path d="M10 6.8v3.6l2.4 1.4" fill="none" stroke={p.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  precision: (p: Paint) => (
    <>
      <circle cx="10" cy="10" r="5.8" fill="none" stroke={p.stroke} strokeWidth="1.8" />
      <circle cx="10" cy="10" r="2.4" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2" fill="none" stroke={p.stroke} strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  force: (p: Paint) => (
    <>
      <path
        d="M5.2 12.8c1.1-2.4 3.2-4.1 5.7-4.7 1.2-.3 2.6-.1 3.8.7"
        fill="none"
        stroke={p.stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 13.6h6.8c1.2 0 2.2 1 2.2 2.2v.2H8.4c-1.4 0-2.6-1-2.6-2.4Z"
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </>
  ),
  check: (p: Paint) => (
    <path d="M4.5 10.2 8.4 14l7-8" fill="none" stroke={p.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  /** 个体支持性：一群点收敛到一条线 */
  adaptation: (p: Paint) => (
    <>
      <circle cx="4.6" cy="5.4" r="1.4" fill={p.stroke} opacity="0.45" />
      <circle cx="4.6" cy="10" r="1.4" fill={p.stroke} opacity="0.45" />
      <circle cx="4.6" cy="14.6" r="1.4" fill={p.stroke} opacity="0.45" />
      <path d="M7 5.6 13.4 9.4M7 10h6.4M7 14.4l6.4-3.8" fill="none" stroke={p.stroke} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.4" cy="10" r="2.4" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
    </>
  ),
  /** 无线采集：头戴 + 无线波 */
  wireless: (p: Paint) => (
    <>
      <path d="M4.4 12.4a5.6 5.6 0 0 1 11.2 0" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.4 12.4h1.4v3.2H3.4zM15.2 12.4h1.4v3.2h-1.4z" fill={p.stroke} />
      <path d="M8 5.4a4.6 4.6 0 0 1 4 0" fill="none" stroke={p.stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.6 3.2a7.6 7.6 0 0 1 6.8 0" fill="none" stroke={p.stroke} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  /** 采集形态：头部不戴任何东西，感知来自外围 */
  acquisition: (p: Paint) => (
    <>
      <circle cx="10" cy="10" r="4.2" fill={p.fill} stroke={p.stroke} strokeWidth="1.8" />
      <circle cx="10" cy="2.6" r="1.3" fill={p.stroke} />
      <circle cx="16.4" cy="13.4" r="1.3" fill={p.stroke} />
      <circle cx="3.6" cy="13.4" r="1.3" fill={p.stroke} />
      <path
        d="M10 4.4V4M14.6 12.4l.4-.2M5.4 12.4l-.4-.2"
        fill="none"
        stroke={p.stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="1.6 1.6"
      />
    </>
  ),
  /** 伦理：盾牌 + 勾 */
  shield: (p: Paint) => (
    <>
      <path d="M10 3.2 15.4 5.4v4c0 3.2-2.2 5.9-5.4 7-3.2-1.1-5.4-3.8-5.4-7v-4Z" fill={p.fill} stroke={p.stroke} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7.6 9.8 9.3 11.5l3.3-3.6" fill="none" stroke={p.stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
} satisfies Record<string, (paint: Paint) => ReactNode>

export type IconName = keyof typeof ICONS

export function AppIcon({ name, active }: { name: IconName; active?: boolean }) {
  const paint: Paint = {
    stroke: active ? 'var(--tone-cyan-deep)' : 'var(--text-muted)',
    fill: active ? 'rgba(79, 182, 230, 0.12)' : 'transparent',
  }

  return (
    <svg viewBox="0 0 20 20" className="app-icon" aria-hidden="true">
      {ICONS[name](paint)}
    </svg>
  )
}
