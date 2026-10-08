import { useCallback, useRef, useState } from 'react'
import { ToastCtx } from './ToastContext.jsx'

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const timer = useRef(null)
  const toast = useCallback(m => {
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 2400)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (msg ? ' show' : '')}>{msg}</div>
    </ToastCtx.Provider>
  )
}
