export interface LineaTotales {
  cantidad: number
  precioUnitario: number
  descuentoPct: number
  alicuotaIva: number
}

/** Half away from zero, matching .NET MidpointRounding.AwayFromZero on positive amounts. */
export function round2(value: number) {
  const sign = value < 0 ? -1 : 1
  return (sign * Math.round(Math.abs(value) * 100 + Number.EPSILON)) / 100
}

export function subtotalLinea(linea: LineaTotales) {
  return linea.cantidad * linea.precioUnitario * (1 - linea.descuentoPct / 100)
}

export function ivaLinea(subtotal: number, alicuotaIva: number) {
  return round2((subtotal * alicuotaIva) / 100)
}

export function calcularTotales(lineas: LineaTotales[]) {
  let subtotal = 0
  let iva = 0
  for (const linea of lineas) {
    const subtotalDeLinea = subtotalLinea(linea)
    subtotal += subtotalDeLinea
    iva += ivaLinea(subtotalDeLinea, linea.alicuotaIva)
  }
  return { subtotal, iva, total: subtotal + iva }
}
