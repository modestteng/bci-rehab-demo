import { CollapseCard, NavCard, SectionCard } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Pill'
import { AppIcon } from '../../components/ui/Icon'
import { FeedbackTile, StatGrid } from '../../components/ui/Stat'
import { useDemo } from '../demo/DemoContext'
import { REPORT_LABEL, REPORT_TONE } from './reportState'

export function ReportScreen() {
  const { reportState, selectedIntent, reportMetrics, profile, lastExportNote, handleStartDemo, handleExport } = useDemo()

  const exportLabel = reportState === 'exporting' ? '导出中...' : reportState === 'exported' ? '已导出' : '导出报告'

  return (
    <div className="mobile-screen report-screen">
      <SectionCard
        kicker="报告 / 记录"
        title="当前训练会话报告"
        description="汇总本次训练的时长、完成次数、精度指标与疲劳变化，并给出下一轮训练建议。"
        aside={<StatusPill tone={REPORT_TONE[reportState]}>{REPORT_LABEL[reportState]}</StatusPill>}
      >
        <div className="report-hero-card surface-hero">
          <p className="section-kicker">最近一次会话</p>
          <h3>{selectedIntent} 意图闭环演示报告</h3>
          <p>{profile.report.recommendation}</p>
          <div className="hero-actions-grid two-actions">
            <button type="button" className="secondary-button" onClick={handleStartDemo}>
              重新演示
            </button>
            <button type="button" className="primary-button" onClick={handleExport} disabled={reportState === 'exporting'}>
              {exportLabel}
            </button>
          </div>
        </div>

        <StatGrid items={reportMetrics} />

        <CollapseCard id="report-detail" kicker="明细" title="核心指标明细" summary={`准确率 ${profile.report.accuracy}`}>
          <div className="feedback-column">
            <FeedbackTile label="意图识别准确率" value={88} tone="green" detail={profile.report.accuracy} />
            <FeedbackTile label="控制精度误差" value={76} tone="cyan" detail={profile.report.precision} />
            <FeedbackTile label="抓握力度误差" value={70} tone="orange" detail={profile.report.gripError} />
          </div>
        </CollapseCard>

        {lastExportNote ? (
          <div className="inline-note success-note">
            <span className="success-icon-chip">
              <AppIcon name="check" active />
            </span>
            <span>{lastExportNote}</span>
          </div>
        ) : null}
      </SectionCard>

      <NavCard
        to="adaptation"
        title="本次反馈已更新个体权重"
        desc="单次训练会话的闭环结果，回流至长期奖励记忆"
        badge="88% 的出处"
        tone="green"
      />
    </div>
  )
}
