import { TIERS } from '../constants.js'
import Chevron from './Chevron.jsx'
import PopMenu from './PopMenu.jsx'
import { useHoverMenu } from '../hooks.js'
import { tierStyle } from '../utils.js'

export default function TierPicker({ value, onChange }) {
  const { open, setOpen, wrapRef, show, hideLater } = useHoverMenu()
  const current = TIERS.find(t => t.key === value)

  return (
    <div className="pop-wrap" ref={wrapRef}>
      <button
        className={'btn pool-btn tp-btn' + (current ? ' active' : '')}
        style={current ? tierStyle(current) : undefined}
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        onMouseEnter={() => show()}
        onMouseLeave={() => hideLater()}
      >
        {current && <i className="tier-dot" style={{ background: current.c1 }}></i>}
        {current ? current.label : '未定级'}
        <Chevron size={13} className={'pop-caret' + (open ? ' open' : '')} />
      </button>
      {open && (
        <PopMenu
          anchorRef={wrapRef}
          onClose={() => setOpen(false)}
          onMouseEnter={() => show()}
          onMouseLeave={() => hideLater()}
        >
          {TIERS.map(t => (
            <button key={t.key} type="button" onClick={() => { setOpen(false); onChange(t.key) }}>
              <i className="tier-dot" style={{ background: t.c1 }}></i>
              {t.label}
              {t.key === value && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </button>
          ))}
        </PopMenu>
      )}
    </div>
  )
}
