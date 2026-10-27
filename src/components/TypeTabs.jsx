import { TYPES, TYPE_KEYS } from '../types.js'

export default function TypeTabs({ value, onChange, withAll = false }) {
  const options = withAll ? ['all', ...TYPE_KEYS] : TYPE_KEYS
  return (
    <div className="tabs" role="tablist">
      {options.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={value === t}
          className={value === t ? 'active' : ''}
          style={t !== 'all' ? { '--accent': TYPES[t].color } : undefined}
          onClick={() => onChange(t)}
        >
          {t === 'all' ? 'Tout' : `${TYPES[t].icon} ${TYPES[t].label}`}
        </button>
      ))}
    </div>
  )
}
