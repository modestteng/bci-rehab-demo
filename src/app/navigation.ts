import type { IconName } from '../components/ui/Icon'

export const TAB_IDS = ['home', 'demo', 'ssvep', 'report', 'system'] as const
export const DETAIL_IDS = ['adaptation', 'wireless', 'acquisition', 'ethics'] as const

export type TabId = (typeof TAB_IDS)[number]
export type DetailId = (typeof DETAIL_IDS)[number]
export type RouteId = TabId | DetailId

export type NavState = { tab: TabId; detail: DetailId | null }
export type ScreenDirection = 'forward' | 'backward'

export type TabMeta = {
  kind: 'tab'
  id: TabId
  label: string
  shortLabel: string
  icon: IconName
  title: string
}

export type DetailMeta = {
  kind: 'detail'
  id: DetailId
  parent: TabId
  title: string
  subtitle: string
  icon: IconName
}

export type ScreenMeta = TabMeta | DetailMeta

/**
 * 屏幕元信息注册表 —— 唯一真相。
 * 取代原先必须手动同步的四处：appTabs / tabIcons / IconName 联合 / 5 路条件渲染。
 * 组件本身在 routes.tsx 里挂，避免 data 层反向依赖 UI。
 */
export const SCREENS: Record<RouteId, ScreenMeta> = {
  home: { kind: 'tab', id: 'home', label: '首页', shortLabel: '概览', icon: 'home', title: '概览' },
  demo: { kind: 'tab', id: 'demo', label: '训练', shortLabel: '闭环', icon: 'demo', title: '7 步闭环训练' },
  ssvep: { kind: 'tab', id: 'ssvep', label: '范式', shortLabel: 'SSVEP', icon: 'ssvep', title: 'SSVEP 范式' },
  report: { kind: 'tab', id: 'report', label: '报告', shortLabel: '记录', icon: 'report', title: '训练报告' },
  system: { kind: 'tab', id: 'system', label: '系统', shortLabel: '技术', icon: 'system', title: '技术结构' },

  adaptation: {
    kind: 'detail',
    id: 'adaptation',
    parent: 'system',
    title: '个体支持性',
    subtitle: '群体先验迁移 · 个体自适应校准 · 跨被试方差收敛',
    icon: 'adaptation',
  },
  wireless: {
    kind: 'detail',
    id: 'wireless',
    parent: 'system',
    title: '无线采集与范式形态',
    subtitle: '半干电极 · 8 通道 · 端到端时延预算',
    icon: 'wireless',
  },
  acquisition: {
    kind: 'detail',
    id: 'acquisition',
    parent: 'system',
    title: '范式与采集形态',
    subtitle: '范式三分 · 采集形态成熟度阶梯 · 多模态替代通道',
    icon: 'acquisition',
  },
  ethics: {
    kind: 'detail',
    id: 'ethics',
    parent: 'system',
    title: '伦理与安全',
    subtitle: '伦理措施与可核查的实现证据',
    icon: 'shield',
  },
}

export const TABS: TabMeta[] = TAB_IDS.map((id) => SCREENS[id] as TabMeta)

/** 详情页元信息的类型收窄取值。SCREENS 的值是联合类型，直接取 .parent 编译不过。 */
export function detailMeta(id: DetailId): DetailMeta {
  return SCREENS[id] as DetailMeta
}

function isTabId(value: unknown): value is TabId {
  return TAB_IDS.includes(value as TabId)
}

function isDetailId(value: unknown): value is DetailId {
  return DETAIL_IDS.includes(value as DetailId)
}

/**
 * 解析当前地址。优先读 hash（#/system/ethics），
 * 回落到旧的查询参数深链（?tab=demo&step=3），该形式在既有文档中已在使用，需保持向后兼容。
 */
export function parseLocation(): NavState {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash) {
    const [first, second] = hash.split('/')
    if (isDetailId(first)) {
      return { tab: (SCREENS[first] as DetailMeta).parent, detail: first }
    }
    if (isTabId(first)) {
      return { tab: first, detail: isDetailId(second) ? second : null }
    }
  }

  const tab = new URLSearchParams(window.location.search).get('tab')
  return { tab: isTabId(tab) ? tab : 'home', detail: null }
}

export function toHash(state: NavState): string {
  return state.detail ? `#/${state.tab}/${state.detail}` : `#/${state.tab}`
}

/**
 * 回写地址栏。必须容错：dist-single 是 file:// 打开的，
 * artifact 是 opaque-origin iframe —— 这两种环境下 pushState 会抛 SecurityError。
 */
export function writeLocation(state: NavState) {
  const next = toHash(state)
  if (window.location.hash === next) {
    return
  }

  try {
    window.history.pushState(null, '', next)
  } catch {
    try {
      window.location.hash = next
    } catch {
      // 极端受限环境下放弃回写，导航本身仍然可用
    }
  }
}
