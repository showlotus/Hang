import { useEffect, useRef, useState } from 'react'
import PicDrop from './PicDrop.jsx'
import TierPicker from './TierPicker.jsx'
import { useToast } from './ToastContext.jsx'

function EditForm({ item, onSave, onDelete }) {
  const [name, setName] = useState(item.name)
  const [note, setNote] = useState(item.note || '')
  const [tier, setTier] = useState(item.tier)
  const [src, setSrc] = useState(item.src || null)
  const [confirmDel, setConfirmDel] = useState(false)
  const confirmTimer = useRef(null)
  const toast = useToast()

  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  const handleSave = () => {
    const n = name.trim()
    if (!n) return toast('名称不能为空')
    setConfirmDel(false)
    clearTimeout(confirmTimer.current)
    onSave(item.id, { name: n, note: note.trim(), tier, src })
  }

  const handleDelete = () => {
    if (!confirmDel) {
      setConfirmDel(true)
      clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmDel(false), 3000)
    } else {
      clearTimeout(confirmTimer.current)
      onDelete(item.id)
    }
  }

  return (
    <>
      <PicDrop className="edit-pic" deletable src={src} onSrc={setSrc} />
      <div className="flex min-w-0 items-center gap-2.5">
        <label htmlFor="editName" className="field-label">名称</label>
        <input
          id="editName"
          type="text"
          className="flex-1"
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div className="flex min-w-0 items-center gap-2.5">
        <label htmlFor="editNote" className="field-label">备注</label>
        <input
          id="editNote"
          type="text"
          className="flex-1"
          maxLength={30}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="field-label">等级</span>
        <TierPicker value={tier} onChange={setTier} />
      </div>
      <div className="mt-1 flex justify-end gap-2.5">
        <button
          className={'btn danger' + (confirmDel ? ' confirm' : '')}
          type="button"
          title={confirmDel ? '再点一次确认删除' : '删除'}
          onClick={handleDelete}
        >{confirmDel ? '确认删除' : '删除'}</button>
        <button className="btn primary" type="button" onClick={handleSave}>保存</button>
      </div>
    </>
  )
}

export default function EditModal({ modal, onClose, onSave, onDelete }) {
  const open = !!modal?.open
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={'modal-mask' + (open ? ' show' : '')}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">
        <h3>编辑</h3>
        <button className="card-del modal-close" type="button" title="关闭" onClick={onClose}>✕</button>
        {modal && <EditForm key={modal.item.id + ':' + modal.seq} item={modal.item} onSave={onSave} onDelete={onDelete} />}
      </div>
    </div>
  )
}
