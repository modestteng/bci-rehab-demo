import { useState } from 'react'
import {
  ACQUISITION_CONCLUSION,
  ACQUISITION_VERDICT,
  CONTACTLESS_SHARE,
  DOF_BY_HUMAN,
  DOF_BY_ROBOT,
  DOF_TOTAL,
  PARADIGM_NOTE,
  REHAB_PARADOX,
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

/** 该形态能支撑的范式简写；空数组时明确写「无」，不留白 */
function supportChips(tier: AcquisitionTier) {
  if (tier.supports.length === 0) {
    return <span className="acq-support none">不支撑任何脑电控制范式</span>
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
  // 范式卡要跳的是 demo / ssvep 这些 tab，不是详情页，故用 open 而非 push
  const { open } = useNav()
  const [tierKey, setTierKey] = useState<string>('dry-headset')
  const [capOn, setCapOn] = useState(true)

  const tier = acquisitionTiers.find((t) => t.key === tierKey) ?? acquisitionTiers[1]

  return (
    <div className="mobile-screen acquisition-screen">
      {/* ---------- 概念纠正：两个轴 ---------- */}
      <SectionCard
        kicker="概念澄清"
        title="「主动 / 被动」在本领域有两个含义"
        description="这两个含义彼此正交，混用会导致结论出错。本页把它们拆开，并分别说明本系统所处的位置。"
      >
        <div className="axis-split">
          <div className="axis-card utility-surface tone-violet">
            <span className="axis-tag">轴一 · 范式</span>
            <strong>解码何种脑活动</strong>
            <p>主动式 / 反应式 / 被动式。分类依据 Zander &amp; Kothe (2011)。</p>
          </div>
          <div className="axis-card utility-surface tone-cyan">
            <span className="axis-tag">轴二 · 采集形态</span>
            <strong>被试要不要佩戴脑电帽</strong>
            <p>从湿电极帽，到耳内电极，直至完全不采脑电。</p>
          </div>
        </div>

        <div className="inline-note">
          <span>
            二者可任意组合：运动想象（<strong>主动式范式</strong>）可以配耳内电极（<strong>免佩戴形态</strong>）；
            SSVEP（<strong>反应式范式</strong>）也可以配湿电极帽（<strong>需佩戴形态</strong>）。
            因此「不戴脑电帽」与「被动式范式」不是同一件事。
          </span>
        </div>

        <div className="inline-note warn-note">
          <span>{PARADIGM_NOTE}</span>
        </div>
      </SectionCard>

      {/* ---------- 轴一：范式三分 ---------- */}
      <SectionCard
        kicker="轴一 / 范式"
        title="范式三分与本系统的对应实现"
        description="三种范式本系统均已实现，可逐一跳转核验。"
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

      {/* ---------- 轴二：采集形态阶梯 ---------- */}
      <SectionCard
        kicker="轴二 / 采集形态"
        title="从戴帽到免帽：六级成熟度阶梯"
        description="按「被试需要主动配合到什么程度」排序。点击任一级查看其能力边界与限制。"
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

          {/* 只有短值进 StatGrid —— 它的 value 是大号粗体位，塞整句话会撑成一坨 */}
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

          <div className="inline-note warn-note">
            <span>
              <strong>限制：</strong>
              {tier.limit}
            </span>
          </div>
        </article>

        {/* 结论是算出来的，不是写出来的 */}
        <div className="acq-verdict surface-hero">
          <p className="section-kicker">从上表直接得出</p>
          <div className="acq-verdict-nums">
            <span className="acq-verdict-num">
              <strong>{capFreeTiers.length}</strong>
              <small>免佩戴形态</small>
            </span>
            <span className="acq-verdict-num">
              <strong>{capFreeEegAvailable.length}</strong>
              <small>其中已可获得且仍测脑电</small>
            </span>
            <span className="acq-verdict-num alarm">
              <strong>{capFreeSupportingActive.length}</strong>
              <small>其中能支撑主动式控制</small>
            </span>
          </div>
          <p className="acq-verdict-text">{ACQUISITION_VERDICT}</p>
        </div>

        <div className="inline-note">
          <span>{ACQUISITION_CONCLUSION}</span>
        </div>
      </SectionCard>

      {/* ---------- 「摘下脑电帽」演示 ---------- */}
      <SectionCard
        kicker="第 5 级 · 可交互"
        title="摘下脑电帽之后，意图从哪里来"
        description="切换开关，观察意图信息的来源构成如何重组，以及机械臂自由度的分配如何变化。"
        aside={<StatusPill tone={capOn ? 'cyan' : 'success'}>{capOn ? '已佩戴脑电' : '已摘下脑电'}</StatusPill>}
      >
        <div className="ssvep-safety-row utility-surface">
          <div className="ssvep-safety-copy">
            <strong>脑电头戴</strong>
            <span>{capOn ? '8 通道半干电极 · 主动式运动想象' : '头部无任何佩戴物'}</span>
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
            <span className="switch-text">{capOn ? '已佩戴' : '已摘下'}</span>
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
              佩戴模式下，意图完全来自脑电的主动式运动想象。这是正式训练环节的默认配置 ——
              主动发起的运动意图是驱动皮层重塑的关键，不可由机器人代劳。
            </span>
          </div>
        ) : (
          <>
            <div className="inline-note success-note">
              <span>
                摘下脑电头戴后，意图由四路模态融合给出，其中{' '}
                <strong>{Math.round(CONTACTLESS_SHARE * 100)}%</strong>{' '}
                来自完全非接触的摄像头与麦克风 —— 这部分连电极贴片都不需要。
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
                    <span>失效条件</span>
                    {m.failure}
                  </p>
                </article>
              ))}
            </div>
            <div className="inline-note warn-note">
              <span>
                <strong>边界：</strong>
                对完全无残余肌电、且无法注视或发声的重度瘫痪患者，上述四路通道全部失效 ——
                此时脑电是唯一可用通道。这是脑电不可被替代的确切边界，也是本系统仍保留佩戴式脑电的理由。
              </span>
            </div>
          </>
        )}

        {/* 自由度分配：两种模式下完全相同 —— 这是全页最重要的一张图 */}
        <div className="dof-block utility-surface">
          <div className="dof-head">
            <strong>机械臂自由度分配</strong>
            <span>共 {DOF_TOTAL} 个自由度</span>
          </div>
          <div className="dof-bar">
            <span
              className="dof-seg tone-violet"
              style={{ width: `${(DOF_BY_HUMAN / DOF_TOTAL) * 100}%` }}
            >
              人 {DOF_BY_HUMAN}
            </span>
            <span className="dof-seg tone-cyan" style={{ width: `${(DOF_BY_ROBOT / DOF_TOTAL) * 100}%` }}>
              机器人补全 {DOF_BY_ROBOT}
            </span>
          </div>
          <p className="dof-note">
            该比例在<strong>佩戴与免佩戴两种模式下完全相同</strong>：无论意图来自脑电还是多模态，
            人所需指定的始终只有「做什么、对哪个物体做」这 {DOF_BY_HUMAN} 个自由度。
          </p>
        </div>

        <div className="inline-note">
          <span>{SHARED_AUTONOMY_NOTE}</span>
        </div>
      </SectionCard>

      {/* ---------- 二维矩阵 ---------- */}
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
          「实验室」表示原理上支撑该范式，但方案本身尚未走出实验室。
          注意<strong>免佩戴各行的「主动式」列</strong>：目前没有任何一个已上市方案落在该格内。
        </p>
      </CollapseCard>

      {/* ---------- 康复悖论 ---------- */}
      <CollapseCard id="acq-paradox" kicker="张力" title={REHAB_PARADOX.title} summary="主动参与 vs 接入门槛">
        <p className="ssvep-note utility-surface">{REHAB_PARADOX.body}</p>
        <div className="inline-note success-note">
          <span>{REHAB_PARADOX.resolution}</span>
        </div>
      </CollapseCard>

      <div className="nav-card-list">
        <NavCard
          to="wireless"
          title="范式如何决定电极位置"
          desc="主动式需运动区 5 通道，反应式需枕区 3 通道；一顶头戴覆盖两者"
          badge="轴一"
          tone="violet"
        />
        <NavCard
          to="ethics"
          title="脆弱人群与知情同意"
          desc="免佩戴降低门槛，但不降低伦理标准"
          badge="伦理"
          tone="cyan"
        />
      </div>

      <p className="synthetic-tag">
        本页成熟度评级为团队依据公开资料所作的判断，非厂商声明，亦非实测数据；多模态权重为合成演示值。
      </p>
    </div>
  )
}
