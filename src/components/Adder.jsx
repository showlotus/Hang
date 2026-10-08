import { useState } from 'react'
import { uid } from '../utils.js'
import PicDrop from './PicDrop.jsx'
import TierPicker from './TierPicker.jsx'
import { useToast } from './ToastContext.jsx'

export default function Adder({ onAdd }) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [tier, setTier] = useState('hang')
  const [pic, setPic] = useState(null)
  const toast = useToast()

  const handleAdd = () => {
    const n = name.trim()
    if (!n) return toast('请输入名称')
    onAdd({ id: uid(), name: n, note: note.trim(), tier, src: pic })
    setName('')
    setNote('')
    setPic(null)
    toast('已添加')
  }

  return (
    <section className="adder">
      <PicDrop src={pic} onSrc={setPic} />
      <div className="fields flex min-w-[280px] flex-1 flex-col gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <label htmlFor="nameInput" className="field-label">名称</label>
          <input
            id="nameInput"
            type="text"
            className="flex-1"
            maxLength={20}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="flex min-w-0 items-center gap-2.5">
          <label htmlFor="noteInput" className="field-label">备注</label>
          <input
            id="noteInput"
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
        <div className="flex justify-end gap-2.5">
          <button className="btn primary" type="button" onClick={handleAdd}>添加</button>
        </div>
      </div>
    </section>
  )
}
