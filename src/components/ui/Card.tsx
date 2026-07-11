import type { ReactNode } from 'react'
import type { CardKey, Tone } from '../../design/tokens'
import { SCREENS, type RouteId } from '../../app/navigation'
import { useCollapse } from '../../hooks/useCollapse'
import { useNav } from '../../hooks/useNavigation'
import { AppIcon, type IconName } from './Icon'

type SectionCardProps = {
  kicker: string
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, kicker, description, aside, children, className }: SectionCardProps) {
  return (
    <article className={`panel mobile-panel ${className ?? ''}`.trim()}>
      <div className="panel-header mobile-panel-header">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h3>{title}</h3>
          {description ? <p className="section-helper">{description}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </article>
  )
}

type CollapseCardProps = {
  /** 类型安全的折叠 id，取代原先写两遍的魔法字符串 */
  id: CardKey
  kicker?: string
  title: string
  summary?: string
  children: ReactNode
}

export function CollapseCard({ id, kicker, title, summary, children }: CollapseCardProps) {
  const { isOpen, toggle } = useCollapse()
  const open = isOpen(id)

  return (
    <article className={`collapse-card ${open ? 'open' : ''}`}>
      <button type="button" className="collapse-toggle" onClick={() => toggle(id)} aria-expanded={open}>
        <span className="collapse-copy">
          {kicker ? <span className="section-kicker">{kicker}</span> : null}
          <span className="collapse-title">{title}</span>
        </span>
        <span className="collapse-meta">
          {summary ? <span className="collapse-summary">{summary}</span> : null}
          <span className={`accordion-chevron ${open ? 'open' : ''}`}>⌄</span>
        </span>
      </button>
      <div className={`fold-wrap ${open ? 'open' : ''}`}>
        <div className="fold-inner collapse-body">{children}</div>
      </div>
    </article>
  )
}

type NavCardProps = {
  /** 类型安全：写错路由 id 直接编译期报错 */
  to: RouteId
  title?: string
  desc?: string
  badge?: string
  icon?: IconName
  tone?: Tone
}

/** 跨模块跳转卡。系统页的三张死文案卡换成它之后就是导航中枢。 */
export function NavCard({ to, title, desc, badge, icon, tone = 'cyan' }: NavCardProps) {
  const { open } = useNav()
  const meta = SCREENS[to]
  const label = title ?? meta.title
  const detail = desc ?? (meta.kind === 'detail' ? meta.subtitle : '')

  return (
    <button type="button" className={`nav-card utility-surface tone-${tone}`} onClick={() => open(to)}>
      <span className="nav-card-icon">
        <AppIcon name={icon ?? meta.icon} active />
      </span>
      <span className="nav-card-copy">
        <strong>{label}</strong>
        {detail ? <span>{detail}</span> : null}
      </span>
      {badge ? <span className="nav-card-badge">{badge}</span> : null}
      <span className="nav-card-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
}

/** 详情页底部的「接下来看」交叉跳转 */
export function NextLinks({ routes }: { routes: RouteId[] }) {
  if (routes.length === 0) {
    return null
  }
  return (
    <SectionCard kicker="接下来" title="相关内容">
      <div className="nav-card-list">
        {routes.map((route) => (
          <NavCard key={route} to={route} />
        ))}
      </div>
    </SectionCard>
  )
}
