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
}

export function PresupuestoList({ items, loading }: Props) {
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
          </tr>
        ))}
      </tbody>
    </table>
  )
}
