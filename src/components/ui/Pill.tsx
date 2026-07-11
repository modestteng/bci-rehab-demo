import type { ReactNode, CSSProperties } from 'react'
import type { StatusTone, Tone } from '../../design/tokens'

type PillProps = {
  selected?: boolean
  size?: 'sm' | 'lg'
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  ariaLabel?: string
}

export function Pill({ selected, size = 'sm', disabled, onClick, children, ariaLabel }: PillProps) {
  return (
    <button
      type="button"
      className={`pill ${size === 'lg' ? 'pill-lg' : ''} ${selected ? 'selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
      role="radio"
      aria-checked={Boolean(selected)}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

type Option<T extends string> = T | { key: T; label: ReactNode; disabled?: boolean }

type OptionGroupProps<T extends string> = {
  /** 无障碍必填：这一组在选什么 */
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (next: T) => void
  columns?: 2 | 3 | 4
  size?: 'sm' | 'lg'
}

/**
 * 数据驱动的单选组。取代原来四份逐字相同的胶囊按钮行
 * （mode-pill / intent-pill / sensor-chip / tab-pill）——
 * CSS 里这四个类本来就是同一组规则的四个别名。
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 2,
  size = 'sm',
}: OptionGroupProps<T>) {
  return (
    <div
      className="pill-row"
      role="radiogroup"
      aria-label={label}
      style={{ '--pill-cols': columns } as CSSProperties}
    >
      {options.map((option) => {
        const key = typeof option === 'string' ? option : option.key
        const content = typeof option === 'string' ? option : option.label
        const disabled = typeof option === 'string' ? false : Boolean(option.disabled)

        return (
          <Pill
            key={key}
            selected={value === key}
            size={size}
            disabled={disabled}
            onClick={() => onChange(key)}
          >
            {content}
          </Pill>
        )
      })}
    </div>
  )
}

export function Badge({ children, tone }: { children: ReactNode; tone: Tone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function StatusPill({ children, tone }: { children: ReactNode; tone: StatusTone }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>
}
