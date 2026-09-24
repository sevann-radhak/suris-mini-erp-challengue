import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api/client'
import { money } from '../ui/format'

interface Fila {
  articuloId: number
  codigo: string
  descripcion: string
  monto: number
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

export function ReporteTop() {
  const [desde, setDesde] = useState(hoyIso())
  const [hasta, setHasta] = useState(hoyIso())
  const [top, setTop] = useState(5)
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const query = new URLSearchParams({ desde, hasta, top: String(top) })
    try {
      setFilas(await api<Fila[]>(`/api/reportes/top-articulos?${query}`))
    } catch (err: unknown) {
      setFilas(null)
      setError(errorMessage(err, 'No se pudo armar el reporte.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Artículos más facturados</h2>
          <p>Top por monto facturado, IVA incluido, en el rango de fechas.</p>
        </div>
      </div>
      <form className="filters" onSubmit={(event) => void submit(event)}>
        <label className="field">
          Desde
          <input type="date" value={desde} onChange={(event) => setDesde(event.target.value)} required />
        </label>
        <label className="field">
          Hasta
          <input type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} required />
        </label>
        <label className="field">
          Top
          <input type="number" min={1} value={top} onChange={(event) => setTop(Number(event.target.value))} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Calculando…' : 'Ver ranking'}
        </button>
      </form>
      {error && <p className="banner">{error}</p>}
      {filas && filas.length === 0 && <p className="empty">No hay artículos facturados en ese rango.</p>}
      {filas && filas.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Código</th>
                <th>Descripción</th>
                <th className="num">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, index) => (
                <tr key={fila.articuloId}>
                  <td className="codigo">{index + 1}</td>
                  <td className="codigo">{fila.codigo}</td>
                  <td>{fila.descripcion}</td>
                  <td className="num">{money.format(fila.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
