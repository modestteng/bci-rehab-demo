import { createContext, useContext, type ReactNode } from 'react'
import type { useDemoController } from '../../hooks/useDemoController'

export type DemoController = ReturnType<typeof useDemoController>

const DemoCtx = createContext<DemoController | null>(null)

export function DemoProvider({ value, children }: { value: DemoController; children: ReactNode }) {
  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>
}

/**
 * 面板从 Context 取自己需要的字段，注册表因此可以保持干净的 ComponentType（零 props）。
 * 同一时刻只挂载一个面板，Context 的「所有消费者一起重渲染」在这里不成问题。
 */
export function useDemo(): DemoController {
  const ctx = useContext(DemoCtx)
  if (!ctx) {
    throw new Error('useDemo 必须在 DemoProvider 内使用')
  }
  return ctx
}
