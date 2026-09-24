import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Presupuesto } from '../api/types'
import { PresupuestoForm } from '../components/PresupuestoForm'
import { PresupuestoList } from '../components/PresupuestoList'
import { estaVencido, money } from '../ui/format'

export function PresupuestosPage() {
  const [items, setItems] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api<Presupuesto[]>('/api/presupuestos')
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la lista.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function facturar(id: number) {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      await api(`/api/facturas/facturar/${id}`, { method: 'POST' })
      setNotice('Presupuesto facturado.')
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo facturar.')
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
      {error && <p className="banner">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      <PresupuestoForm onCreated={load} />
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
