import { useEffect, useRef, useState } from 'react'
import { copyPNG, downloadJSON, downloadPNG } from './exportCanvas.js'
import Adder from './components/Adder.jsx'
import Blobs from './components/Blobs.jsx'
import Board from './components/Board.jsx'
import EditModal from './components/EditModal.jsx'
import Lightbox from './components/Lightbox.jsx'
import TopBar from './components/TopBar.jsx'
import { useToast } from './components/ToastContext.jsx'
import { TIERS } from './constants.js'
import { loadState, saveState } from './storage.js'
import { fileToDataURL, uid } from './utils.js'

export default function App() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('排行榜')
  const [ready, setReady] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const toast = useToast()

  useEffect(() => {
    let alive = true
    loadState().then(data => {
      if (!alive) return
      setItems(data.items)
      setTitle(data.title)
      setReady(true)
    })
    return () => { alive = false }
  }, [])

  const openEdit = id => {
    setEditModal(m => ({ item: items.find(i => i.id === id), seq: (m ? m.seq : 0) + 1, open: true }))
  }

  const closeEdit = () => setEditModal(m => (m ? { ...m, open: false } : m))

  const saveTimer = useRef(null)
  useEffect(() => {
    if (!ready) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveState({ title: title.trim(), items }).catch(() => toast('缓存失败：本地存储写入异常'))
    }, 250)
    return () => clearTimeout(saveTimer.current)
  }, [items, title, ready, toast])

  const addItem = item => {
    setItems(prev => [...prev, item])
  }

  const moveItem = (id, tierKey, beforeId) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx < 0) return prev
      const it = { ...prev[idx], tier: tierKey }
      const rest = prev.filter(i => i.id !== id)
      const bi = beforeId ? rest.findIndex(i => i.id === beforeId) : -1
      const at = bi < 0 ? rest.length : bi
      return [...rest.slice(0, at), it, ...rest.slice(at)]
    })
  }

  const deleteItem = id => setItems(prev => prev.filter(i => i.id !== id))

  const addFiles = async (files, tierKey) => {
    const added = []
    let failed = false
    for (const f of files) {
      try {
        const src = await fileToDataURL(f)
        added.push({ id: uid(), name: f.name.replace(/\.[^.]+$/, ''), note: '', tier: tierKey, src })
      } catch { failed = true }
    }
    if (failed) toast('有文件读取失败')
    if (added.length) setItems(prev => [...prev, ...added])
    toast(`已添加 ${files.length} 个条目`)
  }

  const saveEdit = (id, patch) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
    closeEdit()
    toast('已保存')
  }

  const deleteEdit = id => {
    setItems(prev => prev.filter(i => i.id !== id))
    closeEdit()
    toast('已删除')
  }

  const handleImport = async e => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    let data
    try { data = JSON.parse(await file.text()) }
    catch { return toast('文件不是有效的 JSON') }
    if (!data || !Array.isArray(data.items)) return toast('文件格式不正确')
    const keys = new Set(TIERS.map(t => t.key))
    const list = data.items.filter(it => it && it.id && typeof it.name === 'string').map(it => ({
      id: it.id,
      name: it.name,
      note: typeof it.note === 'string' ? it.note : '',
      tier: keys.has(it.tier) ? it.tier : 'rsr',
      src: typeof it.src === 'string' ? it.src : null,
    }))
    if (!confirm(`将导入 ${list.length} 项，覆盖当前 ${items.length} 项，继续？`)) return
    setItems(list)
    if (typeof data.title === 'string' && data.title) setTitle(data.title)
    toast(`已导入 ${list.length} 项`)
  }

  if (!ready) return null

  return (
    <>
      <Blobs />
      <div className="scroller">
        <TopBar
          title={title}
          count={items.length}
          onTitleCommit={setTitle}
          onCopy={() => copyPNG(items, title, toast)}
          onDownloadPNG={() => downloadPNG(items, title, toast)}
          onExportJSON={() => downloadJSON(items, title, toast)}
          onImportJSON={handleImport}
        />
        <div className="mx-auto max-w-[1280px]">
          <Adder onAdd={addItem} />
          <Board
            items={items}
            onMove={moveItem}
            onAddFiles={addFiles}
            onDelete={deleteItem}
            onEdit={openEdit}
            onPreview={(it, el) => setLightbox({ item: it, originEl: el })}
          />
          <p className="mt-3 text-center text-[12.5px] text-[#64748b]">拖拽换级排序 · 点击图片预览 · 双击名称编辑 · 支持拖入图片文件</p>
        </div>
      </div>
      <EditModal modal={editModal} onClose={closeEdit} onSave={saveEdit} onDelete={deleteEdit} />
      <Lightbox state={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}
