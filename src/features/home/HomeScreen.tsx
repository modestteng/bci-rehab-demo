import { kpis } from '../../data/scenario'
import { WIRELESS_SHARE } from '../../data/wireless'
import { CollapseCard, NavCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Pill'
import { StatGrid, type StatItem } from '../../components/ui/Stat'
import type { IconName } from '../../components/ui/Icon'
import { useNav } from '../../hooks/useNavigation'
import { useDemo } from '../demo/DemoContext'
import { REPORT_LABEL, REPORT_TONE } from '../report/reportState'

const KPI_ICONS: IconName[] = ['brain', 'latency', 'precision', 'force']

export function HomeScreen() {
  const { go, push } = useNav()
  const { selectedIntent, activeSensor, profile, robotAction, currentStage, reportState, handleStartDemo, handleGenerateReport, handleReset } =
    useDemo()

  // 4 个 KPI 里有 2 个可以下钻 —— 点开那个孤零零的数字，看到它的出处
  const kpiItems: StatItem[] = kpis.map((kpi, index) => ({
    label: kpi.label,
    value: kpi.value,
    target: kpi.target,
    hint: kpi.delta,
    icon: KPI_ICONS[index],
    onClick:
      index === 0 ? () => push('adaptation') : index === 1 ? () => push('wireless') : undefined,
  }))

  return (
    <div className="mobile-screen home-screen">
      <section className="mobile-hero-card surface-hero">
        <span className="panel-tag">七环节康复训练闭环</span>
        <h2>脑机协同康复训练，一屏完成闭环演示。</h2>
        <p>脑电模拟 → 意图识别 → 光电校验 → AI 决策 → 机器人响应 → 触觉反馈 → 训练报告。</p>
        <StatGrid
          columns={3}
          variant="trust"
          items={[
            { label: '识别准确率', value: kpis[0].value, hint: '24 人均值' },
            { label: '平均延迟', value: kpis[1].value, hint: '5 段可拆解' },
            { label: '控制精度', value: kpis[2].value, hint: '轨迹误差可控' },
          ]}
        />
        <div className="hero-actions-grid">
          <button type="button" className="primary-button" onClick={handleStartDemo}>
            开始演示
          </button>
          <button type="button" className="secondary-button" onClick={() => go('demo')}>
            进入训练
          </button>
          <button type="button" className="secondary-button" onClick={() => go('report')}>
            查看报告
          </button>
          <button type="button" className="ghost-button" onClick={handleReset}>
            重置状态
          </button>
        </div>
      </section>

      <CollapseCard id="home-kpi" kicker="比赛指标" title="关键指标" summary="4 项全部达标 · 2 项可下钻">
        <StatGrid variant="metric" items={kpiItems} />
        <span className="metric-note">带 › 的指标可点开，看它是怎么来的。</span>
      </CollapseCard>

      <div className="nav-card-list">
        <NavCard
          to="adaptation"
          title="个体支持性"
          desc="群体先验 → 个体自适应，跨被试方差收敛"
          badge="σ 9.2 → 3.1"
          tone="green"
        />
        <NavCard
          to="wireless"
          title="无线采集与范式形态"
          desc={`176ms 延迟预算 · 无线链路占 ${Math.round(WIRELESS_SHARE * 100)}%`}
          badge="8 通道"
          tone="violet"
        />
        <NavCard to="ethics" title="伦理与安全" desc="每条主张都指向可核查的代码" tone="cyan" />
      </div>

      <CollapseCard id="home-status" kicker="当前会话" title="闭环状态摘要" summary={currentStage ?? '待启动'}>
        <StatGrid
          variant="chip"
          items={[
            { label: '当前意图', value: selectedIntent, tone: 'violet' },
            { label: '主校验通道', value: activeSensor, tone: 'cyan' },
            { label: '安全状态', value: profile.safetyCheck, tone: 'green' },
            { label: '当前动作', value: robotAction, tone: 'orange' },
          ]}
        />
        <div className="compact-loop-panel utility-surface">
          <p className="section-helper">当前闭环阶段</p>
          <strong>{currentStage ?? '待启动'}</strong>
          <div className="compact-loop-tags">
            <Badge tone="violet">EEG</Badge>
            <Badge tone="cyan">ToF</Badge>
            <Badge tone="green">过力保护</Badge>
            <Badge tone={REPORT_TONE[reportState] === 'success' ? 'green' : 'magenta'}>
              报告{REPORT_LABEL[reportState]}
            </Badge>
          </div>
          <button type="button" className="ghost-button compact-button" onClick={handleGenerateReport}>
            直接生成报告
          </button>
        </div>
      </CollapseCard>
    </div>
  )
}
