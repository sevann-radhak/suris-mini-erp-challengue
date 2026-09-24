import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import type { Presupuesto } from '../api/types'
import { PresupuestoForm } from '../components/PresupuestoForm'
import { PresupuestoList } from '../components/PresupuestoList'
import { Toast } from '../components/Toast'
import { estaVencido, money } from '../ui/format'

type ToastMessage = { id: number; text: string; tone: 'ok' | 'danger' }

function fetchPresupuestos() {
  return api<Presupuesto[]>('/api/presupuestos')
}

export function PresupuestosPage() {
  const [items, setItems] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const dismiss = useCallback(() => setToast(null), [])

  const notify = useCallback((text: string, tone: ToastMessage['tone']) => {
    setToast({ id: Date.now(), text, tone })
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    fetchPresupuestos()
      .then(setItems)
      .catch((err: unknown) => {
        notify(errorMessage(err, 'No se pudo cargar la lista.'), 'danger')
      })
      .finally(() => setLoading(false))
  }, [notify])

  useEffect(() => {
    let cancelled = false
    fetchPresupuestos()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) notify(errorMessage(err, 'No se pudo cargar la lista.'), 'danger')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [notify])

  async function facturar(id: number) {
    setBusyId(id)
    try {
      await api(`/api/facturas/facturar/${id}`, { method: 'POST' })
      notify('Presupuesto facturado.', 'ok')
      load()
    } catch (err: unknown) {
      notify(errorMessage(err, 'No se pudo facturar.'), 'danger')
    } finally {
      setBusyId(null)
    }
  }

  const facturados = items.filter((item) => item.estado === 'Facturado')
  const porFacturar = items.filter((item) => item.estado !== 'Facturado' && !estaVencido(item.fecha, item.validezDias))
  const montoPendiente = porFacturar.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">M</div>
          <div>
            <p className="eyebrow">Operaciones</p>
            <h1>Mini ERP</h1>
          </div>
        </div>
      </header>
      <section className="stats">
        <div className="stat">
          <span>Por facturar</span>
          <strong>{porFacturar.length}</strong>
        </div>
        <div className="stat">
          <span>Facturados</span>
          <strong>{facturados.length}</strong>
        </div>
        <div className="stat">
          <span>Pendiente</span>
          <strong>{money.format(montoPendiente)}</strong>
        </div>
      </section>
      {toast && <Toast key={toast.id} message={toast.text} tone={toast.tone} onClose={dismiss} />}
      <PresupuestoForm
        onCreated={() => {
          notify('Presupuesto creado.', 'ok')
          load()
        }}
      />
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Presupuestos</h2>
            <p>Solo se puede facturar lo aprobado, con stock y dentro de la validez.</p>
          </div>
        </div>
        <PresupuestoList items={items} loading={loading} busyId={busyId} onFacturar={(id) => void facturar(id)} />
      </section>
    </div>
  )
}
