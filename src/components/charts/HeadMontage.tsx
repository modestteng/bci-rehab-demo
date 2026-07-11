import { electrodes, type ParadigmKey } from '../../data/wireless'

const CX = 80
const CY = 84
const R = 64

/**
 * 头部电极蒙太奇（10-20 系统的二维投影）。
 * 切换主动/被动，对应通道子集发光 —— 一秒讲清「范式决定硬件形态」。
 */
export function HeadMontage({ paradigm }: { paradigm: ParadigmKey }) {
  return (
    <svg viewBox="0 0 160 160" className="head-montage" role="img" aria-label={`电极布局：${paradigm === 'active' ? '运动区' : '枕区'}通道激活`}>
      {/* 鼻尖：标明前后方向 */}
      <path d="M80 20 L70 27 L90 27 Z" className="head-nose" />
      {/* 双耳 */}
      <path d="M15 76 a6 8 0 0 0 0 16" className="head-ear" />
      <path d="M145 76 a6 8 0 0 1 0 16" className="head-ear" />
      <circle cx={CX} cy={CY} r={R} className="head-outline" />

      {electrodes.map((electrode) => {
        const on = electrode.paradigm === paradigm
        return (
          <g key={electrode.id} className={`electrode ${on ? 'on' : 'off'}`}>
            <circle cx={CX + electrode.x * R} cy={CY + electrode.y * R} r={on ? 9 : 7} />
            <text x={CX + electrode.x * R} y={CY + electrode.y * R + 3.2}>
              {electrode.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
