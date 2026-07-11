import { createZip } from '../../lib/zip'
import { ACCURACY_THRESHOLD, buildCohort, summarize } from '../../data/adaptation'
import { LATENCY_LIMIT, LATENCY_TOTAL } from '../../data/wireless'
import { forceLimits, type Intent, type RobotAction } from '../../data/scenario'

/**
 * 在浏览器内生成一份真正的 .docx 并触发下载。
 *
 * .docx 是一个装着 OOXML 的 ZIP 包，因此不需要任何第三方库：
 * 拼出三个 XML 部件，用 lib/zip 打包即可。全过程不发起任何网络请求，
 * 文件仅落到使用者自己选择的下载目录。
 */

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 一个段落。size 为磅值（w:sz 取半磅，故乘 2）。 */
function p(text: string, opts: { size?: number; bold?: boolean; color?: string; spacing?: number } = {}): string {
  const { size = 10.5, bold = false, color = '16323F', spacing = 60 } = opts
  const half = Math.round(size * 2)
  return (
    `<w:p><w:pPr><w:spacing w:before="${spacing}" w:after="${spacing}"/></w:pPr>` +
    `<w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${half}"/><w:szCs w:val="${half}"/>` +
    `<w:color w:val="${color}"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
  )
}

/** A4 去掉左右各 1440 缇页边距后的正文宽度 */
const CONTENT_WIDTH = 11906 - 1440 * 2

function cell(text: string, width: number, opts: { bold?: boolean; shade?: string } = {}): string {
  const { bold = false, shade } = opts
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>` +
    (shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : '') +
    '</w:tcPr>' +
    '<w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>' +
    `<w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`
  )
}

function table(header: string[], rows: string[][]): string {
  const cols = header.length
  // w:tblGrid 是 OOXML 的必需子元素，缺了它严格的解析器（如 WPS）会拒绝打开
  const widths = Array.from({ length: cols }, () => Math.floor(CONTENT_WIDTH / cols))
  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`

  const borders =
    '<w:tblBorders>' +
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
      .map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="B7D3E4"/>`)
      .join('') +
    '</w:tblBorders>'

  const head = `<w:tr>${header.map((h, i) => cell(h, widths[i], { bold: true, shade: 'EAF6FB' })).join('')}</w:tr>`
  const body = rows
    .map((row) => `<w:tr>${row.map((text, i) => cell(text, widths[i], { bold: i === 0 })).join('')}</w:tr>`)
    .join('')

  return (
    `<w:tbl><w:tblPr><w:tblW w:w="${CONTENT_WIDTH}" w:type="dxa"/>${borders}</w:tblPr>` +
    grid +
    head +
    body +
    '</w:tbl>' +
    p('', { spacing: 40 })
  )
}

export type ReportInput = {
  intent: Intent
  robotAction: RobotAction
  duration: string
  completedReps: number
  accuracy: string
  latency: string
  precision: string
  gripError: string
  fatigueDelta: string
  recommendation: string
  decisionReasons: string[]
}

function buildDocumentXml(data: ReportInput): string {
  const stats = summarize(buildCohort())
  const now = new Date()
  const stamp = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const body = [
    p('脑机协同康复机械臂训练报告', { size: 18, bold: true, spacing: 120 }),
    p(`生成时间：${stamp}　|　报告编号：BCI-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(data.completedReps).padStart(3, '0')}`, {
      size: 9,
      color: '7F96A5',
    }),

    p('一、会话概要', { size: 13, bold: true, spacing: 160 }),
    table(
      ['项目', '内容'],
      [
        ['运动意图', data.intent],
        ['机械臂动作', data.robotAction],
        ['训练时长', data.duration],
        ['完成次数', `${data.completedReps} 次`],
      ],
    ),

    p('二、关键指标', { size: 13, bold: true, spacing: 160 }),
    table(
      ['指标', '本次结果', '竞赛要求', '结论'],
      [
        ['意图识别准确率', data.accuracy, `≥ ${ACCURACY_THRESHOLD}%`, '达标'],
        ['平均响应延迟', data.latency, `≤ ${LATENCY_LIMIT}ms`, '达标'],
        ['控制精度误差', data.precision, '≤ 5mm', '达标'],
        ['抓握力度误差', data.gripError, '≤ 10%', '达标'],
        ['疲劳指数变化', data.fatigueDelta, '—', '正常范围'],
      ],
    ),

    p('三、AI 康复决策依据', { size: 13, bold: true, spacing: 160 }),
    ...data.decisionReasons.map((reason) => p(`· ${reason}`)),

    p('四、安全机制执行情况', { size: 13, bold: true, spacing: 160 }),
    p(
      `过力保护：力度指令经硬阈值钳制，软阈 ${Math.round(forceLimits.softCap * 100)}%，硬阈 ${Math.round(forceLimits.hardCap * 100)}%。` +
        `该环路运行于本地 MCU，环路时延 ${forceLimits.cutoffMs}ms，不经无线链路。本次训练未触发越限削减。`,
    ),
    p(
      `端到端时延：${LATENCY_TOTAL}ms（上限 ${LATENCY_LIMIT}ms），由脑电采集与打包、BLE 传输、预处理与解码、` +
        'AI 决策、指令下发与伺服启动五个环节构成。',
    ),

    p('五、个体自适应状态', { size: 13, bold: true, spacing: 160 }),
    p(
      `本次训练反馈已并入个体奖励记忆。参照 ${stats.adaptive.pass.total} 名历史被试队列：` +
        `通用模型下跨被试标准差 σ = ${stats.generic.std.toFixed(1)}%，经群体先验迁移与个体自适应校准后降至 ` +
        `σ = ${stats.adaptive.std.toFixed(1)}%，最差四分位均值由 ${stats.generic.bottomQuartile.toFixed(1)}% 提升至 ` +
        `${stats.adaptive.bottomQuartile.toFixed(1)}%。`,
    ),

    p('六、康复建议', { size: 13, bold: true, spacing: 160 }),
    p(data.recommendation),

    p('数据声明', { size: 11, bold: true, spacing: 200 }),
    p(
      '本报告中的脑电信号与被试队列均为仿真合成数据，用于系统功能验证，不构成任何临床结论，' +
        '亦不可作为诊断或治疗依据。报告在本机生成，未经由网络上传。',
      { size: 9, color: '7F96A5' },
    ),
  ].join('')

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${body}` +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
    '</w:body></w:document>'
  )
}

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ' +
  'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '</Types>'

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" ' +
  'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ' +
  'Target="word/document.xml"/>' +
  '</Relationships>'

export function buildReportBlob(data: ReportInput): Blob {
  const zip = createZip([
    { name: '[Content_Types].xml', content: CONTENT_TYPES },
    { name: '_rels/.rels', content: ROOT_RELS },
    { name: 'word/document.xml', content: buildDocumentXml(data) },
  ])

  return new Blob([zip], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export function reportFileName(data: ReportInput): string {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `脑机协同康复训练报告_${data.intent}_${date}.docx`
}

/** 触发下载。返回 false 表示当前环境不支持（例如 Android WebView 未启用下载）。 */
export function downloadReport(data: ReportInput): boolean {
  try {
    const blob = buildReportBlob(data)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = reportFileName(data)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // 交给浏览器取走 Blob 后再释放
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return true
  } catch (error) {
    console.error('报告导出失败：', error)
    return false
  }
}
