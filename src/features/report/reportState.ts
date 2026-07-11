import type { StatusTone } from '../../design/tokens'
import type { ReportState } from '../../hooks/useDemoController'

/**
 * 报告状态 → 文案 / 色调。此前这两张表以 ternary 链的形式在四处被手写，
 * 且四处互不一致。Record<ReportState, …> 保证以后新增状态值会编译期报错。
 */
export const REPORT_LABEL: Record<ReportState, string> = {
  idle: '待生成',
  generating: '生成中',
  ready: '已就绪',
  exporting: '导出中',
  exported: '已导出',
}

export const REPORT_TONE: Record<ReportState, StatusTone> = {
  idle: 'idle',
  generating: 'active',
  ready: 'success',
  exporting: 'active',
  exported: 'success',
}
