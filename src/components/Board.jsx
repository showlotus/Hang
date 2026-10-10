import { useEffect, useRef } from 'react'
import { POOL_TIER, TIERS } from '../constants.js'
import { tierStyle } from '../utils.js'
import ImagePool from './ImagePool.jsx'

const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

function Card({ item, tier }) {
  return (
    <div className="card" data-id={item.id} draggable style={tierStyle(tier)}>
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

  const clearOver = () => {
    document.querySelectorAll('.tier-row.over, .pool-zone.over').forEach(el => el.classList.remove('over'))
  }

  useEffect(() => {
    const onDocDragOver = e => {
      if (!dragIdRef.current) return
      const scroller = document.querySelector('.scroller')
      if (!scroller) return
      const m = 64
      if (e.clientY < m) scroller.scrollBy(0, -14)
      else if (window.innerHeight - e.clientY < m) scroller.scrollBy(0, 14)
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
    dragIdRef.current = card.dataset.id
    card.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', card.dataset.id)
    const rect = card.getBoundingClientRect()
    if (ghostRef.current) ghostRef.current.remove()
    const ghost = card.cloneNode(true)
    ghost.classList.remove('dragging')
    ghost.classList.add('drag-ghost')
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    e.dataTransfer.setDragImage(ghost, e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleDragEnd = () => {
    dragIdRef.current = null
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null }
    document.querySelectorAll('.dragging').forEach(c => c.classList.remove('dragging'))
    clearDropMark()
    requestAnimationFrame(clearDropMark)
    clearOver()
  }

  const handleDragOver = e => {
    const row = e.target.closest('.tier-row')
    const pool = row ? null : e.target.closest('.pool-zone')
    if (!row && !pool) return
    if (pool) {
      e.preventDefault()
      clearOver()
      pool.classList.add('over')
      if (dragIdRef.current) {
        const cards = [...pool.querySelectorAll('.card')].filter(c => c.dataset.id !== dragIdRef.current)
        let beforeId = null
        for (const c of cards) {
          const r = c.getBoundingClientRect()
          if (e.clientX < r.left + r.width / 2) { beforeId = c.dataset.id; break }
        }
        document.querySelectorAll('.drop-before').forEach(c => c.classList.remove('drop-before'))
        if (beforeId) {
          const target = pool.querySelector(`.card[data-id="${beforeId}"]`)
          if (target) target.classList.add('drop-before')
        }
        pool.dataset.beforeId = beforeId || ''
      }
      return
    }
    if (!dragIdRef.current) {
      if ([...e.dataTransfer.types].includes('Files')) {
        e.preventDefault()
        clearOver()
        row.classList.add('over')
      }
      return
    }
    e.preventDefault()
    clearOver()
    row.classList.add('over')
    const cards = [...row.querySelectorAll('.card')].filter(c => c.dataset.id !== dragIdRef.current)
    let beforeId = null
    for (const c of cards) {
      const r = c.getBoundingClientRect()
      if (e.clientX < r.left + r.width / 2) { beforeId = c.dataset.id; break }
    }
    document.querySelectorAll('.drop-before').forEach(c => c.classList.remove('drop-before'))
    if (beforeId) {
      const target = row.querySelector(`.card[data-id="${beforeId}"]`)
      if (target) target.classList.add('drop-before')
    }
    row.dataset.beforeId = beforeId || ''
  }

  const handleDrop = e => {
    const row = e.target.closest('.tier-row')
    const pool = row ? null : e.target.closest('.pool-zone')
    clearDropMark()
    if (row) {
      e.preventDefault()
      row.classList.remove('over')
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))
      if (files.length) { onAddFiles(files, row.dataset.key); return }
      if (!dragIdRef.current) return
      onMove(dragIdRef.current, row.dataset.key, row.dataset.beforeId || null)
      row.dataset.beforeId = ''
      return
    }
    if (pool) {
      e.preventDefault()
      pool.classList.remove('over')
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))
      if (files.length) { onAddFiles(files, POOL_TIER); return }
      if (dragIdRef.current) onMove(dragIdRef.current, POOL_TIER, pool.dataset.beforeId || null)
      pool.dataset.beforeId = ''
    }
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
    if (TOUCH && e.target.closest('.card')) e.preventDefault()
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ImagePool
        items={items.filter(i => i.tier === POOL_TIER)}
        onAddFiles={onAddFiles}
        onMoveMany={onMoveMany}
        onDelete={onDelete}
        onAddItem={onAddItem}
      />
      {TIERS.map(t => {
        const rowItems = items.filter(i => i.tier === t.key)
        return (
          <div key={t.key} className="tier-row" data-key={t.key} style={tierStyle(t)}>
            <div className="tier-label"><b>{t.label}</b><span>{t.desc}</span></div>
            <div className="tier-items flex min-h-[10.5rem] flex-1 flex-wrap content-start gap-2.5 p-0.5">
              {rowItems.length === 0 && <div className="tier-empty">拖入卡片</div>}
              {rowItems.map(it => <Card key={it.id} item={it} tier={t} />)}
            </div>
          </div>
        )
      })}
    </main>
  )
}
