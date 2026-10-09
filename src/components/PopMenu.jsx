import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PopMenu({ anchorRef, onClose, onMouseEnter, onMouseLeave, children }) {
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
  }, [anchorRef])

  useEffect(() => {
    if (!pos) return
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onClose, true)
    return () => {
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [pos, onClose])

  if (!pos) return null
  return createPortal(
    <div
      className="pop-menu"
      style={pos}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body
  )
}
