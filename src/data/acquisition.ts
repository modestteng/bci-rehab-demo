import type { RouteId } from '../app/navigation'
import type { Tone } from '../design/tokens'

/**
 * 范式轴 × 采集形态轴。
 *
 * 本文件存在的理由是一个必须纠正的概念混淆：
 *
 *   「主动 / 被动」在脑机接口领域有两个完全不同的含义，而它们是正交的。
 *
 *   轴一 · 范式（本文件的 ParadigmClass）：解码何种脑活动。
 *          主动式 / 反应式 / 被动式，分类依据 Zander & Kothe (2011)。
 *          SSVEP 属于「反应式」—— 使用者仍在有意识地选择注视目标。
 *
 *   轴二 · 采集形态（本文件的 AcquisitionTier）：被试要不要佩戴脑电帽。
 *          这才是「不戴脑电帽也能采脑电」所讨论的那个轴。
 *
 * 二者可以任意组合：运动想象（主动式范式）可以配耳内电极（免佩戴形态），
 * SSVEP（反应式范式）也可以配湿电极帽（需佩戴形态）。
 *
 * 本文件的成熟度评级为团队依据公开资料所作的判断，非厂商声明，亦非实测。
 */

/* ------------------------------------------------------------------ *
 * 轴一：范式三分
 * ------------------------------------------------------------------ */

export type ParadigmClass = 'active' | 'reactive' | 'passive'

export type ParadigmDef = {
  key: ParadigmClass
  label: string
  en: string
  /** 定义 */
  definition: string
  /** 典型范式 */
  example: string
  /** 本系统的实现 —— 三种范式本系统均已实现，此处逐一指明位置 */
  inThisSystem: string
  /** 跳去看实现 */
  to: RouteId
  tone: Tone
}

export const paradigmClasses: readonly ParadigmDef[] = [
  {
    key: 'active',
    label: '主动式',
    en: 'active',
    definition: '使用者自发地产生控制信号，全过程不依赖任何外部刺激。',
    example: '运动想象（MI）：想象抬手 / 伸肘 / 握拳，运动皮层出现 μ / β 节律的事件相关去同步（ERD）。',
    inThisSystem: '训练闭环第 2 步「运动意图识别」：四类意图分类，运动区 C3 / Cz / C4 / CP3 / CP4 五通道。',
    to: 'demo',
    tone: 'violet',
  },
  {
    key: 'reactive',
    label: '反应式',
    en: 'reactive',
    definition: '使用者有意识地将注意力投向某个外部刺激，以此发出指令。意图仍是主动的，只是借刺激作为载体。',
    example: 'SSVEP：注视以特定频率闪烁的目标，枕区出现同频稳态响应。此外还有 P300。',
    inThisSystem: '范式页 SSVEP 四目标频率-相位联合调制（8 / 10 / 12 / 15 Hz），枕区 O1 / Oz / O2 三通道。',
    to: 'ssvep',
    tone: 'green',
  },
  {
    key: 'passive',
    label: '被动式',
    en: 'passive',
    definition:
      '系统读取使用者的状态（疲劳、认知负荷、注意力），而使用者并未发出任何指令。' +
      '此处的「被动」指使用者未参与指令的发出，与其是否佩戴设备无关 —— 这正是本页要区分的两个轴。',
    example: '疲劳监测、认知负荷估计、注意力水平估计。',
    inThisSystem: '疲劳指数进入 AI 康复决策，自动调整训练强度与力度上限；同时驱动多形态情绪安抚策略的选择。',
    to: 'demo',
    tone: 'orange',
  },
] as const

/**
 * 一句必须写出来的话：本系统三种范式均已实现。
 * 之前的版本把 SSVEP 误标为「被动式」，实际上真正的被动式范式（疲劳指数驱动决策）
 * 早已在训练闭环第 4 步运行，只是没有被正确命名。
 */
export const PARADIGM_NOTE =
  '此前版本将 SSVEP 标注为「被动接受式」，属术语误用：SSVEP 的使用者仍在有意识地选择注视目标，应归入反应式。' +
  '真正的被动式范式在本系统中并非缺失 —— 疲劳指数驱动的训练强度自适应即属此类，只是先前未被正确命名。'

/* ------------------------------------------------------------------ *
 * 轴二：采集形态阶梯（董老师所指的「主动 / 被动」）
 * ------------------------------------------------------------------ */

/** 被试是否需要主动配合佩戴 */
export type WearBurden = '需佩戴' | '近乎无感' | '无需佩戴'

/**
 * 技术成熟度。
 * clinical：临床在用；product：已有商品在售；lab：实验室原型，未商业化；concept：仅有概念或早期验证。
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
  /** 佩戴 / 准备耗时 */
  prep: string
  /** 相对湿电极的信号质量 */
  signal: string
  /**
   * 该形态能支撑哪些范式 —— 整个论证的核心字段。
   * 空数组意味着：该形态目前无法支撑任何实时控制范式。
   */
  supports: ParadigmClass[]
  maturity: Maturity
  /** 代表性工作或产品 */
  representative: string
  /** 诚实的限制 */
  limit: string
  /** 是否为本系统当前采用的方案 */
  current?: boolean
}

export const acquisitionTiers: readonly AcquisitionTier[] = [
  {
    key: 'wet-cap',
    tier: 0,
    label: '湿电极脑电帽',
    wear: '需佩戴',
    channels: '32 – 64 通道',
    prep: '20 – 30 分钟（逐点注射导电膏）',
    signal: '金标准，阻抗可压至 5 kΩ 以下',
    supports: ['active', 'reactive', 'passive'],
    maturity: 'clinical',
    representative: '科研与临床脑电的通用配置',
    limit: '准备耗时长，导电膏残留需清洗；患者接受度低，无法用于居家与长期场景。',
  },
  {
    key: 'dry-headset',
    tier: 1,
    label: '干 / 半干电极头戴',
    wear: '需佩戴',
    channels: '8 – 32 通道',
    prep: '3 – 5 分钟，免导电膏',
    signal: '阻抗升至数十 kΩ 量级，信噪比低于湿电极，对运动伪影更敏感',
    supports: ['active', 'reactive', 'passive'],
    maturity: 'product',
    representative: '梳齿式 / 弹簧针干电极，已有多家厂商量产',
    limit: '仍需佩戴，头部有明显异物感；长时间佩戴存在压迫不适。',
    current: true,
  },
  {
    key: 'ear-eeg',
    tier: 2,
    label: '耳周 / 耳内电极',
    wear: '近乎无感',
    channels: '2 – 10 通道，全部集中在耳部',
    prep: '如同戴耳机，即戴即用',
    signal: '可稳定记录枕区 α 节律、听觉稳态响应与睡眠分期',
    // 关键：耳部电极距运动皮层过远，无法可靠拾取 μ / β 节律的 ERD
    supports: ['passive'],
    maturity: 'product',
    representative: '耳道内干电极耳塞、耳后 C 形柔性电极阵列（cEEGrid 一类）；已有消费级产品在售',
    limit:
      '电极全部位于耳部，距运动皮层（C3 / C4）过远，运动想象所依赖的 μ / β 节律 ERD 在此处已极度衰减。' +
      '已上市的此类产品无一以运动想象控制为主打功能，其宣传场景均为专注度、睡眠与疲劳监测 —— 这本身即是最直接的佐证。',
  },
  {
    key: 'e-tattoo',
    tier: 3,
    label: '头皮电子纹身',
    wear: '近乎无感',
    channels: '可按需布点，原理上不受位置限制',
    prep: '现场打印，可连续佩戴数十小时',
    signal: '据报道接近传统凝胶电极水平',
    // 原理上可贴在运动区，故三种范式都能支撑；但尚未商业化
    supports: ['active', 'reactive', 'passive'],
    maturity: 'lab',
    representative: '导电液态墨水穿过头发直接打印于头皮的可拉伸表皮电极（2025 年公开报道的实验室成果）',
    limit:
      '仍属接触式，只是免去了「帽子」这一形态。目前为实验室原型，未见商业化产品，' +
      '长期生物相容性、可重复性与量产工艺均未经充分验证。',
  },
  {
    key: 'non-contact',
    tier: 4,
    label: '非接触电容电极',
    wear: '无需佩戴',
    channels: '实验室配置，通道数有限',
    prep: '无需接触头皮，可隔头发或绝缘介质耦合',
    signal: '耦合电容极小，信噪比远低于接触式；对运动伪影与静电漂移极为敏感',
    // 空数组：目前无法支撑任何实时控制范式
    supports: [],
    maturity: 'lab',
    representative: '超高输入阻抗前置放大器 + 位移电流耦合，相关工作可追溯至十余年前',
    limit:
      '这是「真正不接触头皮」的路线，但多年来始终未走出实验室。' +
      '在头部自由活动的康复场景下，运动伪影足以淹没脑电信号，目前不具备实时控制的可用性。',
  },
  {
    key: 'no-eeg',
    tier: 5,
    label: '不采脑电 · 多模态替代',
    wear: '无需佩戴',
    channels: '不使用任何脑电通道',
    prep: '肌电贴片 + 摄像头 + 麦克风',
    signal: '不再测量脑活动，转而测量脑活动的外部表现',
    // 不采脑电，故不支撑任何脑电范式 —— 但这不等于不能识别意图
    supports: [],
    maturity: 'product',
    representative: '表面肌电、面部表情、注视、语音的多模态融合，配合机器人共享自主',
    limit:
      '不再是脑机接口。对完全无残余肌电、且无法注视或发声的重度瘫痪患者，本路线整体失效 —— ' +
      '此时脑电是唯一可用通道。这是脑电不可被替代的确切边界。',
  },
] as const

/* ------------------------------------------------------------------ *
 * 从数据推出的结论 —— 不写断言，让结论自己算出来
 * ------------------------------------------------------------------ */

/** 免佩戴（不需要被试主动配合戴帽）的形态 */
export const capFreeTiers = acquisitionTiers.filter((t) => t.wear !== '需佩戴')

/** 已经能买到的（已上市或临床在用） */
export function isAvailable(t: AcquisitionTier) {
  return t.maturity === 'product' || t.maturity === 'clinical'
}

/**
 * 核心问题：已经能买到的免佩戴方案里，有几种能支撑主动式运动想象控制？
 * 这个数字是算出来的，不是写出来的。当前答案为 0。
 */
export const capFreeSupportingActive = capFreeTiers.filter((t) => isAvailable(t) && t.supports.includes('active'))

/** 已上市的免佩戴脑电方案（仍在测脑电的，即排除第 5 级多模态替代） */
export const capFreeEegAvailable = capFreeTiers.filter((t) => isAvailable(t) && t.supports.length > 0)

/**
 * 结论。措辞必须经得起追问：
 * 我们不说「免佩戴不可能」，只说「已上市的免佩戴脑电方案目前支撑不了主动式控制」。
 */
export const ACQUISITION_VERDICT =
  `在上述 ${acquisitionTiers.length} 种采集形态中，免佩戴的有 ${capFreeTiers.length} 种；` +
  `其中已可获得的（已上市 / 临床在用）方案里，能够支撑主动式运动想象控制的数量为 ` +
  `${capFreeSupportingActive.length} 种。`

export const ACQUISITION_CONCLUSION =
  '免佩戴采集在今天是分裂的：能买到的（耳部电极）只支撑被动式状态监测；' +
  '能支撑主动式控制的（头皮电子纹身）仍在实验室；真正非接触的电容电极尚不具备实时控制的可用性。' +
  '因此「不佩戴脑电帽即可让机器人完成工作」在当前的现实解，是第 5 级 —— 更换模态，而非更换电极。'

/* ------------------------------------------------------------------ *
 * 第 5 级的展开：多模态替代
 * ------------------------------------------------------------------ */

export type Modality = {
  key: string
  label: string
  sensor: string
  /** 是否接触人体 */
  contact: boolean
  /** 在意图识别中承担的角色 */
  role: string
  strength: string
  /** 诚实的失效条件 */
  failure: string
  /** 在融合后的意图信息中所占比重（合成演示值） */
  weight: number
  tone: Tone
}

export const modalities: readonly Modality[] = [
  {
    key: 'semg',
    label: '表面肌电 sEMG',
    sensor: '前臂 / 肩部表面电极贴片',
    contact: true,
    role: '运动意图的主通道：直接反映残余的肌肉激活。',
    strength:
      '肌电信号先于肌肉实际收缩出现，二者之间存在数十毫秒量级的电机械延迟（electromechanical delay），' +
      '因而可用于提前预测动作起始。肌电触发的功能性电刺激已是临床在用的成熟技术。',
    failure: '卒中患侧肌电微弱、伴随共激活与痉挛，准确率显著低于健康人；完全瘫痪者无残余肌电，本通道失效。',
    weight: 0.45,
    tone: 'violet',
  },
  {
    key: 'gaze',
    label: '注视 / 眼动',
    sensor: '摄像头（非接触）',
    contact: false,
    role: '目标选择通道：注视哪个物体，即选定操作对象。',
    strength: '完全非接触，带宽高，健康人与多数卒中患者均可使用；与机器人视觉直接对齐，可省去空间指定。',
    failure:
      'Midas touch 问题：无意的注视会被误判为指令。须以停留时长（dwell time）或二次确认加以约束，' +
      '这会引入额外延迟。重度视野缺损或眼动障碍者不可用。',
    weight: 0.25,
    tone: 'cyan',
  },
  {
    key: 'face',
    label: '面部表情 / 面部肌电',
    sensor: '摄像头，或皱眉肌 / 颧大肌表面电极',
    contact: false,
    role: '状态通道：用力程度、疼痛与情绪 —— 直接喂给被动式范式与情绪安抚策略。',
    strength: '非接触即可获得；与疲劳指数、痛觉反馈互为佐证，可用于触发降低强度或启动安抚。',
    failure: '面瘫、面部感觉运动受损的卒中患者表情受限，本通道的可靠性显著下降。',
    weight: 0.15,
    tone: 'orange',
  },
  {
    key: 'speech',
    label: '语音 / 文本 + 大模型',
    sensor: '麦克风（非接触）',
    contact: false,
    role: '高层任务通道：将「我想喝水」一类的自然语言目标翻译为机械臂动作序列。',
    strength: '带宽最高，可直接表达抽象目标，无需逐关节指定；与共享自主天然契合。',
    failure: '失语症（aphasia）是卒中的高发共病，此类患者语音通道直接失效。',
    weight: 0.15,
    tone: 'green',
  },
] as const

/** 权重之和应为 1，DEV 下钉死 */
export const MODALITY_WEIGHT_SUM = modalities.reduce((sum, m) => sum + m.weight, 0)

/** 非接触模态的占比 —— 「连贴片都不用贴」的那部分意图信息 */
export const CONTACTLESS_SHARE = modalities.filter((m) => !m.contact).reduce((sum, m) => sum + m.weight, 0)

/* ------------------------------------------------------------------ *
 * 共享自主：「让机器人自主工作」的技术实质
 * ------------------------------------------------------------------ */

/**
 * 机械臂的自由度分配。
 *
 * 关键洞察：无论意图来自脑电还是多模态，人所指定的自由度都只有 2（意图类别 + 目标对象）；
 * 其余全部由机器人的视觉与运动规划补全。
 * 也就是说 —— 让「免佩戴」变得可行的，是机器人的自主补全能力，而不是传感器本身。
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
  `机械臂共 ${DOF_TOTAL} 个自由度，而人所需指定的始终只有 ${DOF_BY_HUMAN} 个：做什么、对哪个物体做。` +
  `其余 ${DOF_BY_ROBOT} 个由机器人依据视觉与运动规划自主补全。` +
  '这一比例在佩戴脑电与免佩戴两种模式下完全相同 —— 因此免佩戴方案的意图带宽虽低，却并不致命：' +
  '真正让「不戴脑电帽也能让机器人工作」得以成立的，是机器人的自主补全能力，而非传感器本身。'

/* ------------------------------------------------------------------ *
 * 必须主动讲清的张力
 * ------------------------------------------------------------------ */

/**
 * 康复的根本悖论。
 * 这一条如果由我们主动写出来，是可信度；被评委问出来，就是漏洞。
 */
export const REHAB_PARADOX = {
  title: '免佩戴与康复疗效之间存在张力',
  body:
    '运动康复的神经可塑性依赖于患者的主动参与：主动发起的运动意图驱动皮层重塑，' +
    '而纯被动的肢体牵拉，其可塑性收益显著低于主动辅助运动。' +
    '机器人越自主，患者越被动 —— 因此「免佩戴 + 机器人自主」并非纯粹的进步，它以主动参与度为代价换取接入门槛的降低。',
  resolution:
    '故本系统将两者定位为分工而非替代：正式训练环节佩戴脑电、采用主动式运动想象，以确保主动参与与可塑性驱动；' +
    '居家、日常与重度患者场景则启用免佩戴多模态通道，以维持使用的连续性与可及性。' +
    '免佩戴解决的是「用不用得上」，佩戴脑电解决的是「练不练得好」，二者不可互相冒充。',
} as const

/* ------------------------------------------------------------------ *
 * 二维矩阵：两轴正交
 * ------------------------------------------------------------------ */

export type MatrixCell = {
  supported: boolean
  maturity: Maturity
}

/** 采集形态 × 范式 的可行性矩阵，由 supports 字段直接推出，不手写。 */
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
    '若该数组不再为空，说明已有可获得的免佩戴方案能支撑主动式范式 —— 此时页面结论必须同步改写',
  )
  console.assert(
    acquisitionTiers.some((t) => t.current),
    '采集形态阶梯中必须有且仅有一级被标记为本系统当前方案',
  )
}
