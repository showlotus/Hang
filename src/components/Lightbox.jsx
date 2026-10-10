import { useCallback, useEffect, useRef } from 'react'
import { flipTo, thumbOf } from '../utils.js'

export default function Lightbox({ state, onClose, onEdit }) {
  const lbRef = useRef(null)
  const imgRef = useRef(null)
  const capRef = useRef(null)
  const flipIdRef = useRef(null)

  useEffect(() => {
    if (!state) return
    const lb = lbRef.current
    const img = imgRef.current
    img.src = state.item.src
    capRef.current.textContent = state.item.note ? state.item.name + ' · ' + state.item.note : state.item.name
    let alive = true
    ;(async () => {
      try { await img.decode() } catch {}
      if (!alive) return
      flipIdRef.current = state.item.id
      lb.classList.add('show')
      document.body.classList.add('previewing')
      img.style.transition = 'none'
      img.style.transform = ''
      img.style.borderRadius = ''
      void img.offsetWidth
      const first = state.originEl && state.originEl.isConnected ? state.originEl.getBoundingClientRect() : null
      if (first && first.width) flipTo(img, first)
      void img.offsetWidth
      img.style.transition = ''
      img.style.transform = ''
      img.style.borderRadius = ''
    })()
    return () => { alive = false }
  }, [state])

  const close = useCallback(() => {
    const lb = lbRef.current
    if (!lb.classList.contains('show')) return
    lb.classList.remove('show')
    document.body.classList.remove('previewing')
    const thumb = flipIdRef.current && thumbOf(flipIdRef.current)
    const img = imgRef.current
    if (thumb && img.getBoundingClientRect().width) flipTo(img, thumb.getBoundingClientRect())
    flipIdRef.current = null
    onClose()
  }, [onClose])

  const edit = useCallback(() => {
    if (!state) return
    close()
    onEdit(state.item.id)
  }, [state, close, onEdit])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [close])

  return (
    <div className="lightbox" ref={lbRef} onClick={close}>
      <img ref={imgRef} alt="预览图" />
      <div className="lightbox-cap" ref={capRef}></div>
      <button className="lightbox-edit" type="button" onClick={edit}>编辑</button>
    </div>
  )
}
