import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Presupuesto } from '../api/types'
import { PresupuestoList } from '../components/PresupuestoList'

export function PresupuestosPage() {
  const [items, setItems] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api<Presupuesto[]>('/api/presupuestos')
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la lista.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <main>
      <h1>Presupuestos</h1>
      {error && <p className="banner">{error}</p>}
      <PresupuestoList items={items} loading={loading} />
    </main>
  )
}
