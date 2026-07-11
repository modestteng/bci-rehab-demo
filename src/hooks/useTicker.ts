import { useEffect, useState } from 'react'

/**
 * 动画驱动心跳。enabled 为 false 时不建定时器 —— 看不见的东西不该驱动重渲染。
 * 清理函数保证 StrictMode 下的双次调用是幂等的。
 */
export function useTicker(intervalMs: number, enabled: boolean) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const id = window.setInterval(() => {
      setTick((value) => value + 1)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [intervalMs, enabled])

  return tick
}
