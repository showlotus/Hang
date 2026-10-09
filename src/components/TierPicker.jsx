import { TIERS } from '../constants.js'
import { tierStyle } from '../utils.js'

export default function TierPicker({ value, onChange }) {
  const opts = TIERS
  return (
    <div className="flex flex-1 flex-wrap gap-2">
      {opts.map(t => (
        <button
          key={t.key}
          type="button"
          className={'tp-btn' + (t.key === value ? ' active' : '')}
          style={tierStyle(t)}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
