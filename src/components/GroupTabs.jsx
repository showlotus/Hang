import { useLayoutEffect, useRef, useState } from 'react'
import { POOL_TIER } from '../constants.js'

export default function GroupTabs({ groups, activeId, onSelect, onCreate, onDelete }) {
  const segRefs = useRef(new Map())
  const [thumb, setThumb] = useState({ x: 0, w: 0 })

  const measure = () => {
    const el = segRefs.current.get(activeId)
    if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth })
  }

  useLayoutEffect(measure, [activeId, groups])

  useLayoutEffect(() => {
    const el = segRefs.current.get(activeId)
    const track = el?.parentElement
    if (!el || !track) return
    const left = el.offsetLeft
    const right = left + el.offsetWidth
    if (left >= track.scrollLeft && right <= track.scrollLeft + track.clientWidth) return
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeId])

  useLayoutEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  })

  return (
    <div className="group-tabs-row">
      <div className="group-segs">
        <span className="seg-thumb" style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }} aria-hidden="true" />
        {groups.map(g => (
          <button
            key={g.id}
            type="button"
            ref={el => {
              if (el) segRefs.current.set(g.id, el)
              else segRefs.current.delete(g.id)
            }}
            className={'seg' + (g.id === activeId ? ' active' : '')}
            onClick={() => onSelect(g.id)}
            title={g.title}
          >
            <span className="seg-name">{g.title}</span>
            <span className="seg-count">{g.items.filter(i => i.tier !== POOL_TIER).length}</span>
            <span
              className="seg-close"
              role="button"
              tabIndex={0}
              title="删除分组"
              onClick={e => {
                e.stopPropagation()
                onDelete(g.id)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(g.id)
                }
              }}
            >
              ✕
            </span>
          </button>
        ))}
      </div>
      <button className="seg-add" type="button" title="新建分组" onClick={onCreate}>＋</button>
    </div>
  )
}
