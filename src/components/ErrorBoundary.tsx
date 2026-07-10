import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * 演示现场的兜底：任何子树抛错都只降级该子树，而不是白屏整个应用。
 * 典型触发场景是评委电脑禁用了硬件加速 / WebGL 被驱动黑名单拦截。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('组件渲染异常，已降级显示：', error, info.componentStack)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

export function AppCrashFallback() {
  return (
    <div className="crash-fallback">
      <div className="crash-card">
        <p className="section-kicker">演示异常</p>
        <h3>页面渲染出错</h3>
        <p>可尝试刷新页面；若持续出现，请改用较新版本的 Chrome / Edge 打开。</p>
        <button type="button" className="primary-button" onClick={() => window.location.reload()}>
          刷新重试
        </button>
      </div>
    </div>
  )
}
