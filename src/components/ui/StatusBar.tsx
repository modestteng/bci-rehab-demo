export function StatusBar() {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="status-bar" aria-hidden="true">
      <span>{time}</span>
      <span className="status-bar-icons">
        <svg viewBox="0 0 18 12" className="status-glyph">
          <path d="M1.5 10.5h2v-3h-2Zm4.5 0h2v-5H6Zm4.5 0h2v-7h-2Zm4.5 0h2v-9h-2Z" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 16 12" className="status-glyph">
          <path
            d="M8 10.8 5.9 8.6a3 3 0 0 1 4.2 0Zm3.6-3.7a5.4 5.4 0 0 0-7.2 0L2.9 5.6a7.6 7.6 0 0 1 10.2 0Z"
            fill="currentColor"
          />
        </svg>
        <svg viewBox="0 0 22 12" className="status-glyph">
          <rect x="0.8" y="1" width="17" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <rect x="2.8" y="3" width="10.5" height="6" rx="1.6" fill="currentColor" />
          <path d="M19.6 4v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" />
        </svg>
      </span>
    </div>
  )
}
