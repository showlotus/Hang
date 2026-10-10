import { useEffect, useRef, useState } from 'react'
import { copyPNG, downloadJSON, downloadPNG } from './exportCanvas.js'
import Blobs from './components/Blobs.jsx'
import Board from './components/Board.jsx'
import EditModal from './components/EditModal.jsx'
import GroupTabs from './components/GroupTabs.jsx'
import Lightbox from './components/Lightbox.jsx'
import TopBar from './components/TopBar.jsx'
import { useToast } from './components/ToastContext.jsx'
import { POOL_TIER } from './constants.js'
import { deleteGroupRecord, loadState, saveGroup, saveMeta } from './storage.js'
import { fileToDataURL, normalizeItems, uid } from './utils.js'

const EMPTY = []

const HINT = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  ? '上传图片进待选区 · 长按拖动定级 · 双击编辑 · 点击图片预览'
  : '上传图片进待选区 · 拖到等级行定级 · 双击编辑 · 点击图片预览'

export default function App() {
  const [groups, setGroups] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [ready, setReady] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const toast = useToast()

  const active = groups.find(g => g.id === activeId)
  const items = active ? active.items : EMPTY
  const title = active ? active.title : ''
  const rankCount = items.filter(i => i.tier !== POOL_TIER).length

  useEffect(() => {
    let alive = true
    loadState().then(data => {
      if (!alive) return
      setGroups(data.groups)
      setActiveId(data.activeGroupId)
      setReady(true)
    })
    return () => { alive = false }
  }, [])

  const openEdit = id => {
    setEditModal(m => ({ item: items.find(i => i.id === id), seq: (m ? m.seq : 0) + 1, open: true }))
  }

  const closeEdit = () => setEditModal(m => (m ? { ...m, open: false } : m))

  const saveTimer = useRef(null)
  const pendingRef = useRef(null)
  const lastMetaRef = useRef('')
  useEffect(() => {
    if (!ready || !activeId) return
    const snapshot = { id: activeId, title: title.trim(), items }
    const prev = pendingRef.current
    if (prev && prev.id !== activeId) saveGroup(prev).catch(() => toast('缓存失败：本地存储写入异常'))
    pendingRef.current = snapshot
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveGroup(snapshot).catch(() => toast('缓存失败：本地存储写入异常'))
    }, 250)
    return () => clearTimeout(saveTimer.current)
  }, [items, title, activeId, ready, toast])

  useEffect(() => {
    if (!ready || !activeId) return
    const order = groups.map(g => g.id)
    const key = activeId + '|' + order.join('\n')
    if (lastMetaRef.current === key) return
    lastMetaRef.current = key
    saveMeta({ activeGroupId: activeId, order }).catch(() => toast('缓存失败：本地存储写入异常'))
  }, [activeId, groups, ready, toast])

  const mutateItems = fn => {
    setGroups(prev => prev.map(g => (g.id === activeId ? { ...g, items: fn(g.items) } : g)))
  }

  const commitTitle = t => {
    setGroups(prev => prev.map(g => (g.id === activeId ? { ...g, title: t } : g)))
  }

  const selectGroup = id => {
    if (id !== activeId) setActiveId(id)
  }

  const createGroup = () => {
    const used = new Set(groups.map(g => g.title))
    let n = groups.length + 1
    while (used.has(`排行榜 ${n}`)) n++
    const g = { id: uid(), title: `排行榜 ${n}`, items: [] }
    setGroups(prev => [...prev, g])
    setActiveId(g.id)
    toast('已新建分组')
  }

  const removeGroup = id => {
    const g = groups.find(x => x.id === id)
    if (!g) return
    const poolCount = g.items.filter(i => i.tier === POOL_TIER).length
    const detail = [g.items.length - poolCount ? `${g.items.length - poolCount} 个已排级项目` : '', poolCount ? `${poolCount} 个待选区项目` : '']
      .filter(Boolean).join(' · ')
    if (!confirm(`删除分组「${g.title}」${detail ? '（' + detail + '）' : ''}？此操作不可恢复。`)) return
    if (pendingRef.current && pendingRef.current.id === id) pendingRef.current = null
    deleteGroupRecord(id).catch(() => {})
    const idx = groups.findIndex(x => x.id === id)
    let rest = groups.filter(x => x.id !== id)
    if (!rest.length) rest = [{ id: uid(), title: '排行榜', items: [] }]
    setGroups(rest)
    if (activeId === id) setActiveId(rest[Math.min(idx, rest.length - 1)].id)
    toast('已删除分组')
  }

  const addItem = item => {
    mutateItems(prev => [...prev, item])
  }

  const addTextItem = () => {
    const names = new Set(items.filter(i => i.tier === POOL_TIER).map(i => i.name))
    let n = 1
    while (names.has(`项目 ${n}`)) n++
    addItem({ id: uid(), name: `项目 ${n}`, note: '', tier: POOL_TIER, src: null })
    toast('已添加文字项目')
  }

  const moveItem = (id, tierKey, beforeId) => {
    mutateItems(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx < 0) return prev
      const it = { ...prev[idx], tier: tierKey }
      const rest = prev.filter(i => i.id !== id)
      const bi = beforeId ? rest.findIndex(i => i.id === beforeId) : -1
      const at = bi < 0 ? rest.length : bi
      return [...rest.slice(0, at), it, ...rest.slice(at)]
    })
  }

  const moveItemsToTier = (ids, tierKey) => {
    ids.forEach(id => moveItem(id, tierKey, null))
  }

  const deleteItem = id => mutateItems(prev => prev.filter(i => i.id !== id))

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
    if (added.length) mutateItems(prev => [...prev, ...added])
    toast(`已添加 ${files.length} 个项目`)
  }

  const saveEdit = (id, patch) => {
    mutateItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
    closeEdit()
    toast('已保存')
  }

  const deleteEdit = id => {
    mutateItems(prev => prev.filter(i => i.id !== id))
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
    const list = normalizeItems(data.items)
    if (!list.length) return toast('文件中没有有效项目')
    const g = {
      id: uid(),
      title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : '导入的排行榜',
      items: list,
    }
    if (!confirm(`将导入为新分组「${g.title}」，共 ${list.length} 项，继续？`)) return
    setGroups(prev => [...prev, g])
    setActiveId(g.id)
    toast(`已导入 ${list.length} 项`)
  }

  if (!ready) return null

  return (
    <>
      <Blobs />
      <div className="scroller">
        <div className="page-head">
          <GroupTabs
            groups={groups}
            activeId={activeId}
            onSelect={selectGroup}
            onCreate={createGroup}
            onDelete={removeGroup}
          />
          <TopBar
            title={title}
            count={rankCount}
            onTitleCommit={commitTitle}
            onCopy={() => copyPNG(items, title, toast)}
            onDownloadPNG={() => downloadPNG(items, title, toast)}
            onExportJSON={() => downloadJSON(items, title, toast)}
            onImportJSON={handleImport}
          />
        </div>
        <div className="mx-auto max-w-[80rem]">
          <Board
            items={items}
            onMove={moveItem}
            onMoveMany={moveItemsToTier}
            onAddFiles={addFiles}
            onDelete={deleteItem}
            onEdit={openEdit}
            onAddItem={addTextItem}
            onPreview={(it, el) => setLightbox({ item: it, originEl: el })}
          />
          <p className="mt-3 text-center text-[0.78125rem] text-[#64748b]">{HINT}</p>
        </div>
      </div>
      <EditModal modal={editModal} onClose={closeEdit} onSave={saveEdit} onDelete={deleteEdit} />
      <Lightbox state={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}
