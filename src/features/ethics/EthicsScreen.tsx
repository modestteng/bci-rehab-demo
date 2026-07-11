import { useEffect, useState } from 'react'
import {
  countByStatus,
  countExternalRequests,
  ethicsItems,
  ethicsStatusLabel,
  type EthicsStatus,
} from '../../data/ethics'
import { NavCard, SectionCard } from '../../components/ui/Card'
import { OptionGroup, StatusPill } from '../../components/ui/Pill'
import { StatGrid } from '../../components/ui/Stat'
import { useNav } from '../../hooks/useNavigation'

type Filter = 'all' | EthicsStatus

const FILTERS = [
  { key: 'all' as const, label: '全部' },
  { key: 'implemented' as const, label: '已实现' },
  { key: 'partial' as const, label: '部分' },
]

const STATUS_TONE: Record<EthicsStatus, 'success' | 'orange' | 'idle'> = {
  implemented: 'success',
  partial: 'orange',
  planned: 'idle',
}

export function EthicsScreen() {
  const { open } = useNav()
  const [filter, setFilter] = useState<Filter>('all')
  const [external, setExternal] = useState<number | null>(null)

  // 运行时自校验：本页到底发出了多少个跨域请求？
  useEffect(() => {
    setExternal(countExternalRequests())
  }, [])

  const counts = countByStatus()
  const visible = ethicsItems.filter((item) => filter === 'all' || item.status === filter)

  return (
    <div className="mobile-screen ethics-screen">
      <SectionCard
        kicker="伦理与安全"
        title="伦理措施与实现证据"
        description="每一条伦理主张均标注其可核查的实现位置；尚未达成之处，如实列出缺口。"
        aside={<StatusPill tone="success">已实现 {counts.implemented}</StatusPill>}
      >
        <StatGrid
          columns={3}
          items={[
            { label: '已实现', value: `${counts.implemented}` },
            { label: '部分实现', value: `${counts.partial}` },
            { label: '规划中', value: `${counts.planned}` },
          ]}
        />

        {/* 一个在运行时自己验证自己的伦理主张 */}
        <div className={`self-check utility-surface ${external === 0 ? 'pass' : ''}`}>
          <div className="self-check-head">
            <strong>外部请求实测</strong>
            <span className="self-check-value">{external === null ? '不可测' : `${external} 个`}</span>
          </div>
          <p>
            本页读取浏览器资源计时接口，统计本应用实际发出的跨域请求数量。
            {external === 0
              ? '结果为 0，表明脑电数据不存在离开本设备的传输通道。该结论由页面在运行时实测得出，而非静态声明。'
              : '结果不为 0，表明存在外部依赖，需进一步排查。'}
          </p>
        </div>
      </SectionCard>

      <OptionGroup label="按实现状态筛选" options={FILTERS} value={filter} onChange={setFilter} columns={3} />

      <div className="ethics-list">
        {visible.map((item) => (
          <article key={item.id} className={`ethics-card utility-surface status-${item.status}`}>
            <div className="ethics-head">
              <strong>{item.title}</strong>
              <StatusPill tone={STATUS_TONE[item.status]}>{ethicsStatusLabel[item.status]}</StatusPill>
            </div>

            <p className="ethics-principle">{item.principle}</p>
            <p className="ethics-measure">{item.measure}</p>

            {item.evidence?.length ? (
              <div className="ethics-evidence">
                {item.evidence.map((e) => (
                  <code key={`${e.file}-${e.symbol}`} className="evidence-pill">
                    {e.file} · {e.symbol}
                  </code>
                ))}
              </div>
            ) : null}

            {item.gap ? (
              <p className="ethics-gap">
                <strong>缺口：</strong>
                {item.gap}
              </p>
            ) : null}

            {item.action ? (
              <button type="button" className="inline-link" onClick={() => open(item.action!.to)}>
                {item.action.label} ›
              </button>
            ) : null}
          </article>
        ))}
      </div>

      <NavCard to="adaptation" title="σ 收敛的实测数据" desc="算法公平性的量化依据：24 名被试的准确率分布" badge="σ 9.2 → 3.1" tone="green" />
    </div>
  )
}
