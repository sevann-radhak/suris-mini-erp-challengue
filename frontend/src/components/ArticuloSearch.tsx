import { useState } from 'react'
import { api } from '../api/client'
import type { Articulo } from '../api/types'
import { money } from '../ui/format'

interface Props {
  onAdd: (articulo: Articulo) => void
}

export function ArticuloSearch({ onAdd }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [results, setResults] = useState<Articulo[]>([])
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setError(null)
    try {
      const query = new URLSearchParams({ busqueda })
      const data = await api<Articulo[]>(`/api/articulos?${query}`)
      setResults(data)
    } catch (err: unknown) {
      setResults([])
      setError(err instanceof Error ? err.message : 'No se pudo buscar artículos.')
    }
  }

  return (
    <div>
      <div className="search">
        <label className="field" style={{ flex: 1 }}>
          Buscar artículo
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void search()
              }
            }}
            placeholder="Código o descripción"
          />
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => void search()}>
          Buscar
        </button>
      </div>
      {error && <p className="banner">{error}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((articulo) => (
            <li key={articulo.id}>
              <button
                type="button"
                className="result"
                onClick={() => {
                  onAdd(articulo)
                  setResults([])
                  setBusqueda('')
                }}
              >
                <span>
                  <strong className="codigo">{articulo.codigo}</strong> {articulo.descripcion}
                  <br />
                  <small>
                    IVA {articulo.alicuotaIva}% · stock {articulo.stockActual}
                  </small>
                </span>
                <strong>{money.format(articulo.precioUnitario)}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
