import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Articulo, Cliente, CrearPresupuesto } from '../api/types'
import { calcularTotales, subtotalLinea } from '../domain/totales'
import { ArticuloSearch } from './ArticuloSearch'

interface Linea {
  key: string
  articuloId: number
  codigo: string
  descripcion: string
  precioUnitario: number
  alicuotaIva: number
  cantidad: number
  descuentoPct: number
}

const money = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface Props {
  onCreated: () => void
}

export function PresupuestoForm({ onCreated }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [validezDias, setValidezDias] = useState(15)
  const [lineas, setLineas] = useState<Linea[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<Cliente[]>('/api/clientes')
      .then((data) => {
        setClientes(data)
        if (data[0]) setClienteId(String(data[0].id))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.')
      })
  }, [])

  function addArticulo(articulo: Articulo) {
    setLineas((current) => [
      ...current,
      {
        key: `${articulo.id}-${current.length}`,
        articuloId: articulo.id,
        codigo: articulo.codigo,
        descripcion: articulo.descripcion,
        precioUnitario: articulo.precioUnitario,
        alicuotaIva: articulo.alicuotaIva,
        cantidad: 1,
        descuentoPct: 0,
      },
    ])
  }

  function updateLinea(key: string, patch: Partial<Pick<Linea, 'cantidad' | 'descuentoPct'>>) {
    setLineas((current) => current.map((linea) => (linea.key === key ? { ...linea, ...patch } : linea)))
  }

  const totales = calcularTotales(lineas)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const body: CrearPresupuesto = {
      clienteId: Number(clienteId),
      validezDias,
      items: lineas.map((linea) => ({
        articuloId: linea.articuloId,
        cantidad: linea.cantidad,
        descuentoPct: linea.descuentoPct,
      })),
    }
    setSaving(true)
    try {
      await api('/api/presupuestos', { method: 'POST', body: JSON.stringify(body) })
      setLineas([])
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el presupuesto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <h2>Nuevo presupuesto</h2>
      {error && <p className="banner">{error}</p>}
      <div className="row">
        <label>
          Cliente
          <select value={clienteId} onChange={(event) => setClienteId(event.target.value)} required>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.razonSocial}
              </option>
            ))}
          </select>
        </label>
        <label>
          Validez (días)
          <input
            type="number"
            min={0}
            value={validezDias}
            onChange={(event) => setValidezDias(Number(event.target.value))}
          />
        </label>
      </div>
      <ArticuloSearch onAdd={addArticulo} />
      {lineas.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Precio</th>
              <th>IVA %</th>
              <th>Cantidad</th>
              <th>Descuento %</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea) => (
              <tr key={linea.key}>
                <td>
                  {linea.codigo} — {linea.descripcion}
                </td>
                <td>{money.format(linea.precioUnitario)}</td>
                <td>{linea.alicuotaIva}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={linea.cantidad}
                    onChange={(event) => updateLinea(linea.key, { cantidad: Number(event.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={linea.descuentoPct}
                    onChange={(event) => updateLinea(linea.key, { descuentoPct: Number(event.target.value) })}
                  />
                </td>
                <td>{money.format(subtotalLinea(linea))}</td>
                <td>
                  <button type="button" onClick={() => setLineas((current) => current.filter((item) => item.key !== linea.key))}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="totales">
        Subtotal {money.format(totales.subtotal)} · IVA {money.format(totales.iva)} · Total {money.format(totales.total)}
      </p>
      <button type="submit" disabled={saving || lineas.length === 0 || !clienteId}>
        {saving ? 'Guardando…' : 'Crear presupuesto'}
      </button>
    </form>
  )
}
