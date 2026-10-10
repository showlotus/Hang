import { useEffect, useRef, useState } from 'react'
import { IS_TOUCH, POOL_TIER, TIERS } from '../constants.js'
import Chevron from './Chevron.jsx'
import PopMenu from './PopMenu.jsx'
import { useHoverMenu } from '../hooks.js'

export default function ImagePool({ items, onAddFiles, onMoveMany, onDelete, onAddItem, confirmDelId }) {
  const [open, setOpen] = useState(true)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const {
    open: addOpen, setOpen: setAddOpen, wrapRef: addWrapRef,
    show: showAddMenu, hideLater: hideAddMenu,
  } = useHoverMenu()
  const {
    open: tierOpen, setOpen: setTierOpen, wrapRef: tierWrapRef,
    show: showTierMenu, hideLater: hideTierMenu,
  } = useHoverMenu()
  const inputRef = useRef(null)
  const gridRef = useRef(null)
  const heightRef = useRef(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const confirmTimer = useRef(null)

  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  const allSelected = items.length > 0 && items.every(it => selected.has(it.id))
  const selectedIds = () => items.filter(it => selected.has(it.id)).map(it => it.id)

  const resetConfirm = () => {
    setConfirmDel(false)
    clearTimeout(confirmTimer.current)
  }

  const toggleSelect = id => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    if (!next.size) resetConfirm()
  }

  const exitSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
    setTierOpen(false)
    resetConfirm()
  }

  const toggleAll = () => {
    const next = new Set(selected)
    if (allSelected) items.forEach(it => next.delete(it.id))
    else items.forEach(it => next.add(it.id))
    setSelected(next)
    if (!next.size) resetConfirm()
  }

  const batchAddTo = tierKey => {
    const ids = selectedIds()
    if (!ids.length) return
    onMoveMany(ids, tierKey)
    exitSelect()
  }

  const batchDelete = () => {
    const ids = selectedIds()
    if (!ids.length) return
    if (!confirmDel) {
      setConfirmDel(true)
      clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmDel(false), 3000)
      return
    }
    clearTimeout(confirmTimer.current)
    ids.forEach(id => onDelete(id))
    exitSelect()
  }

  const handleFiles = files => {
    const imgs = [...files].filter(f => f.type.startsWith('image/'))
    if (imgs.length) onAddFiles(imgs, POOL_TIER)
  }

  useEffect(() => {
    const grid = gridRef.current
    const wrap = heightRef.current
    if (!grid || !wrap) return
    const sync = () => { wrap.style.height = grid.offsetHeight + 'px' }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [])

  return (
    <section className={'pool-zone' + (open ? '' : ' collapsed')}>
      <div className="pool-head">
        <button
          className="pool-toggle"
          type="button"
          title={open ? '收起' : '展开'}
          onClick={() => setOpen(v => {
            if (v) exitSelect()
            return !v
          })}
        >
          <span className="pool-toggle-arrow"><Chevron size="1.125rem" /></span>
        </button>
        <span className="pool-title">待选区</span>
        <span className="pool-count">{items.length} 项</span>
        <div className="pool-head-actions">
          {items.length > 0 && (
            <button
              className={'btn pool-btn' + (selectMode ? ' primary' : '')}
              type="button"
              onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            >
              {selectMode ? '取消' : '选择'}
            </button>
          )}
          <div className="pop-wrap" ref={addWrapRef}>
            <button
              className="btn primary pool-btn"
              type="button"
              onClick={() => (addOpen ? setAddOpen(false) : showAddMenu())}
              onMouseEnter={() => showAddMenu()}
              onMouseLeave={() => hideAddMenu()}
            >
              ＋ 添加
            </button>
            {addOpen && (
              <PopMenu
                anchorRef={addWrapRef}
                onClose={() => setAddOpen(false)}
                onMouseEnter={() => showAddMenu()}
                onMouseLeave={() => hideAddMenu()}
              >
                <button type="button" onClick={() => { setAddOpen(false); onAddItem() }}>文字项目</button>
                <button type="button" onClick={() => { setAddOpen(false); inputRef.current.click() }}>上传图片</button>
              </PopMenu>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </div>
      <div className={'pool-collapse' + (open ? ' open' : '')}>
        <div className="pool-clip">
          <div className="pool-height" ref={heightRef}>
            <div className="pool-grid" ref={gridRef}>
              {items.length === 0 && (
                <div className="pool-empty">拖入图片或添加项目</div>
              )}
              {items.map(it => (
                <div
                  key={it.id}
                  className={'card pool-card' + (selected.has(it.id) ? ' selected' : '')}
                  data-id={it.id}
                  draggable={!IS_TOUCH && !selectMode}
                  onClick={e => {
                    if (e.target.closest('.card-del')) return
                    if (!selectMode) return
                    e.stopPropagation()
                    toggleSelect(it.id)
                  }}
                >
                  <div className="card-pic">
                    {it.src ? (
                      <img src={it.src} alt="" />
                    ) : (
                      <div className="fallback">{(it.name || '?').trim().charAt(0)}</div>
                    )}
                  </div>
                  <div className="card-name">{it.name}</div>
                  {selectMode && (
                    <span className={'pool-check' + (selected.has(it.id) ? ' on' : '')}>{selected.has(it.id) ? '✓' : ''}</span>
                  )}
                  <button className={'card-del' + (confirmDelId === it.id ? ' confirm' : '')} type="button" title={confirmDelId === it.id ? '再点一次确认删除' : '删除'}>{confirmDelId === it.id ? '✓' : '✕'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={'pool-collapse' + (selectMode ? ' open' : '')}>
        <div className="pool-clip">
          <div className="pool-actionbar-wrap">
            <span className="pool-batch-label">已选 {selectedIds().length} 项</span>
            <div className="pool-actionbar">
              <button className="btn pool-btn" type="button" onClick={toggleAll}>
                {allSelected ? '取消全选' : '全选'}
              </button>
              <div className="pop-wrap" ref={tierWrapRef}>
                <button
                  className="btn primary pool-btn"
                  type="button"
                  disabled={!selectedIds().length}
                  onClick={() => (tierOpen ? setTierOpen(false) : showTierMenu())}
                  onMouseEnter={() => showTierMenu()}
                  onMouseLeave={() => hideTierMenu()}
                >
                  加入
                  <Chevron size={13} className={'pop-caret' + (tierOpen ? ' open' : '')} />
                </button>
                {tierOpen && (
                  <PopMenu
                    anchorRef={tierWrapRef}
                    onClose={() => setTierOpen(false)}
                    onMouseEnter={() => showTierMenu()}
                    onMouseLeave={() => hideTierMenu()}
                  >
                    {TIERS.map(t => (
                      <button key={t.key} type="button" onClick={() => { setTierOpen(false); batchAddTo(t.key) }}>
                        <i className="tier-dot" style={{ background: t.c1 }}></i>{t.label}
                      </button>
                    ))}
                  </PopMenu>
                )}
              </div>
              <button
                className={'btn danger pool-btn' + (confirmDel ? ' confirm' : '')}
                type="button"
                disabled={!selectedIds().length}
                title={confirmDel ? '再点一次确认删除' : undefined}
                onClick={batchDelete}
              >{confirmDel ? '确认删除' : '删除所选'}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
