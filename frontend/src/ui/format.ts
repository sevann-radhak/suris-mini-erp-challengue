export const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
})

function parseApiDate(value: string) {
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

export function formatDate(value: string) {
  return parseApiDate(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function estaVencido(fecha: string, validezDias: number) {
  const inicio = parseApiDate(fecha).getTime()
  if (Number.isNaN(inicio)) return false
  return Date.now() > inicio + validezDias * 24 * 60 * 60 * 1000
}

export function estadoClass(estado: string) {
  const key = estado.toLowerCase()
  if (key === 'aprobado' || key === 'facturado' || key === 'rechazado') return `badge badge-${key}`
  return 'badge'
}
