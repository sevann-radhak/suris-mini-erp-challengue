import { useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '../api/client'
import type { Articulo } from '../api/types'
import { money } from '../ui/format'

interface Props {
  onAdd: (articulo: Articulo) => void
}

const minChars = 3

async function fetchArticulos(term: string) {
  const query = term ? `?${new URLSearchParams({ busqueda: term })}` : ''
  return api<Articulo[]>(`/api/articulos${query}`)
}

export function ArticuloSearch({ onAdd }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [results, setResults] = useState<Articulo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  const term = busqueda.trim()

  async function runSearch(query: string) {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchArticulos(query)
      if (id !== requestId.current) return
      setResults(data)
    } catch (err: unknown) {
      if (id !== requestId.current) return
      setResults([])
      setError(errorMessage(err, 'No se pudo buscar artículos.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (term.length < minChars) return

    const handle = window.setTimeout(() => {
      void runSearch(term)
    }, 250)

    return () => window.clearTimeout(handle)
  }, [term])

  function choose(articulo: Articulo) {
    requestId.current += 1
    onAdd(articulo)
    setResults([])
    setBusqueda('')
    setLoading(false)
  }

  function searchManually() {
    void runSearch(term)
  }

  return (
    <div>
      <div className="search">
        <label className="field">
          Buscar artículo
          <input
            value={busqueda}
            onChange={(event) => {
              const next = event.target.value
              setBusqueda(next)
              if (next.trim().length < minChars) {
                requestId.current += 1
                setResults([])
                setError(null)
                setLoading(false)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                if (results[0] && term.length >= minChars) choose(results[0])
                else void searchManually()
              }
            }}
            placeholder="Código o descripción"
            autoComplete="off"
          />
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => void searchManually()}>
          {term.length === 0 ? 'Ver todos' : 'Buscar'}
        </button>
      </div>
      {term.length > 0 && term.length < minChars && (
        <p className="hint">Desde 3 caracteres busca solo. Con menos, usá Buscar.</p>
      )}
      {loading && <p className="hint">Buscando…</p>}
      {error && <p className="banner">{error}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((articulo) => (
            <li key={articulo.id}>
              <button type="button" className="result" onClick={() => choose(articulo)}>
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
