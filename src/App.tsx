import { AppShell } from './app/AppShell'
import { AppCrashFallback, ErrorBoundary } from './components/ErrorBoundary'
import { DemoProvider } from './features/demo/DemoContext'
import { CollapseProvider } from './hooks/useCollapse'
import { NavProvider, useNav } from './hooks/useNavigation'
import { useAdaptationController } from './hooks/useAdaptationController'
import { useDemoController } from './hooks/useDemoController'
import { useSsvepController } from './hooks/useSsvepController'

function AppBody() {
  const nav = useNav()
  const demo = useDemoController(nav)
  // 与既有约定一致：只有该屏幕激活时才让它的定时器跑
  const ssvep = useSsvepController(nav.activeTab === 'ssvep' && nav.detail === null)
  const adapt = useAdaptationController(nav.detail === 'adaptation')

  return (
    <DemoProvider value={demo}>
      <AppShell ssvep={ssvep} adapt={adapt} />
    </DemoProvider>
  )
}

function App() {
  return (
    <ErrorBoundary fallback={<AppCrashFallback />}>
      <NavProvider>
        <CollapseProvider defaultOpen={['home-kpi']}>
          <AppBody />
        </CollapseProvider>
      </NavProvider>
    </ErrorBoundary>
  )
}

export default App
