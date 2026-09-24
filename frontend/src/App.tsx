import { useEffect, useState } from 'react'
import { PresupuestosPage } from './pages/PresupuestosPage'
import { ReporteTop } from './components/ReporteTop'

function currentPath() {
  return window.location.pathname === '/reportes' ? '/reportes' : '/'
}

export default function App() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const sync = () => setPath(currentPath())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  function go(next: '/' | '/reportes') {
    if (next === path) return
    window.history.pushState({}, '', next)
    setPath(next)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">M</div>
          <div>
            <p className="eyebrow">Operaciones</p>
            <h1>Mini ERP</h1>
          </div>
        </div>
        <nav className="nav">
          <button type="button" className={path === '/' ? 'nav-link active' : 'nav-link'} onClick={() => go('/')}>
            Presupuestos
          </button>
          <button type="button" className={path === '/reportes' ? 'nav-link active' : 'nav-link'} onClick={() => go('/reportes')}>
            Ranking
          </button>
        </nav>
      </header>
      {path === '/reportes' ? <ReporteTop /> : <PresupuestosPage />}
    </div>
  )
}
