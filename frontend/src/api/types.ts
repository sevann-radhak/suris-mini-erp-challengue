export interface Articulo {
  id: number
  codigo: string
  descripcion: string
  precioUnitario: number
  stockActual: number
  alicuotaIva: number
}

export interface Cliente {
  id: number
  razonSocial: string
  cuit: string
  condicionIva: string
}

export interface PresupuestoItem {
  articuloId: number
  articuloCodigo: string
  articuloDescripcion: string
  cantidad: number
  precioUnitario: number
  descuentoPct: number
  alicuotaIva: number
  subtotalLinea: number
}

export interface Presupuesto {
  id: number
  numero: number
  fecha: string
  clienteId: number
  clienteRazonSocial: string
  estado: string
  validezDias: number
  items: PresupuestoItem[]
  subtotal: number
  iva: number
  total: number
}

export interface CrearPresupuestoItem {
  articuloId: number
  cantidad: number
  descuentoPct: number
}

export interface CrearPresupuesto {
  clienteId: number
  validezDias: number
  items: CrearPresupuestoItem[]
}
