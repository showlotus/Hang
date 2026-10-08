import { useRef, useState } from 'react'
import { fileToDataURL } from '../utils.js'
import { useToast } from './ToastContext.jsx'

export default function PicDrop({ className = '', src, onSrc, deletable = false, tip = '上传图片' }) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const toast = useToast()

  const handleFile = async f => {
    if (!f) return
    try {
      onSrc(await fileToDataURL(f))
    } catch {
      toast('图片读取失败')
    }
  }

  return (
    <div
      className={'pic-drop' + (src ? ' has-pic' : '') + (over ? ' over' : '') + (className ? ' ' + className : '')}
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault()
        setOver(false)
        const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'))
        if (f) handleFile(f)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async e => {
          await handleFile(e.target.files[0])
          e.target.value = ''
        }}
      />
      <span hidden={!!src}>{tip}</span>
      <img src={src || undefined} alt="" hidden={!src} />
      {deletable && (
        <button
          className="pic-del"
          type="button"
          hidden={!src}
          onClick={e => {
            e.stopPropagation()
            inputRef.current.value = ''
            onSrc(null)
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
