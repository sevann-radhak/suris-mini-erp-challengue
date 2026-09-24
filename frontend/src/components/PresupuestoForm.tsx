import { useEffect, useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api/client'
import type { Articulo, Cliente, CrearPresupuesto } from '../api/types'
import { calcularTotales, subtotalLinea } from '../domain/totales'
import { money } from '../ui/format'
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

function NumberField({
  value,
  label,
  integer,
  onChange,
}: {
  value: number
  label?: string
  integer?: boolean
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={draft ?? String(value)}
      onFocus={(event) => {
        const input = event.currentTarget
        setDraft(String(value))
        requestAnimationFrame(() => input.select())
      }}
      onMouseUp={(event) => event.preventDefault()}
      onBlur={() => setDraft(null)}
      onChange={(event) => {
        const raw = event.target.value.replace(',', '.')
        const pattern = integer ? /^\d{0,6}$/ : /^\d{0,6}(\.\d{0,2})?$/
        if (raw !== '' && !pattern.test(raw)) return
        setDraft(raw)
        if (raw === '' || raw === '.') return
        onChange(Number(raw))
      }}
    />
  )
}

function DiscountField({
  value,
  label,
  onChange,
}: {
  value: number
  label: string
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      type="number"
      min={0}
      max={100}
      step="any"
      aria-label={label}
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onBlur={() => setDraft(null)}
      onChange={(event) => {
        const raw = event.target.value.replace(',', '.')
        if (raw !== '' && !/^-?\d{0,6}(\.\d{0,2})?$/.test(raw)) return
        setDraft(raw)
        if (raw === '' || raw === '-' || raw === '.') return
        const next = Number(raw)
        if (Number.isNaN(next)) return
        onChange(next)
      }}
    />
  )
}

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
  const [intentoCrear, setIntentoCrear] = useState(false)
  const [formVersion, setFormVersion] = useState(0)

  function resetForm() {
    setClienteId('')
    setValidezDias(15)
    setLineas([])
    setError(null)
    setIntentoCrear(false)
    setFormVersion((current) => current + 1)
  }

  useEffect(() => {
    api<Cliente[]>('/api/clientes')
      .then((data) => {
        setClientes(data)
      })
      .catch((err: unknown) => {
        setError(errorMessage(err, 'No se pudieron cargar los clientes.'))
      })
  }, [])

  function addArticulo(articulo: Articulo) {
    setLineas((current) => [
      ...current,
      {
        key: `${articulo.id}-${crypto.randomUUID()}`,
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
  const cantidadInvalida = lineas.some((linea) => linea.cantidad <= 0)
  const descuentoInvalido = lineas.some((linea) => linea.descuentoPct < 0 || linea.descuentoPct > 100)
  const faltantes = [
    !clienteId ? 'Seleccioná un cliente.' : null,
    lineas.length === 0 ? 'Agregá al menos un artículo.' : null,
    cantidadInvalida ? 'La cantidad debe ser mayor a cero.' : null,
    descuentoInvalido ? 'El descuento debe estar entre 0 y 100.' : null,
  ].filter((item): item is string => item !== null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setIntentoCrear(true)
    if (faltantes.length > 0) return
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
      resetForm()
      onCreated()
    } catch (err: unknown) {
      setError(errorMessage(err, 'No se pudo crear el presupuesto.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card" noValidate onSubmit={(event) => void submit(event)}>
      <div className="card-head">
        <div>
          <h2>Nuevo presupuesto</h2>
          <p>Elegí cliente, artículos y descuento. Los totales se calculan por línea.</p>
        </div>
      </div>
      {error && <p className="banner">{error}</p>}
      <p className="step">1 · Cliente y validez</p>
      <div className="fields">
        <label className="field">
          Cliente
          <select value={clienteId} onChange={(event) => setClienteId(event.target.value)}>
            <option value="">Seleccioná un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.razonSocial}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Validez (días)
          <NumberField key={formVersion} integer value={validezDias} onChange={setValidezDias} />
        </label>
      </div>
      {validezDias <= 0 && (
        <p className="hint">Con 0 días el presupuesto nace vencido y no se puede facturar.</p>
      )}
      <p className="step">2 · Artículos</p>
      <ArticuloSearch key={formVersion} onAdd={addArticulo} />
      {lineas.length === 0 && <p className="hint">Buscá un artículo y tocá el resultado para agregarlo.</p>}
      {lineas.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Artículo</th>
                <th className="num">Precio</th>
                <th className="num">IVA</th>
                <th>Cantidad</th>
                <th>Dto %</th>
                <th className="num">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.key}>
                  <td>
                    <span className="codigo">{linea.codigo}</span>
                    <div className="muted">{linea.descripcion}</div>
                  </td>
                  <td className="num">{money.format(linea.precioUnitario)}</td>
                  <td className="num">{linea.alicuotaIva}%</td>
                  <td>
                    <NumberField
                      label={`Cantidad de ${linea.codigo}`}
                      integer
                      value={linea.cantidad}
                      onChange={(cantidad) => updateLinea(linea.key, { cantidad })}
                    />
                  </td>
                  <td>
                    <DiscountField
                      label={`Descuento de ${linea.codigo}`}
                      value={linea.descuentoPct}
                      onChange={(descuentoPct) => updateLinea(linea.key, { descuentoPct })}
                    />
                  </td>
                  <td className="num">{money.format(subtotalLinea(linea))}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setLineas((current) => current.filter((item) => item.key !== linea.key))}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="step">3 · Confirmar totales</p>
      <div className="totals">
        <div>
          <span>Subtotal</span>
          <strong>{money.format(totales.subtotal)}</strong>
        </div>
        <div>
          <span>IVA</span>
          <strong>{money.format(totales.iva)}</strong>
        </div>
        <div className="grand">
          <span>Total</span>
          <strong>{money.format(totales.total)}</strong>
        </div>
      </div>
      {intentoCrear && faltantes.length > 0 && (
        <ul className="checks">
          {faltantes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={resetForm}>
          Limpiar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Crear presupuesto'}
        </button>
      </div>
    </form>
  )
}
