import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  SCREENS,
  detailMeta,
  parseLocation,
  writeLocation,
  type DetailId,
  type NavState,
  type RouteId,
  type ScreenDirection,
  type ScreenMeta,
  type TabId,
} from '../app/navigation'

export type NavApi = {
  activeTab: TabId
  detail: DetailId | null
  current: ScreenMeta
  direction: ScreenDirection
  canGoBack: boolean
  go: (tab: TabId) => void
  push: (detail: DetailId) => void
  open: (route: RouteId) => void
  back: () => void
}

const NavCtx = createContext<NavApi | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavState>(parseLocation)
  const [direction, setDirection] = useState<ScreenDirection>('forward')
  /** 地址栏回写由用户导航触发；popstate 引起的 setState 不该再写回去 */
  const skipWrite = useRef(true)

  useEffect(() => {
    if (skipWrite.current) {
      skipWrite.current = false
      return
    }
    writeLocation(state)
  }, [state])

  useEffect(() => {
    const onPop = () => {
      skipWrite.current = true
      setDirection('backward')
      setState(parseLocation())
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onPop)
    }
  }, [])

  const go = useCallback((tab: TabId) => {
    setState((prev) => {
      const order = Object.keys(SCREENS) as RouteId[]
      setDirection(order.indexOf(tab) >= order.indexOf(prev.tab) ? 'forward' : 'backward')
      return { tab, detail: null }
    })
  }, [])

  const push = useCallback((detail: DetailId) => {
    setDirection('forward')
    setState({ tab: detailMeta(detail).parent, detail })
  }, [])

  const back = useCallback(() => {
    setDirection('backward')
    setState((prev) => (prev.detail ? { tab: prev.tab, detail: null } : prev))
  }, [])

  const open = useCallback(
    (route: RouteId) => {
      const meta = SCREENS[route]
      if (meta.kind === 'detail') {
        push(meta.id)
      } else {
        go(meta.id)
      }
    },
    [go, push],
  )

  const api = useMemo<NavApi>(
    () => ({
      activeTab: state.tab,
      detail: state.detail,
      current: SCREENS[state.detail ?? state.tab],
      direction,
      canGoBack: state.detail !== null,
      go,
      push,
      open,
      back,
    }),
    [state, direction, go, push, open, back],
  )

  return <NavCtx.Provider value={api}>{children}</NavCtx.Provider>
}

export function useNav(): NavApi {
  const ctx = useContext(NavCtx)
  if (!ctx) {
    throw new Error('useNav 必须在 NavProvider 内使用')
  }
  return ctx
}
