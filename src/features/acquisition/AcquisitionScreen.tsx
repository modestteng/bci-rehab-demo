import { useState } from 'react'
import {
  ACQUISITION_CONCLUSION,
  ACQUISITION_VERDICT,
  CONTACTLESS_SHARE,
  DOF_BY_HUMAN,
  DOF_BY_ROBOT,
  DOF_TOTAL,
  DUAL_CHANNEL_RATIONALE,
  MODALITY_REDUNDANCY_NOTE,
  PARADIGM_NOTE,
  SHARED_AUTONOMY_NOTE,
  acquisitionTiers,
  buildMatrix,
  capFreeEegAvailable,
  capFreeSupportingActive,
  capFreeTiers,
  maturityLabel,
  maturityTone,
  modalities,
  paradigmClasses,
  type AcquisitionTier,
} from '../../data/acquisition'
import { CollapseCard, NavCard, SectionCard } from '../../components/ui/Card'
import { Badge, StatusPill } from '../../components/ui/Pill'
import { StatGrid } from '../../components/ui/Stat'
import { useNav } from '../../hooks/useNavigation'

const matrix = buildMatrix()

function supportChips(tier: AcquisitionTier) {
  if (tier.supports.length === 0) {
    return <span className="acq-support none">不支撑脑电控制范式</span>
  }
  return paradigmClasses
    .filter((p) => tier.supports.includes(p.key))
    .map((p) => (
      <span key={p.key} className={`acq-support tone-${p.tone}`}>
        {p.label}
      </span>
    ))
}

export function AcquisitionScreen() {
  // 范式卡跳转的是 demo / ssvep 等一级页签，而非详情页，故用 open 而非 push
  const { open } = useNav()
  const [tierKey, setTierKey] = useState<string>('dry-headset')
  const [capOn, setCapOn] = useState(true)

  const tier = acquisitionTiers.find((t) => t.key === tierKey) ?? acquisitionTiers[1]

  return (
    <div className="mobile-screen acquisition-screen">
      {/* ---------- 术语界定：两个正交维度 ---------- */}
      <SectionCard
        kicker="术语界定"
        title="「主动 / 被动」的两个维度"
        description="脑机接口领域的「主动 / 被动」存在两个彼此正交的含义。本页分别予以界定，并给出本系统在各维度上的位置。"
      >
        <div className="axis-split">
          <div className="axis-card utility-surface tone-violet">
            <span className="axis-tag">维度一 · 范式</span>
            <strong>解码何种脑活动</strong>
            <p>主动式 / 反应式 / 被动式，依 Zander &amp; Kothe (2011) 的三分法。</p>
          </div>
          <div className="axis-card utility-surface tone-cyan">
            <span className="axis-tag">维度二 · 采集形态</span>
            <strong>被试需佩戴何种设备</strong>
            <p>从湿电极脑电帽，到耳内电极，直至完全不采集脑电。</p>
          </div>
        </div>

        <div className="inline-note">
          <span>
            二者可自由组合：运动想象（<strong>主动式范式</strong>）可配耳内电极（<strong>免佩戴形态</strong>）；
            SSVEP（<strong>反应式范式</strong>）亦可配湿电极帽（<strong>需佩戴形态</strong>）。
            因此「免佩戴」与「被动式范式」分属不同维度，需分别论证。
          </span>
        </div>

        <div className="inline-note success-note">
          <span>{PARADIGM_NOTE}</span>
        </div>
      </SectionCard>

      {/* ---------- 维度一：范式三分 ---------- */}
      <SectionCard
        kicker="维度一 / 范式"
        title="范式三分与本系统的对应实现"
        description="本系统在三种范式上均有对应实现，构成完整的混合式脑机接口，可逐一跳转核验。"
        aside={<StatusPill tone="success">3 / 3 已实现</StatusPill>}
      >
        <div className="accordion-list compact-list">
          {paradigmClasses.map((p) => (
            <article key={p.key} className={`paradigm-card utility-surface tone-${p.tone}`}>
              <div className="paradigm-head">
                <strong>{p.label}</strong>
                <code>{p.en}</code>
              </div>
              <p className="paradigm-def">{p.definition}</p>
              <p className="paradigm-example">
                <span>典型范式</span>
                {p.example}
              </p>
              <p className="paradigm-impl">
                <span>本系统</span>
                {p.inThisSystem}
              </p>
              <button type="button" className="inline-link" onClick={() => open(p.to)}>
                查看实现 ›
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      {/* ---------- 维度二：采集形态阶梯 ---------- */}
      <SectionCard
        kicker="维度二 / 采集形态"
        title="采集形态成熟度阶梯"
        description="按被试的佩戴负担由高至低排列，逐级列出通道配置、信号质量、可支撑范式与技术成熟度。"
        aside={<StatusPill tone="cyan">{acquisitionTiers.length} 级</StatusPill>}
      >
        <div className="acq-ladder">
          {acquisitionTiers.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`acq-rung utility-surface ${tierKey === t.key ? 'active' : ''} ${t.current ? 'current' : ''}`}
              onClick={() => setTierKey(t.key)}
              aria-pressed={tierKey === t.key}
            >
              <span className="acq-rung-no">L{t.tier}</span>
              <span className="acq-rung-copy">
                <strong>{t.label}</strong>
                <span className="acq-rung-meta">
                  {t.wear} · {maturityLabel[t.maturity]}
                </span>
              </span>
              {t.current ? <span className="acq-current-tag">本系统</span> : null}
            </button>
          ))}
        </div>

        <article className="acq-detail utility-surface">
          <div className="acq-detail-head">
            <div>
              <p className="section-kicker">L{tier.tier}</p>
              <h4>{tier.label}</h4>
            </div>
            <Badge tone={maturityTone[tier.maturity]}>{maturityLabel[tier.maturity]}</Badge>
          </div>

          {/* 仅短值进 StatGrid —— 其 value 为大号强调位，长句会撑破版式 */}
          <StatGrid items={[{ label: '佩戴负担', value: tier.wear }, { label: '通道', value: tier.channels }]} />

          <p className="acq-rep">
            <span>准备耗时</span>
            {tier.prep}
          </p>
          <p className="acq-rep">
            <span>信号质量</span>
            {tier.signal}
          </p>

          <div className="acq-supports">
            <span className="acq-supports-label">可支撑的范式</span>
            <span className="acq-supports-row">{supportChips(tier)}</span>
          </div>

          <p className="acq-rep">
            <span>代表性方案</span>
            {tier.representative}
          </p>

          <div className="inline-note">
            <span>
              <strong>适用边界：</strong>
              {tier.boundary}
            </span>
          </div>
        </article>

        {/* 选型结论由数据计算得出 */}
        <div className="acq-verdict surface-hero">
          <p className="section-kicker">技术选型依据</p>
          <div className="acq-verdict-nums">
            <span className="acq-verdict-num">
              <strong>{capFreeTiers.length}</strong>
              <small>免佩戴形态</small>
            </span>
            <span className="acq-verdict-num">
              <strong>{capFreeEegAvailable.length}</strong>
              <small>其中当前可获得且采集脑电</small>
            </span>
            <span className="acq-verdict-num alarm">
              <strong>{capFreeSupportingActive.length}</strong>
              <small>其中可支撑主动式控制</small>
            </span>
          </div>
          <p className="acq-verdict-text">{ACQUISITION_VERDICT}</p>
        </div>

        <div className="inline-note success-note">
          <span>{ACQUISITION_CONCLUSION}</span>
        </div>
      </SectionCard>

      {/* ---------- 免佩戴模式：意图来源重组 ---------- */}
      <SectionCard
        kicker="双通道 · 可交互"
        title="免佩戴模式下的意图来源构成"
        description="切换采集通道，观察意图信息的来源构成与机械臂自由度分配的变化。"
        aside={<StatusPill tone={capOn ? 'cyan' : 'success'}>{capOn ? '佩戴式通道' : '免佩戴通道'}</StatusPill>}
      >
        <div className="ssvep-safety-row utility-surface">
          <div className="ssvep-safety-copy">
            <strong>脑电头戴</strong>
            <span>{capOn ? '8 通道半干电极 · 主动式运动想象' : '未佩戴 · 由多模态通道承担意图识别'}</span>
          </div>
          <button
            type="button"
            className={`switch-pill ${capOn ? 'on' : ''}`}
            onClick={() => setCapOn((v) => !v)}
            role="switch"
            aria-checked={capOn}
            aria-label="脑电头戴佩戴开关"
          >
            <span className="switch-knob" />
            <span className="switch-text">{capOn ? '已佩戴' : '未佩戴'}</span>
          </button>
        </div>

        <div className="source-list">
          <div className={`source-row eeg-row ${capOn ? '' : 'muted'}`}>
            <span className="source-name">
              脑电 · 运动想象
              <small>头戴 8 通道</small>
            </span>
            <span className="source-track">
              <span className="source-fill tone-violet" style={{ width: capOn ? '100%' : '0%' }} />
            </span>
            <strong>{capOn ? '100%' : '0%'}</strong>
          </div>

          {modalities.map((m) => (
            <div key={m.key} className={`source-row ${capOn ? 'muted' : ''}`}>
              <span className="source-name">
                {m.label}
                <small>{m.contact ? '接触' : '非接触'}</small>
              </span>
              <span className="source-track">
                <span
                  className={`source-fill tone-${m.tone}`}
                  style={{ width: capOn ? '0%' : `${Math.round(m.weight * 100)}%` }}
                />
              </span>
              <strong>{capOn ? '0%' : `${Math.round(m.weight * 100)}%`}</strong>
            </div>
          ))}
        </div>

        {capOn ? (
          <div className="inline-note">
            <span>
              佩戴式通道下，意图完全来自主动式运动想象。此为正式训练环节的默认配置：
              患者主动发起的运动意图是驱动皮层重塑的治疗要素，不可由机器人代为完成。
            </span>
          </div>
        ) : (
          <>
            <div className="inline-note success-note">
              <span>
                免佩戴通道下，意图由四路模态融合给出，其中{' '}
                <strong>{Math.round(CONTACTLESS_SHARE * 100)}%</strong>{' '}
                来自完全非接触的摄像头与麦克风，无需在体表布置任何电极。
              </span>
            </div>
            <div className="accordion-list compact-list">
              {modalities.map((m) => (
                <article key={m.key} className={`modality-card utility-surface tone-${m.tone}`}>
                  <div className="modality-head">
                    <strong>{m.label}</strong>
                    <span className={`modality-contact ${m.contact ? 'contact' : 'free'}`}>
                      {m.contact ? '接触式' : '非接触'}
                    </span>
                  </div>
                  <p className="modality-role">{m.role}</p>
                  <p className="modality-strength">{m.strength}</p>
                  <p className="modality-fail">
                    <span>适用边界</span>
                    {m.boundary}
                  </p>
                </article>
              ))}
            </div>
            <div className="inline-note">
              <span>{MODALITY_REDUNDANCY_NOTE}</span>
            </div>
          </>
        )}

        {/* 自由度分配在两种模式下一致 —— 免佩戴模式得以成立的结构性前提 */}
        <div className="dof-block utility-surface">
          <div className="dof-head">
            <strong>机械臂自由度分配</strong>
            <span>共 {DOF_TOTAL} 个自由度</span>
          </div>
          <div className="dof-bar">
            <span className="dof-seg tone-violet" style={{ width: `${(DOF_BY_HUMAN / DOF_TOTAL) * 100}%` }}>
              人 {DOF_BY_HUMAN}
            </span>
            <span className="dof-seg tone-cyan" style={{ width: `${(DOF_BY_ROBOT / DOF_TOTAL) * 100}%` }}>
              机器人补全 {DOF_BY_ROBOT}
            </span>
          </div>
          <p className="dof-note">
            该比例在<strong>佩戴式与免佩戴两种通道下完全一致</strong>：无论意图来自脑电还是多模态，
            由人指定的恒为「执行何种动作、作用于哪个对象」这 {DOF_BY_HUMAN} 个自由度。
          </p>
        </div>

        <div className="inline-note">
          <span>{SHARED_AUTONOMY_NOTE}</span>
        </div>
      </SectionCard>

      {/* ---------- 两轴交叉矩阵 ---------- */}
      <CollapseCard
        id="acq-matrix"
        kicker="两轴交叉"
        title="采集形态 × 范式 可行性矩阵"
        summary={`${acquisitionTiers.length} × ${paradigmClasses.length}`}
      >
        <div className="acq-matrix">
          <div className="acq-matrix-head">
            <span />
            {paradigmClasses.map((p) => (
              <span key={p.key} className={`acq-matrix-col tone-${p.tone}`}>
                {p.label}
              </span>
            ))}
          </div>
          {acquisitionTiers.map((t) => (
            <div key={t.key} className={`acq-matrix-row utility-surface ${t.current ? 'current' : ''}`}>
              <span className="acq-matrix-label">
                <small>L{t.tier}</small>
                {t.label}
              </span>
              {paradigmClasses.map((p) => {
                const cell = matrix[t.key][p.key]
                const lab = cell.supported && (t.maturity === 'lab' || t.maturity === 'concept')
                return (
                  <span
                    key={p.key}
                    className={`acq-matrix-cell ${cell.supported ? (lab ? 'lab' : 'yes') : 'no'}`}
                    title={`${t.label} · ${p.label} · ${maturityLabel[t.maturity]}`}
                  >
                    {cell.supported ? (lab ? '实验室' : '✓') : '—'}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        <p className="metric-note">
          标注「实验室」者，指其原理上可支撑该范式，但方案本身处于实验室阶段。
          矩阵中<strong>免佩戴各级的「主动式」列</strong>目前尚无已上市方案，此即本系统保留佩戴式通道的直接依据。
        </p>
      </CollapseCard>

      {/* ---------- 双通道架构的设计依据 ---------- */}
      <CollapseCard
        id="acq-dual"
        kicker="架构依据"
        title={DUAL_CHANNEL_RATIONALE.title}
        summary="通道职责划分"
      >
        <p className="ssvep-note utility-surface">{DUAL_CHANNEL_RATIONALE.body}</p>
        <div className="inline-note success-note">
          <span>{DUAL_CHANNEL_RATIONALE.resolution}</span>
        </div>
      </CollapseCard>

      <div className="nav-card-list">
        <NavCard
          to="wireless"
          title="范式与电极位置的对应关系"
          desc="主动式需运动区 5 通道，反应式需枕区 3 通道；单顶头戴覆盖两者"
          badge="维度一"
          tone="violet"
        />
        <NavCard
          to="ethics"
          title="无感采集与知情同意"
          desc="免佩戴降低接入门槛，同时对知情同意机制提出更高要求"
          badge="伦理"
          tone="cyan"
        />
      </div>

      <p className="synthetic-tag">
        本页技术成熟度依据公开文献与产品资料综合研判，用于支撑技术选型；多模态权重为系统设计值。
      </p>
    </div>
  )
}
