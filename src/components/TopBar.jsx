import { useEffect, useRef } from 'react'
import Chevron from './Chevron.jsx'
import PopMenu from './PopMenu.jsx'
import { useHoverMenu } from '../hooks.js'

export default function TopBar({ title, count, onTitleCommit, onCopy, onDownloadPNG, onExportJSON, onImportJSON }) {
  const h1Ref = useRef(null)
  const fileRef = useRef(null)
  const {
    open: pngOpen, setOpen: setPngOpen, wrapRef: pngWrapRef,
    show: showPngMenu, hideLater: hidePngMenu,
  } = useHoverMenu()
  const {
    open: jsonOpen, setOpen: setJsonOpen, wrapRef: jsonWrapRef,
    show: showJsonMenu, hideLater: hideJsonMenu,
  } = useHoverMenu()

  useEffect(() => {
    const h1 = h1Ref.current
    if (document.activeElement !== h1 && h1.textContent !== title) h1.textContent = title
  }, [title])

  const commit = () => {
    const h1 = h1Ref.current
    if (!h1.textContent.trim()) h1.innerHTML = ''
    h1.scrollLeft = 0
    onTitleCommit(h1.textContent)
  }

  return (
    <div className="topbar">
      <div className="title-wrap">
        <h1
          ref={h1Ref}
          contentEditable
          spellCheck={false}
          suppressContentEditableWarning
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
        ></h1>
        <div className="subtitle">从夯到拉 · RANK LIST · 共 {count} 项</div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="pop-wrap" ref={jsonWrapRef}>
          <button
            className="btn pool-btn"
            type="button"
            onClick={() => (jsonOpen ? setJsonOpen(false) : showJsonMenu())}
            onMouseEnter={() => showJsonMenu()}
            onMouseLeave={() => hideJsonMenu()}
          >
            JSON
            <Chevron size={13} className={'pop-caret' + (jsonOpen ? ' open' : '')} />
          </button>
          {jsonOpen && (
            <PopMenu
              anchorRef={jsonWrapRef}
              onClose={() => setJsonOpen(false)}
              onMouseEnter={() => showJsonMenu()}
              onMouseLeave={() => hideJsonMenu()}
            >
              <button type="button" onClick={() => { setJsonOpen(false); fileRef.current.click() }}>导入</button>
              <button type="button" onClick={() => { setJsonOpen(false); onExportJSON() }}>导出</button>
            </PopMenu>
          )}
        </div>
        <div className="pop-wrap" ref={pngWrapRef}>
          <button
            className="btn primary pool-btn"
            type="button"
            onClick={() => (pngOpen ? setPngOpen(false) : showPngMenu())}
            onMouseEnter={() => showPngMenu()}
            onMouseLeave={() => hidePngMenu()}
          >
            PNG
            <Chevron size={13} className={'pop-caret' + (pngOpen ? ' open' : '')} />
          </button>
          {pngOpen && (
            <PopMenu
              anchorRef={pngWrapRef}
              onClose={() => setPngOpen(false)}
              onMouseEnter={() => showPngMenu()}
              onMouseLeave={() => hidePngMenu()}
            >
              <button type="button" onClick={() => { setPngOpen(false); onCopy() }}>复制</button>
              <button type="button" onClick={() => { setPngOpen(false); onDownloadPNG() }}>下载</button>
            </PopMenu>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImportJSON} />
      </div>
    </div>
  )
}
