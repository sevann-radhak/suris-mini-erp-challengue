import type { Presupuesto } from '../api/types'

const money = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR')
}

interface Props {
  items: Presupuesto[]
  loading: boolean
  busyId: number | null
  onFacturar: (id: number) => void
}

export function PresupuestoList({ items, loading, busyId, onFacturar }: Props) {
  if (loading) return <p>Cargando presupuestos…</p>
  if (items.length === 0) return <p>No hay presupuestos para mostrar.</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Número</th>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Estado</th>
          <th>Subtotal</th>
          <th>IVA</th>
          <th>Total</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.numero}</td>
            <td>{formatDate(item.fecha)}</td>
            <td>{item.clienteRazonSocial}</td>
            <td>{item.estado}</td>
            <td>{money.format(item.subtotal)}</td>
            <td>{money.format(item.iva)}</td>
            <td>{money.format(item.total)}</td>
            <td>
              <button
                type="button"
                disabled={item.estado === 'Facturado' || busyId === item.id}
                onClick={() => onFacturar(item.id)}
              >
                {busyId === item.id ? 'Facturando…' : 'Facturar'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
