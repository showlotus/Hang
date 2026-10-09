import { useRef, useState } from 'react'
import { POOL_TIER, TIERS } from '../constants.js'
import Chevron from './Chevron.jsx'
import PopMenu from './PopMenu.jsx'
import { useHoverMenu } from '../hooks.js'

export default function ImagePool({ items, onAddFiles, onMoveMany, onDelete, onAddItem }) {
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

  const allSelected = items.length > 0 && items.every(it => selected.has(it.id))
  const selectedIds = () => items.filter(it => selected.has(it.id)).map(it => it.id)

  const toggleSelect = id => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const exitSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
    setTierOpen(false)
  }

  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev)
    if (allSelected) items.forEach(it => next.delete(it.id))
    else items.forEach(it => next.add(it.id))
    return next
  })

  const batchAddTo = tierKey => {
    const ids = selectedIds()
    if (!ids.length) return
    onMoveMany(ids, tierKey)
    exitSelect()
  }

  const batchDelete = () => {
    const ids = selectedIds()
    if (!ids.length) return
    ids.forEach(id => onDelete(id))
    exitSelect()
  }

  const handleFiles = files => {
    const imgs = [...files].filter(f => f.type.startsWith('image/'))
    if (imgs.length) onAddFiles(imgs, POOL_TIER)
  }

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
          <span className="pool-toggle-arrow"><Chevron size={18} /></span>
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
                <button type="button" onClick={() => { setAddOpen(false); onAddItem() }}>文字条目</button>
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
          <div className="pool-grid">
            {items.length === 0 && (
              <div className="pool-empty">上传图片或拖入图片文件，也可添加文字条目，再拖到下方等级行</div>
            )}
          {items.map(it => (
            <div
              key={it.id}
              className={'card pool-card' + (selected.has(it.id) ? ' selected' : '')}
              data-id={it.id}
              draggable={!selectMode}
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
              <button className="card-del" type="button" title="删除">✕</button>
            </div>
          ))}
          </div>
        </div>
      </div>
      <div className={'pool-collapse' + (selectMode ? ' open' : '')}>
        <div className="pool-clip">
          <div className="pool-actionbar">
            <span className="pool-batch-label">已选 {selectedIds().length} 项</span>
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
            <button className="btn danger pool-btn" type="button" disabled={!selectedIds().length} onClick={batchDelete}>删除所选</button>
          </div>
        </div>
      </div>
    </section>
  )
}
