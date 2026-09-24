import { useState } from 'react'
import type { Presupuesto } from '../api/types'
import { estaVencido, estadoClass, formatDate, money } from '../ui/format'

interface Props {
  items: Presupuesto[]
  loading: boolean
  busyId: number | null
  duplicatingId: number | null
  onFacturar: (id: number) => void
  onDuplicar: (id: number) => void
}

const pageSizes = [10, 20, 50, 100]

export function PresupuestoList({ items, loading, busyId, duplicatingId, onFacturar, onDuplicar }: Props) {
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(pageIndex, pageCount - 1)
  const start = page * pageSize
  const visible = items.slice(start, start + pageSize)
  if (loading && items.length === 0) {
    return (
      <div className="loading" aria-busy="true">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="empty">Todavía no hay presupuestos. El primero que crees aparece acá.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th className="hide-sm">Fecha</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th className="num hide-sm">Subtotal</th>
            <th className="num hide-sm">IVA</th>
            <th className="num">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((item) => {
            const facturado = item.estado === 'Facturado'
            const vencido = !facturado && estaVencido(item.fecha, item.validezDias)
            const label = facturado ? 'Facturado' : vencido ? 'Vencido' : busyId === item.id ? 'Facturando…' : 'Facturar'
            return (
              <tr key={item.id}>
                <td className="codigo">{item.numero}</td>
                <td className="hide-sm">{formatDate(item.fecha)}</td>
                <td>{item.clienteRazonSocial}</td>
                <td>
                  <span className={vencido ? 'badge badge-rechazado' : estadoClass(item.estado)}>
                    {vencido ? 'Vencido' : item.estado}
                  </span>
                </td>
                <td className="num hide-sm">{money.format(item.subtotal)}</td>
                <td className="num hide-sm">{money.format(item.iva)}</td>
                <td className="num codigo">{money.format(item.total)}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={duplicatingId === item.id}
                    onClick={() => onDuplicar(item.id)}
                  >
                    {duplicatingId === item.id ? 'Duplicando…' : 'Duplicar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={facturado || vencido || busyId === item.id}
                    onClick={() => onFacturar(item.id)}
                  >
                    {label}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="pager">
        <span>
          {start + 1}–{start + visible.length} de {items.length}
        </span>
        <label>
          Por página
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPageIndex(0)
            }}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="pager-nav">
          <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPageIndex(page - 1)}>
            Anterior
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page >= pageCount - 1}
            onClick={() => setPageIndex(page + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
