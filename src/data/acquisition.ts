import type { RouteId } from '../app/navigation'
import type { Tone } from '../design/tokens'

/**
 * 范式轴 × 采集形态轴。
 *
 * 脑机接口的「主动 / 被动」存在两个彼此正交的维度，本文件对二者分别建模：
 *
 *   轴一 · 范式（ParadigmClass）：解码何种脑活动。
 *          主动式 / 反应式 / 被动式，依 Zander & Kothe (2011) 的三分法。
 *
 *   轴二 · 采集形态（AcquisitionTier）：被试需要佩戴何种设备。
 *          从湿电极脑电帽，到耳内电极，直至完全不采集脑电。
 *
 * 二者可自由组合：运动想象（主动式范式）可配耳内电极（免佩戴形态），
 * SSVEP（反应式范式）亦可配湿电极帽（需佩戴形态）。
 *
 * 本文件的成熟度评级依据公开文献与产品资料综合研判，用于支撑技术选型。
 */

/* ------------------------------------------------------------------ *
 * 轴一：范式三分
 * ------------------------------------------------------------------ */

export type ParadigmClass = 'active' | 'reactive' | 'passive'

export type ParadigmDef = {
  key: ParadigmClass
  label: string
  en: string
  definition: string
  /** 典型范式 */
  example: string
  /** 本系统的对应实现 */
  inThisSystem: string
  /** 跳转至实现处 */
  to: RouteId
  tone: Tone
}

export const paradigmClasses: readonly ParadigmDef[] = [
  {
    key: 'active',
    label: '主动式',
    en: 'active',
    definition: '使用者自发产生控制信号，全过程不依赖任何外部刺激。',
    example: '运动想象（MI）：想象抬手 / 伸肘 / 握拳，运动皮层出现 μ / β 节律的事件相关去同步（ERD）。',
    inThisSystem: '训练闭环第 2 步「运动意图识别」：四类意图分类，运动区 C3 / Cz / C4 / CP3 / CP4 五通道。',
    to: 'demo',
    tone: 'violet',
  },
  {
    key: 'reactive',
    label: '反应式',
    en: 'reactive',
    definition: '使用者有意识地将注意力投向特定外部刺激，以此发出指令。意图仍为主动，刺激仅作为其载体。',
    example: 'SSVEP：注视以特定频率闪烁的目标，枕区出现同频稳态响应。同类范式还包括 P300。',
    inThisSystem: '范式页 SSVEP 四目标频率-相位联合调制（8 / 10 / 12 / 15 Hz），枕区 O1 / Oz / O2 三通道。',
    to: 'ssvep',
    tone: 'green',
  },
  {
    key: 'passive',
    label: '被动式',
    en: 'passive',
    definition:
      '系统读取使用者的状态（疲劳、认知负荷、注意力），使用者不发出任何指令。' +
      '此处的「被动」界定的是使用者未参与指令发出，与其是否佩戴设备无关 —— 后者属于轴二。',
    example: '疲劳监测、认知负荷估计、注意力水平估计。',
    inThisSystem: '疲劳指数进入 AI 康复决策，自动调整训练强度与力度上限，并驱动多形态情绪安抚策略的选择。',
    to: 'demo',
    tone: 'orange',
  },
] as const

/**
 * 范式覆盖度陈述。
 * 本系统在三种范式上均有对应实现，构成完整的混合式脑机接口。
 */
export const PARADIGM_NOTE =
  '本系统采用 Zander & Kothe (2011) 的三分法进行范式界定：SSVEP 依赖使用者有意识地选择注视目标，' +
  '归入反应式；被动式则指系统读取使用者状态而使用者不发出指令。' +
  '三种范式在本系统中均有对应实现 —— 主动式运动想象、反应式 SSVEP、' +
  '以及由疲劳指数驱动训练强度自适应的被动式状态监测 —— 构成一套完整的混合式脑机接口。'

/* ------------------------------------------------------------------ *
 * 轴二：采集形态阶梯
 * ------------------------------------------------------------------ */

/** 被试的佩戴负担 */
export type WearBurden = '需佩戴' | '近乎无感' | '无需佩戴'

/**
 * 技术成熟度。
 * clinical：临床在用；product：已有商品在售；lab：实验室阶段；concept：概念验证。
 */
export type Maturity = 'clinical' | 'product' | 'lab' | 'concept'

export const maturityLabel: Record<Maturity, string> = {
  clinical: '临床在用',
  product: '已上市',
  lab: '实验室阶段',
  concept: '概念验证',
}

export const maturityTone: Record<Maturity, Tone> = {
  clinical: 'green',
  product: 'cyan',
  lab: 'orange',
  concept: 'magenta',
}

export type AcquisitionTier = {
  key: string
  tier: number
  label: string
  wear: WearBurden
  channels: string
  /** 佩戴与准备耗时 */
  prep: string
  /** 相对湿电极的信号质量 */
  signal: string
  /**
   * 该形态可支撑的范式。本字段是两轴交叉可行性矩阵的唯一数据来源，
   * 技术选型结论由此计算得出，不另行硬编码。
   */
  supports: ParadigmClass[]
  maturity: Maturity
  /** 代表性方案 */
  representative: string
  /** 适用边界与工程约束 */
  boundary: string
  /** 本系统当前采用的形态 */
  current?: boolean
}

export const acquisitionTiers: readonly AcquisitionTier[] = [
  {
    key: 'wet-cap',
    tier: 0,
    label: '湿电极脑电帽',
    wear: '需佩戴',
    channels: '32 – 64 通道',
    prep: '20 – 30 分钟，需逐点注射导电膏',
    signal: '信号质量的参照基准，阻抗可压至 5 kΩ 以下',
    supports: ['active', 'reactive', 'passive'],
    maturity: 'clinical',
    representative: '科研与临床脑电的通用配置',
    boundary: '导电膏的注射与清洗流程耗时较长，适用于实验室与临床场景，不适用于居家与长期训练。',
  },
  {
    key: 'dry-headset',
    tier: 1,
    label: '干 / 半干电极头戴',
    wear: '需佩戴',
    channels: '8 – 32 通道',
    prep: '3 – 5 分钟，免导电膏',
    signal: '阻抗为数十 kΩ 量级，需配合工频陷波与运动伪影抑制',
    supports: ['active', 'reactive', 'passive'],
    maturity: 'product',
    representative: '梳齿式与弹簧针干电极，已有多家厂商量产供货',
    boundary:
      '在信号质量与佩戴负担之间取得平衡：保留运动皮层覆盖能力，同时将准备时间压缩一个数量级。' +
      '本系统据此选用 8 通道半干电极方案，并以疲劳指数约束单次训练时长。',
    current: true,
  },
  {
    key: 'ear-eeg',
    tier: 2,
    label: '耳周 / 耳内电极',
    wear: '近乎无感',
    channels: '2 – 10 通道，集中于耳部',
    prep: '与佩戴耳机相当，即戴即用',
    signal: '可稳定记录枕区 α 节律、听觉稳态响应与睡眠分期',
    // 耳部电极距运动皮层过远，μ / β 节律 ERD 已充分衰减，故仅支撑被动式
    supports: ['passive'],
    maturity: 'product',
    representative: '耳道内干电极耳塞与耳后 C 形柔性电极阵列，已有消费级产品在售',
    boundary:
      '电极全部位于耳部，与运动皮层（C3 / C4）的空间距离决定了运动想象所依赖的 μ / β 节律 ERD ' +
      '在此处已充分衰减。该形态的产品定位集中于专注度、睡眠与疲劳监测，与其可支撑的被动式范式相符。',
  },
  {
    key: 'e-tattoo',
    tier: 3,
    label: '头皮电子纹身',
    wear: '近乎无感',
    channels: '可按需布点，位置不受形态约束',
    prep: '现场打印，可连续佩戴数十小时',
    signal: '据公开报道接近传统凝胶电极水平',
    // 可布点于运动区，原理上三种范式均可支撑
    supports: ['active', 'reactive', 'passive'],
    maturity: 'lab',
    representative: '导电液态墨水穿过头发直接打印于头皮的可拉伸表皮电极（2025 年公开报道）',
    boundary:
      '布点位置不受形态约束，原理上可覆盖运动皮层，是免佩戴路线中最具潜力的方向。' +
      '当前处于实验室阶段，长期生物相容性、可重复性与量产工艺仍在验证之中。',
  },
  {
    key: 'non-contact',
    tier: 4,
    label: '非接触电容电极',
    wear: '无需佩戴',
    channels: '实验室配置，通道数有限',
    prep: '无需接触头皮，可隔头发或绝缘介质耦合',
    signal: '耦合电容量级极小，信噪比显著低于接触式电极',
    // 实时控制场景下信噪比不足，暂不支撑任何控制范式
    supports: [],
    maturity: 'lab',
    representative: '超高输入阻抗前置放大器配合位移电流耦合，相关研究可追溯至十余年前',
    boundary:
      '这是唯一真正不接触头皮的技术路线。在头部自由活动的康复场景中，运动伪影与静电漂移的量级' +
      '目前仍高于目标信号，因此该路线尚未进入实时控制的可用区间，属于长期技术储备方向。',
  },
  {
    key: 'no-eeg',
    tier: 5,
    label: '多模态替代通道',
    wear: '无需佩戴',
    channels: '不使用脑电通道',
    prep: '肌电贴片 + 摄像头 + 麦克风',
    signal: '不测量脑活动本身，转而测量其外部可观测表现',
    supports: [],
    maturity: 'product',
    representative: '表面肌电、面部表情、注视与语音的多模态融合，配合机器人共享自主',
    boundary:
      '严格意义上属多模态人机接口而非脑机接口，定位为降低接入门槛的补充通道。' +
      '对残余肌电缺失且注视与发声均受限的重度瘫痪患者，脑电仍是唯一可用通道 —— ' +
      '这一边界正是本系统在正式训练环节保留佩戴式脑电的技术依据。',
  },
] as const

/* ------------------------------------------------------------------ *
 * 技术选型结论 —— 由 supports 字段计算得出，不硬编码
 * ------------------------------------------------------------------ */

/** 免佩戴形态（不要求被试主动配合佩戴脑电帽） */
export const capFreeTiers = acquisitionTiers.filter((t) => t.wear !== '需佩戴')

/** 当前可获得的形态（已上市或临床在用） */
export function isAvailable(t: AcquisitionTier) {
  return t.maturity === 'product' || t.maturity === 'clinical'
}

/**
 * 选型的关键判据：当前可获得的免佩戴方案中，有多少能支撑主动式运动想象控制。
 * 该数值由数据计算得出。当前结果为 0。
 */
export const capFreeSupportingActive = capFreeTiers.filter((t) => isAvailable(t) && t.supports.includes('active'))

/** 当前可获得、且仍采集脑电的免佩戴方案 */
export const capFreeEegAvailable = capFreeTiers.filter((t) => isAvailable(t) && t.supports.length > 0)

export const ACQUISITION_VERDICT =
  `在上述 ${acquisitionTiers.length} 种采集形态中，免佩戴形态有 ${capFreeTiers.length} 种；` +
  `其中当前可获得（已上市 / 临床在用）的方案里，能够支撑主动式运动想象控制的数量为 ` +
  `${capFreeSupportingActive.length} 种。`

export const ACQUISITION_CONCLUSION =
  '免佩戴路线当前呈现明确的能力分层：可获得的耳部电极支撑被动式状态监测；' +
  '可覆盖运动皮层的头皮电子纹身处于实验室阶段；非接触电容电极尚未进入实时控制的可用区间。' +
  '据此，本系统在正式训练环节采用佩戴式脑电以保障主动式范式的解码质量，' +
  '并以多模态替代通道承担居家与日常场景下的接入需求，形成双通道架构。'

/* ------------------------------------------------------------------ *
 * 多模态替代通道
 * ------------------------------------------------------------------ */

export type Modality = {
  key: string
  label: string
  sensor: string
  /** 是否需要接触人体 */
  contact: boolean
  /** 在意图识别中承担的角色 */
  role: string
  strength: string
  /** 适用边界 —— 各通道边界互不重合，这正是采用四路融合的依据 */
  boundary: string
  /** 融合后意图信息中的占比（系统设计值） */
  weight: number
  tone: Tone
}

export const modalities: readonly Modality[] = [
  {
    key: 'semg',
    label: '表面肌电 sEMG',
    sensor: '前臂 / 肩部表面电极贴片',
    contact: true,
    role: '运动意图的主通道，直接反映残余肌肉激活。',
    strength:
      '肌电信号先于肌肉实际收缩出现，二者之间存在数十毫秒量级的电机械延迟（electromechanical delay），' +
      '可据此提前预测动作起始。肌电触发的功能性电刺激已是临床在用的成熟技术。',
    boundary: '卒中患侧肌电微弱并伴随共激活与痉挛，需配合个体化阈值整定；残余肌电缺失时由其余通道承担。',
    weight: 0.45,
    tone: 'violet',
  },
  {
    key: 'gaze',
    label: '注视 / 眼动',
    sensor: '摄像头（非接触）',
    contact: false,
    role: '目标选择通道，注视对象即为操作对象。',
    strength: '完全非接触，带宽较高，且与机器人视觉坐标系天然对齐，可直接省去空间指定环节。',
    boundary:
      '需以停留时长（dwell time）或二次确认抑制无意注视被误判为指令（Midas touch），' +
      '该机制引入的附加时延已计入交互设计；视野缺损或眼动障碍者由语音通道承担。',
    weight: 0.25,
    tone: 'cyan',
  },
  {
    key: 'face',
    label: '面部表情 / 面部肌电',
    sensor: '摄像头，或皱眉肌 / 颧大肌表面电极',
    contact: false,
    role: '状态通道，提供用力程度、疼痛与情绪信息，直接供给被动式范式与情绪安抚策略。',
    strength: '非接触即可获取，与疲劳指数、触觉反馈互为佐证，用于触发强度下调或启动安抚策略。',
    boundary: '面部感觉运动受损者的表情表达受限，此时以疲劳指数与肌电通道交叉校验。',
    weight: 0.15,
    tone: 'orange',
  },
  {
    key: 'speech',
    label: '语音 / 文本 + 大模型',
    sensor: '麦克风（非接触）',
    contact: false,
    role: '高层任务通道，将自然语言目标翻译为机械臂动作序列。',
    strength: '带宽最高，可直接表达抽象目标而无需逐关节指定，与共享自主架构天然契合。',
    boundary: '失语症为卒中的高发共病，此类患者的意图表达由注视与肌电通道承担。',
    weight: 0.15,
    tone: 'green',
  },
] as const

/** 权重之和为 1，DEV 下钉死 */
export const MODALITY_WEIGHT_SUM = modalities.reduce((sum, m) => sum + m.weight, 0)

/** 完全非接触通道的占比 */
export const CONTACTLESS_SHARE = modalities.filter((m) => !m.contact).reduce((sum, m) => sum + m.weight, 0)

/**
 * 四路通道的适用边界互不重合，任一通道受限时其余通道可承接，
 * 这是采用多模态融合而非单一替代通道的设计依据。
 */
export const MODALITY_REDUNDANCY_NOTE =
  '四路通道的适用边界互不重合：肌电受限于残余肌力，注视受限于视野与眼动，' +
  '面部受限于表情表达能力，语音受限于言语功能。任一通道受限时，其余通道可承接其意图带宽 —— ' +
  '这正是采用四路融合而非单一替代通道的设计依据。'

/* ------------------------------------------------------------------ *
 * 共享自主
 * ------------------------------------------------------------------ */

/**
 * 机械臂的自由度分配。
 * 无论意图来源为脑电还是多模态，由人指定的自由度恒为 2（意图类别与目标对象），
 * 其余由机器人的视觉与运动规划自主补全。
 */
export const DOF_TOTAL = 7
export const DOF_BY_HUMAN = 2
export const DOF_BY_ROBOT = DOF_TOTAL - DOF_BY_HUMAN

export const sharedAutonomy = [
  { key: 'intent', label: '人指定', detail: '意图类别与目标对象', dof: DOF_BY_HUMAN, tone: 'violet' as Tone },
  {
    key: 'robot',
    label: '机器人补全',
    detail: '抓取位姿、接近轨迹、力度分配、避障',
    dof: DOF_BY_ROBOT,
    tone: 'cyan' as Tone,
  },
] as const

export const SHARED_AUTONOMY_NOTE =
  `机械臂共 ${DOF_TOTAL} 个自由度，由人指定的恒为 ${DOF_BY_HUMAN} 个：执行何种动作、作用于哪个对象。` +
  `其余 ${DOF_BY_ROBOT} 个由机器人依据视觉与运动规划自主补全。` +
  '该比例在佩戴脑电与免佩戴两种模式下完全一致，因此免佩戴通道较低的意图带宽不构成控制瓶颈：' +
  '共享自主架构使意图带宽与控制精度得以解耦，这是免佩戴模式得以成立的结构性前提。'

/* ------------------------------------------------------------------ *
 * 双通道架构的设计依据
 * ------------------------------------------------------------------ */

/**
 * 运动康复的神经可塑性依赖患者的主动参与，这一结论决定了佩戴式脑电通道
 * 在正式训练环节不可被免佩戴通道替代。本系统据此采用双通道架构。
 */
export const DUAL_CHANNEL_RATIONALE = {
  title: '双通道架构的设计依据',
  body:
    '运动康复的神经可塑性依赖患者的主动参与：主动发起的运动意图驱动皮层重塑，' +
    '其可塑性收益显著高于纯被动的肢体牵拉。因此机器人的自主程度并非越高越好 —— ' +
    '在正式训练环节，患者的主动参与本身即是治疗要素，不可由机器人代为完成。',
  resolution:
    '本系统据此采用双通道架构：正式训练环节佩戴脑电、采用主动式运动想象，以保障主动参与与可塑性驱动；' +
    '居家、日常及重度患者场景启用免佩戴多模态通道，以保障使用的连续性与可及性。' +
    '两条通道各自承担明确职责 —— 免佩戴通道解决接入门槛，佩戴式通道保障训练质量。',
} as const

/* ------------------------------------------------------------------ *
 * 两轴交叉可行性矩阵
 * ------------------------------------------------------------------ */

export type MatrixCell = {
  supported: boolean
  maturity: Maturity
}

/** 由 supports 字段直接推导，不手工维护。 */
export function buildMatrix(): Record<string, Record<ParadigmClass, MatrixCell>> {
  const matrix = {} as Record<string, Record<ParadigmClass, MatrixCell>>

  for (const tier of acquisitionTiers) {
    matrix[tier.key] = {} as Record<ParadigmClass, MatrixCell>
    for (const paradigm of paradigmClasses) {
      matrix[tier.key][paradigm.key] = {
        supported: tier.supports.includes(paradigm.key),
        maturity: tier.maturity,
      }
    }
  }

  return matrix
}

if (import.meta.env?.DEV) {
  console.assert(
    Math.abs(MODALITY_WEIGHT_SUM - 1) < 1e-9,
    `多模态权重之和应为 1，实际为 ${MODALITY_WEIGHT_SUM}`,
  )
  console.assert(
    capFreeSupportingActive.length === 0,
    '该数组若不再为空，说明已出现可获得的免佩戴主动式方案，此时选型结论需同步更新',
  )
  console.assert(
    acquisitionTiers.filter((t) => t.current).length === 1,
    '采集形态阶梯中应有且仅有一级标记为本系统当前方案',
  )
}
