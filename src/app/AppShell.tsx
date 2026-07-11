import { SCREENS, TABS, type RouteId } from './navigation'
import { AppIcon } from '../components/ui/Icon'
import { StatusBar } from '../components/ui/StatusBar'
import { useNav } from '../hooks/useNavigation'
import { useDemo } from '../features/demo/DemoContext'
import type { useSsvepController } from '../hooks/useSsvepController'
import type { useAdaptationController } from '../hooks/useAdaptationController'

import { HomeScreen } from '../features/home/HomeScreen'
import { DemoScreen } from '../features/demo/DemoScreen'
import { SsvepScreen } from '../features/ssvep/SsvepScreen'
import { ReportScreen } from '../features/report/ReportScreen'
import { SystemScreen } from '../features/system/SystemScreen'
import { AdaptationScreen } from '../features/adaptation/AdaptationScreen'
import { WirelessScreen } from '../features/wireless/WirelessScreen'
import { EthicsScreen } from '../features/ethics/EthicsScreen'

type ShellProps = {
  ssvep: ReturnType<typeof useSsvepController>
  adapt: ReturnType<typeof useAdaptationController>
}

export function AppShell({ ssvep, adapt }: ShellProps) {
  const { activeTab, detail, current, direction, canGoBack, go, back } = useNav()
  const { sessionStatus } = useDemo()

  const routeId: RouteId = detail ?? activeTab

  return (
    <div className="mobile-shell-wrap">
      <div className="mobile-shell">
        <header className="app-header">
          <StatusBar />

          {canGoBack ? (
            <div className="detail-header">
              <button type="button" className="back-button" onClick={back} aria-label="返回">
                ‹
              </button>
              <div className="detail-header-copy">
                <h1>{current.title}</h1>
                {current.kind === 'detail' ? <p>{current.subtitle}</p> : null}
              </div>
            </div>
          ) : (
            <>
              <div className="app-header-top">
                <p className="eyebrow">脑机接口 · 多模态光电 · 机械臂 · 触觉反馈</p>
                <span className="live-indicator">
                  <span className="live-dot" />
                  闭环运行中
                </span>
              </div>
              <h1>脑机协同康复机械臂闭环可视化系统</h1>
              <div className="session-strip">
                <span>当前状态</span>
                <strong>{sessionStatus}</strong>
              </div>
            </>
          )}
        </header>

        <div className="screen-area">
          {/*
            必须直接写出元素类型，不能用 `const Screen = map[routeId]` 那种在渲染里现建的注册表：
            每次渲染都会得到新的函数标识，React 会把整个屏幕子树卸载重挂 ——
            而 waveTick 每 180ms 触发一次重渲染，RobotArm3D 会因此不断新建 WebGL context 直到耗尽。
          */}
          <div key={routeId} className={`screen-stage direction-${direction}`}>
            {routeId === 'home' && <HomeScreen />}
            {routeId === 'demo' && <DemoScreen />}
            {routeId === 'ssvep' && <SsvepScreen ssvep={ssvep} />}
            {routeId === 'report' && <ReportScreen />}
            {routeId === 'system' && <SystemScreen />}
            {routeId === 'adaptation' && <AdaptationScreen adapt={adapt} />}
            {routeId === 'wireless' && <WirelessScreen />}
            {routeId === 'ethics' && <EthicsScreen />}
          </div>
        </div>

        <nav className="bottom-tab-bar" aria-label="底部导航" style={{ ['--tab-count' as string]: TABS.length }}>
          {TABS.map((tab) => {
            // 处于详情页时，底部仍高亮它所属的 tab —— 标准的 hub-detail 行为
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} type="button" className={`bottom-tab ${isActive ? 'active' : ''}`} onClick={() => go(tab.id)}>
                <span className="tab-icon-chip">
                  <AppIcon name={SCREENS[tab.id].icon} active={isActive} />
                </span>
                <span>{tab.label}</span>
                <small>{tab.shortLabel}</small>
              </button>
            )
          })}
          <span className="home-indicator" aria-hidden="true" />
        </nav>
      </div>
    </div>
  )
}
