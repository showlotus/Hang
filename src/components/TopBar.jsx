import { useEffect, useRef } from 'react'

export default function TopBar({ title, count, onTitleCommit, onCopy, onDownloadPNG, onExportJSON, onImportJSON }) {
  const h1Ref = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const h1 = h1Ref.current
    if (document.activeElement !== h1 && h1.textContent !== title) h1.textContent = title
  }, [title])

  const commit = () => {
    const h1 = h1Ref.current
    if (!h1.textContent.trim()) h1.innerHTML = ''
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
      <div className="flex flex-wrap gap-2.5">
        <button className="btn primary" type="button" onClick={onCopy}>复制</button>
        <button className="btn" type="button" onClick={onDownloadPNG}>下载 PNG</button>
        <button className="btn" type="button" onClick={onExportJSON}>导出 JSON</button>
        <button className="btn" type="button" onClick={() => fileRef.current.click()}>导入 JSON</button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImportJSON} />
      </div>
    </div>
  )
}
