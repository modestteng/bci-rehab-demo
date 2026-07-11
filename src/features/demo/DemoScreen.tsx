import { useEffect, useRef } from 'react'
import { stageDetails, stages } from '../../data/scenario'
import { SectionCard } from '../../components/ui/Card'
import { OptionGroup, StatusPill } from '../../components/ui/Pill'
import { useDemo } from './DemoContext'
import { STATUS_TEXT, STATUS_TONE, stagePanels, stageStatus } from './stagePanels'

const MODES = [
  { key: 'auto' as const, label: '自动演示' },
  { key: 'manual' as const, label: '手动讲解' },
]

export function DemoScreen() {
  const {
    demoMode,
    setDemoMode,
    activeStageIndex,
    expandedStepIndex,
    progressValue,
    reportState,
    handleStartDemo,
    handleManualNext,
    handleReset,
    handleStepExpand,
  } = useDemo()

  const stepRefs = useRef<(HTMLElement | null)[]>([])
  const nextLabel = activeStageIndex >= stages.length - 1 ? '生成报告' : '下一步'

  // 展开某一步后滚动到它。等折叠动画结束再滚，否则会滚到旧位置。
  useEffect(() => {
    const target = expandedStepIndex <= 0 ? null : stepRefs.current[expandedStepIndex]

    if (!target) {
      document.querySelector('.screen-area')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const fold = target.querySelector('.fold-wrap')
    const scroll = () => target.scrollIntoView({ behavior: 'smooth', block: 'start' })

    fold?.addEventListener('transitionend', scroll, { once: true })
    const fallback = window.setTimeout(scroll, 420)

    return () => {
      fold?.removeEventListener('transitionend', scroll)
      window.clearTimeout(fallback)
    }
  }, [expandedStepIndex])

  return (
    <div className="mobile-screen demo-screen">
      <SectionCard
        kicker="训练 / 闭环演示"
        title="7 步闭环训练演示"
        description="自动模式可完整演示，手动模式适合答辩逐步讲解。"
        aside={<StatusPill tone={reportState === 'generating' ? 'active' : 'cyan'}>进度 {Math.round(progressValue)}%</StatusPill>}
      >
        <OptionGroup label="演示模式" options={MODES} value={demoMode} onChange={setDemoMode} size="lg" />
        <div className="hero-actions-grid two-actions">
          <button type="button" className="primary-button" onClick={handleStartDemo}>
            开始训练
          </button>
          <button type="button" className="secondary-button" onClick={demoMode === 'manual' ? handleManualNext : handleReset}>
            {demoMode === 'manual' ? nextLabel : '重置'}
          </button>
        </div>
      </SectionCard>

      <div className="accordion-list">
        {stages.map((stage, index) => {
          const expanded = expandedStepIndex === index
          const status = stageStatus(index, activeStageIndex)
          const { Panel, keepMounted } = stagePanels[stage]

          return (
            <article
              key={stage}
              ref={(el) => {
                stepRefs.current[index] = el
              }}
              id={`step-card-${index}`}
              className={`accordion-card ${expanded ? 'expanded' : ''} ${status === 'done' ? 'done' : ''} ${status === 'locked' ? 'locked' : ''}`}
            >
              <button
                type="button"
                className="accordion-toggle"
                onClick={() => handleStepExpand(index)}
                disabled={status === 'locked'}
                aria-expanded={expanded}
              >
                <div className="accordion-header">
                  <div className="accordion-index">0{index + 1}</div>
                  <div className="accordion-copy">
                    <h3>{stage}</h3>
                    <p>{stageDetails[stage].label}</p>
                  </div>
                  <div className="accordion-header-meta">
                    <StatusPill tone={STATUS_TONE[status]}>{STATUS_TEXT[status]}</StatusPill>
                    <span className={`accordion-chevron ${expanded ? 'open' : ''}`}>⌄</span>
                  </div>
                </div>
              </button>

              <div className={`fold-wrap ${expanded ? 'open' : ''}`}>
                <div className="fold-inner accordion-body">
                  <p className="section-helper">{stageDetails[stage].helper}</p>
                  <span className="metric-note">{stageDetails[stage].metric}</span>
                  {expanded || keepMounted ? <Panel /> : null}
                </div>
              </div>

              {expanded ? null : (
                <div className="accordion-summary-row">
                  <span>
                    {status === 'done'
                      ? stageDetails[stage].metric
                      : status === 'locked'
                        ? '待前一环节完成后解锁'
                        : '点击展开当前步骤详情'}
                  </span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
