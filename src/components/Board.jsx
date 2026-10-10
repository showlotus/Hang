import { useEffect, useLayoutEffect, useRef } from 'react'
import { IS_TOUCH, POOL_TIER, TIERS } from '../constants.js'
import { tierStyle } from '../utils.js'
import ImagePool from './ImagePool.jsx'

const POOL_TINT = { c1: 'color-mix(in srgb, var(--accent) 70%, #fff)', c2: 'color-mix(in srgb, #0561c9 70%, #fff)' }
const DRAG_READY_DELAY = 250
const TOUCH_CANCEL_DIST = 10
const TOUCH_START_DIST = 3
const CLICK_GUARD_MS = 350

function Card({ item, tier }) {
  return (
    <div className="card" data-id={item.id} draggable={!IS_TOUCH} style={tierStyle(tier)}>
      <div className="card-pic">
        {item.src ? (
          <img src={item.src} alt="" />
        ) : (
          <div className="fallback">{(item.name || '?').trim().charAt(0)}</div>
        )}
      </div>
      <div className="card-name">{item.name}</div>
      <div className="card-note">{item.note || ''}</div>
      <button className="card-del" type="button" title="删除">✕</button>
    </div>
  )
}

export default function Board({ items, onMove, onMoveMany, onAddFiles, onDelete, onEdit, onPreview, onAddItem }) {
  const dragIdRef = useRef(null)
  const ghostRef = useRef(null)
  const grabRef = useRef({ x: 0, y: 0 })
  const dragImgRef = useRef(null)
  const ghostTintRef = useRef(null)
  const dragReadyTimerRef = useRef(null)
  const touchRef = useRef(null)
  const clickGuardRef = useRef(0)
  const onMoveRef = useRef(onMove)
  const flipRef = useRef(null)

  useEffect(() => {
    onMoveRef.current = onMove
  })

  const clearOver = () => {
    document.querySelectorAll('.tier-row.over, .pool-zone.over').forEach(el => el.classList.remove('over'))
  }

  const clearDragReady = () => {
    if (dragReadyTimerRef.current) {
      clearTimeout(dragReadyTimerRef.current)
      dragReadyTimerRef.current = null
    }
    document.querySelectorAll('.card.drag-ready').forEach(c => c.classList.remove('drag-ready'))
  }

  const captureFlip = () => {
    const map = new Map()
    document.querySelectorAll('.card[data-id]').forEach(c => map.set(c.dataset.id, c.getBoundingClientRect()))
    flipRef.current = map
  }

  const playFlip = () => {
    const first = flipRef.current
    flipRef.current = null
    if (!first) return
    document.querySelectorAll('.card[data-id]').forEach(c => {
      const prev = first.get(c.dataset.id)
      if (!prev) return
      const last = c.getBoundingClientRect()
      const dx = prev.left - last.left
      const dy = prev.top - last.top
      if (!dx && !dy) return
      c.style.transition = 'none'
      c.style.transform = `translate(${dx}px, ${dy}px)`
      c.getBoundingClientRect()
      c.style.transition = ''
      c.style.transform = ''
    })
  }

  useLayoutEffect(() => {
    playFlip()
  })

  const tintGhost = row => {
    const g = ghostRef.current
    if (!g || ghostTintRef.current === row) return
    ghostTintRef.current = row
    if (row === 'pool') {
      g.style.setProperty('--c1', POOL_TINT.c1)
      g.style.setProperty('--c2', POOL_TINT.c2)
    } else {
      g.style.setProperty('--c1', row.style.getPropertyValue('--c1'))
      g.style.setProperty('--c2', row.style.getPropertyValue('--c2'))
    }
  }

  useEffect(() => {
    const onDocPointerUp = () => {
      clearDragReady()
      if (!dragIdRef.current) clearOver()
    }
    document.addEventListener('pointerup', onDocPointerUp)
    document.addEventListener('pointercancel', onDocPointerUp)
    return () => {
      clearDragReady()
      document.removeEventListener('pointerup', onDocPointerUp)
      document.removeEventListener('pointercancel', onDocPointerUp)
    }
  }, [])

  const markDragReady = card => {
    card.classList.add('drag-ready')
    const zone = card.closest('.tier-row, .pool-zone')
    if (zone) {
      clearOver()
      zone.classList.add('over')
    }
  }

  const autoScroll = clientY => {
    const scroller = document.querySelector('.scroller')
    if (!scroller) return
    const m = 64
    if (clientY < m) scroller.scrollBy(0, -14)
    else if (window.innerHeight - clientY < m) scroller.scrollBy(0, 14)
  }

  const markInsert = (zone, clientX) => {
    const cards = [...zone.querySelectorAll('.card')].filter(c => c.dataset.id !== dragIdRef.current)
    let beforeId = null
    for (const c of cards) {
      const r = c.getBoundingClientRect()
      if (clientX < r.left + r.width / 2) { beforeId = c.dataset.id; break }
    }
    document.querySelectorAll('.drop-before').forEach(c => c.classList.remove('drop-before'))
    if (beforeId) {
      const target = zone.querySelector(`.card[data-id="${beforeId}"]`)
      if (target) target.classList.add('drop-before')
    }
    zone.dataset.beforeId = beforeId || ''
  }

  const hoverDropZone = (zone, clientX) => {
    if (!zone) return
    clearOver()
    zone.classList.add('over')
    tintGhost(zone.classList.contains('pool-zone') ? 'pool' : zone)
    markInsert(zone, clientX)
  }

  const spawnGhost = (card, clientX, clientY) => {
    if (ghostRef.current) ghostRef.current.remove()
    const rect = card.getBoundingClientRect()
    const ghost = card.cloneNode(true)
    ghost.classList.remove('dragging')
    ghost.classList.add('drag-ghost')
    grabRef.current = { x: clientX - rect.left, y: clientY - rect.top }
    ghost.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`
    document.body.appendChild(ghost)
    ghostRef.current = ghost
  }

  useEffect(() => {
    const onDocDragOver = e => {
      const g = ghostRef.current
      if (g && dragIdRef.current) {
        const { x, y } = grabRef.current
        g.style.transform = `translate3d(${e.clientX - x}px, ${e.clientY - y}px, 0)`
      }
      if (!dragIdRef.current) return
      autoScroll(e.clientY)
    }
    document.addEventListener('dragover', onDocDragOver)
    return () => document.removeEventListener('dragover', onDocDragOver)
  }, [])

  const clearDropMark = () => {
    document.querySelectorAll('.drop-before').forEach(c => c.classList.remove('drop-before'))
  }

  const handleDragStart = e => {
    const card = e.target.closest('.card')
    if (!card) return
    clearDropMark()
    clearDragReady()
    dragIdRef.current = card.dataset.id
    card.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', card.dataset.id)
    spawnGhost(card, e.clientX, e.clientY)
    if (dragImgRef.current) dragImgRef.current.remove()
    const dot = document.createElement('div')
    dot.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;background:transparent;pointer-events:none;'
    document.body.appendChild(dot)
    dragImgRef.current = dot
    e.dataTransfer.setDragImage(dot, 0, 0)
  }

  const endDrag = () => {
    touchRef.current = null
    dragIdRef.current = null
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null }
    if (dragImgRef.current) { dragImgRef.current.remove(); dragImgRef.current = null }
    document.querySelectorAll('.dragging').forEach(c => c.classList.remove('dragging'))
    clearDragReady()
    ghostTintRef.current = null
    clearDropMark()
    requestAnimationFrame(clearDropMark)
    clearOver()
  }

  const dropOn = zone => {
    const id = dragIdRef.current
    if (id) {
      captureFlip()
      onMoveRef.current(id, zone.classList.contains('pool-zone') ? POOL_TIER : zone.dataset.key, zone.dataset.beforeId || null)
    }
    zone.dataset.beforeId = ''
    endDrag()
  }

  const handleDragOver = e => {
    const zone = e.target.closest('.tier-row, .pool-zone')
    if (!dragIdRef.current) {
      if (zone && zone.classList.contains('tier-row') && [...e.dataTransfer.types].includes('Files')) {
        e.preventDefault()
        clearOver()
        zone.classList.add('over')
      }
      return
    }
    if (!zone) return
    e.preventDefault()
    hoverDropZone(zone, e.clientX)
  }

  const handleDrop = e => {
    const row = e.target.closest('.tier-row')
    const zone = row || e.target.closest('.pool-zone')
    clearDropMark()
    if (!zone) return
    e.preventDefault()
    zone.classList.remove('over')
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))
    if (files.length) { onAddFiles(files, row ? row.dataset.key : POOL_TIER); return }
    if (dragIdRef.current) dropOn(zone)
  }

  const handleClick = e => {
    const del = e.target.closest('.card-del')
    if (del) {
      onDelete(del.closest('.card').dataset.id)
      return
    }
    if (e.target.matches('.card-pic img')) {
      const card = e.target.closest('.card')
      const it = items.find(x => x.id === card.dataset.id)
      if (it && it.src) onPreview(it, e.target)
    }
  }

  const handleContextMenu = e => {
    if (IS_TOUCH && e.target.closest('.card')) e.preventDefault()
  }

  const cancelTouchHold = () => {
    if (dragReadyTimerRef.current) {
      clearTimeout(dragReadyTimerRef.current)
      dragReadyTimerRef.current = null
    }
    touchRef.current = null
    clearDragReady()
    clearOver()
  }

  const beginTouchDrag = () => {
    dragReadyTimerRef.current = null
    const t = touchRef.current
    if (!t) return
    const card = t.card.isConnected ? t.card : document.querySelector(`.card[data-id="${t.id}"]`)
    if (!card) { touchRef.current = null; return }
    t.card = card
    t.ready = true
    markDragReady(card)
  }

  const startTouchDrag = e => {
    const t = touchRef.current
    const card = t.card
    clearDropMark()
    clearDragReady()
    dragIdRef.current = card.dataset.id
    card.classList.add('dragging')
    spawnGhost(card, e.clientX, e.clientY)
  }

  useEffect(() => {
    if (!IS_TOUCH) return
    const dist = (e, t) => Math.hypot(e.clientX - t.startX, e.clientY - t.startY)

    const onPointerMove = e => {
      const t = touchRef.current
      if (!t || e.pointerId !== t.pointerId) return
      if (!t.ready) {
        if (dist(e, t) > TOUCH_CANCEL_DIST) cancelTouchHold()
        return
      }
      if (!t.started) {
        if (dist(e, t) < TOUCH_START_DIST) return
        t.started = true
        startTouchDrag(e)
      }
      const g = ghostRef.current
      if (g && dragIdRef.current) {
        const { x, y } = grabRef.current
        g.style.transform = `translate3d(${e.clientX - x}px, ${e.clientY - y}px, 0)`
      }
      autoScroll(e.clientY)
      const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tier-row, .pool-zone') || null
      hoverDropZone(zone, e.clientX)
    }

    const onPointerUp = e => {
      const t = touchRef.current
      if (!t || e.pointerId !== t.pointerId) return
      touchRef.current = null
      if (t.started) {
        clickGuardRef.current = Date.now()
        const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tier-row, .pool-zone') || null
        if (zone && dragIdRef.current) dropOn(zone)
        else endDrag()
      } else {
        cancelTouchHold()
      }
    }

    const onPointerCancel = e => {
      const t = touchRef.current
      if (!t || e.pointerId !== t.pointerId) return
      touchRef.current = null
      if (t.started) endDrag()
      else cancelTouchHold()
    }

    const onTouchMove = e => {
      if (touchRef.current?.started) e.preventDefault()
    }

    const onClickCapture = e => {
      if (Date.now() - clickGuardRef.current < CLICK_GUARD_MS) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerCancel)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('click', onClickCapture, true)
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerCancel)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [])

  const handlePointerDown = e => {
    const card = e.target.closest('.card')
    if (!card) return
    if (!IS_TOUCH && !card.draggable) return
    if (e.target.closest('.card-del')) return
    if (IS_TOUCH && card.querySelector('.pool-check')) return
    clearDragReady()
    if (e.pointerType === 'touch') {
      touchRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, card, id: card.dataset.id, ready: false, started: false }
      dragReadyTimerRef.current = setTimeout(beginTouchDrag, DRAG_READY_DELAY)
      return
    }
    dragReadyTimerRef.current = setTimeout(() => markDragReady(card), DRAG_READY_DELAY)
  }

  const handleDoubleClick = e => {
    if (e.target.closest('.card-del')) return
    if (e.target.matches('.card-pic img')) return
    const card = e.target.closest('.card')
    if (card) onEdit(card.dataset.id)
  }

  return (
    <main
      className="mt-[1.125rem] flex flex-col gap-3"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onDragStart={handleDragStart}
      onDragEnd={endDrag}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ImagePool
        items={items.filter(i => i.tier === POOL_TIER)}
        onAddFiles={onAddFiles}
        onMoveMany={(ids, tier) => {
          captureFlip()
          onMoveMany(ids, tier)
        }}
        onDelete={onDelete}
        onAddItem={onAddItem}
      />
      {TIERS.map(t => {
        const rowItems = items.filter(i => i.tier === t.key)
        return (
          <div key={t.key} className="tier-row" data-key={t.key} style={tierStyle(t)}>
            <div className="tier-label"><b>{t.label}</b><i className="tier-sep">·</i><span>{t.desc}</span></div>
            <div className="tier-items relative flex min-h-[10.75rem] flex-1 flex-wrap content-start gap-2.5 px-0.5">
              <div className={'tier-empty' + (rowItems.length === 0 ? ' show' : '')}>拖入项目</div>
              {rowItems.map(it => <Card key={it.id} item={it} tier={t} />)}
            </div>
          </div>
        )
      })}
    </main>
  )
}
