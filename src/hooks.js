import { useEffect, useRef, useState } from 'react'

export function useHoverMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return
    const onDoc = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])

  const show = () => {
    clearTimeout(timer.current)
    setOpen(true)
  }
  const hideLater = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), 150)
  }

  return { open, setOpen, wrapRef, show, hideLater }
}
