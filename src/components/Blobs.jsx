import { useEffect, useRef } from 'react'

export default function Blobs() {
  const layerRef = useRef(null)

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const layer = layerRef.current
    let tx = 0, ty = 0, cx = 0, cy = 0
    const onMove = e => {
      tx = (e.clientX / innerWidth - .5) * 44
      ty = (e.clientY / innerHeight - .5) * 44
    }
    addEventListener('pointermove', onMove, { passive: true })
    let raf
    const loop = () => {
      if (!document.body.classList.contains('previewing')) {
        cx += (tx - cx) * .045
        cy += (ty - cy) * .045
        layer.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px) scale(1.08)'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="blobs" aria-hidden="true" ref={layerRef}>
      <span className="blob b1"></span>
      <span className="blob b2"></span>
      <span className="blob b3"></span>
    </div>
  )
}
