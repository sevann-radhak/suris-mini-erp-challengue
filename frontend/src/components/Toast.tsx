import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const dismissMs = 5000

export function Toast({
  message,
  tone,
  onClose,
}: {
  message: string
  tone: 'ok' | 'danger'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, dismissMs)
    return () => window.clearTimeout(timer)
  }, [message, tone, onClose])

  return createPortal(
    <div className="toaster">
      <div className={`toast toast-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
        <p>{message}</p>
        <button type="button" className="toast-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </div>
    </div>,
    document.body,
  )
}
