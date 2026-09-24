import { useState } from 'react'
import { api } from '../api/client'
import type { Articulo } from '../api/types'

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
    <div className="search">
      <label>
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
          placeholder="código o descripción"
        />
      </label>
      <button type="button" onClick={() => void search()}>
        Buscar
      </button>
      {error && <p className="banner">{error}</p>}
      {results.length > 0 && (
        <ul>
          {results.map((articulo) => (
            <li key={articulo.id}>
              <button type="button" onClick={() => onAdd(articulo)}>
                {articulo.codigo} — {articulo.descripcion} · ${articulo.precioUnitario} · IVA {articulo.alicuotaIva}% · stock {articulo.stockActual}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
