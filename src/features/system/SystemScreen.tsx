import { algorithmBadges, architectureLayers, opticalCards } from '../../data/scenario'
import { buildCohort, summarize } from '../../data/adaptation'
import { LATENCY_TOTAL, WIRELESS_SHARE, latencyBudget } from '../../data/wireless'
import { countByStatus } from '../../data/ethics'
import { CollapseCard, NavCard, SectionCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Pill'
import { StatGrid } from '../../components/ui/Stat'
import { useDemo } from '../demo/DemoContext'
import { REPORT_LABEL } from '../report/reportState'

const stats = summarize(buildCohort())
const ethicsCount = countByStatus()

export function SystemScreen() {
  const { activeSensor, currentStage, sessionStatus, reportState } = useDemo()

  return (
    <div className="mobile-screen system-screen">
      <SectionCard kicker="系统 / 技术" title="技术结构与扩展能力" description="下面三项是本系统的核心能力，点开可进入各自的完整模块。">
        <div className="system-summary-card utility-surface">
          <StatGrid
            variant="chip"
            items={[
              { label: '主校验通道', value: activeSensor, tone: 'cyan' },
              { label: '当前阶段', value: currentStage ?? '待启动', tone: 'violet' },
              { label: '系统状态', value: sessionStatus, tone: 'green' },
              { label: '报告状态', value: REPORT_LABEL[reportState], tone: 'orange' },
            ]}
          />
        </div>
      </SectionCard>

      {/* 原先这里是三张「未来能力」死文案卡，现在是三个活模块的入口 */}
      <div className="nav-card-list">
        <NavCard
          to="adaptation"
          title="个体支持性与奖励记忆"
          desc={`群体先验 → 个体自适应，跨被试标准差 ${stats.generic.std.toFixed(1)}% → ${stats.adaptive.std.toFixed(1)}%`}
          badge={`σ ↓${Math.round((1 - stats.adaptive.std / stats.generic.std) * 100)}%`}
          tone="green"
        />
        <NavCard
          to="wireless"
          title="无线采集与范式形态"
          desc={`${LATENCY_TOTAL}ms 端到端延迟由 ${latencyBudget.length} 段构成，无线链路占 ${Math.round(WIRELESS_SHARE * 100)}%`}
          badge={`${LATENCY_TOTAL}ms`}
          tone="violet"
        />
        <NavCard
          to="ethics"
          title="伦理与安全"
          desc="每条主张都指向可核查的代码，缺口也如实写出"
          badge={`已实现 ${ethicsCount.implemented} · 部分 ${ethicsCount.partial}`}
          tone="cyan"
        />
      </div>

      <CollapseCard id="system-optical" kicker="感知" title="光电模组" summary={`主通道 ${activeSensor}`}>
        <div className="accordion-list compact-list">
          {opticalCards.map((sensor) => (
            <article key={sensor.key} className={`feature-card ${activeSensor === sensor.key ? 'selected system-selected-card' : ''}`}>
              <strong>{sensor.title}</strong>
              <p>{sensor.detail}</p>
              <span>{sensor.metric}</span>
            </article>
          ))}
        </div>
        <div className="chip-scroll-row">
          {algorithmBadges.map((badge) => (
            <Badge key={badge} tone="cyan">
              {badge}
            </Badge>
          ))}
        </div>
      </CollapseCard>

      <CollapseCard id="system-arch" kicker="架构" title="技术架构" summary="感知 → 意图 → 决策 → 反馈">
        <div className="accordion-list compact-list">
          {architectureLayers.map((layer) => (
            <article key={layer.title} className="architecture-card compact-card utility-surface">
              <h4>{layer.title}</h4>
              <ul>
                {layer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </CollapseCard>
    </div>
  )
}
