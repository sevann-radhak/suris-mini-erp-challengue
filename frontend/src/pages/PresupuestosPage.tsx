import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Presupuesto } from '../api/types'
import { PresupuestoForm } from '../components/PresupuestoForm'
import { PresupuestoList } from '../components/PresupuestoList'

export function PresupuestosPage() {
  const [items, setItems] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <main>
      <h1>Presupuestos</h1>
      {error && <p className="banner">{error}</p>}
      <PresupuestoForm onCreated={load} />
      <PresupuestoList items={items} loading={loading} />
    </main>
  )
}
