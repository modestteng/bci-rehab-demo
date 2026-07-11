import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CardKey } from '../design/tokens'

type CollapseApi = {
  isOpen: (key: CardKey) => boolean
  toggle: (key: CardKey) => void
  collapseAll: () => void
}

const CollapseCtx = createContext<CollapseApi | null>(null)

/**
 * 折叠卡片状态。从 useDemoController 里抽出来独立成 Context ——
 * 原先 SsvepScreen 只是为了拿 openCards 就必须接收整个 demo controller。
 */
export function CollapseProvider({ children, defaultOpen = [] }: { children: ReactNode; defaultOpen?: CardKey[] }) {
  const [open, setOpen] = useState<Partial<Record<CardKey, boolean>>>(() =>
    Object.fromEntries(defaultOpen.map((key) => [key, true])),
  )

  const api = useMemo<CollapseApi>(
    () => ({
      isOpen: (key) => Boolean(open[key]),
      toggle: (key) => setOpen((cards) => ({ ...cards, [key]: !cards[key] })),
      collapseAll: () => setOpen({}),
    }),
    [open],
  )

  return <CollapseCtx.Provider value={api}>{children}</CollapseCtx.Provider>
}

export function useCollapse(): CollapseApi {
  const ctx = useContext(CollapseCtx)
  if (!ctx) {
    throw new Error('useCollapse 必须在 CollapseProvider 内使用')
  }
  return ctx
}
