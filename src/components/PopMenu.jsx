import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PopMenu({ anchorRef, onClose, onMouseEnter, onMouseLeave, children }) {
  const [pos, setPos] = useState(null)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
  }, [anchorRef])

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!pos || !menu) return
    const top = Math.max(12, Math.min(pos.top, window.innerHeight - menu.offsetHeight - 12))
    const right = Math.max(12, Math.min(pos.right, window.innerWidth - menu.offsetWidth - 12))
    if (top !== pos.top || right !== pos.right) setPos({ top, right })
  }, [pos])

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
      ref={menuRef}
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
