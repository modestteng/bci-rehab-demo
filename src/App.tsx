import { AppShell } from './components/screens'
import { AppCrashFallback, ErrorBoundary } from './components/ErrorBoundary'
import { useDemoController } from './hooks/useDemoController'
import { useSsvepController } from './hooks/useSsvepController'

function App() {
  const demo = useDemoController()
  const ssvep = useSsvepController(demo.activeTab === 'ssvep')

  return (
    <ErrorBoundary fallback={<AppCrashFallback />}>
      <AppShell demo={demo} ssvep={ssvep} />
    </ErrorBoundary>
  )
}

export default App
