# NOTES

> Completá este archivo a medida que avanzás. Es parte de la entrega.

## Baseline (Phase 00: 2026-09-24)

### `dotnet test` (pre-fix)

- Passed: 3 · Failed: 3 · Total: 6  
- Failures: mixed IVA totals; facturar without stock check; facturar twice without idempotency.

### Swagger Flow 1 (create → list → get by id)

1. **POST** `/api/Presupuestos` (`clienteId: 1`, one line ART-001) → **200**, `id: 1`, `numero: 1`, `estado: "Borrador"`, subtotal 35000, iva 7350, total 42350.
2. **GET** `/api/Presupuestos` → **200**, body `[]` (empty).
3. **GET** `/api/Presupuestos/1` → **200**, same presupuesto as created (`estado: Borrador`).

**Observation:** the entity is persisted and readable by id, but excluded from the list. Root cause hypothesis: create sets `Borrador` while `ListarAsync` filters `Estado != Borrador` (**Bug B2**).

Full matrix: `docs/phases/phase-00-baseline-results.md`.

## Bugs encontrados (backend)



1. **(B2: fixed)** Create set `Borrador` and `ListarAsync` excluded `Borrador`, so GET list was empty after POST. Create now sets `Aprobado` (option A). The list filter stays, so drafts are hidden and a new presupuesto shows up and can be invoiced. `Rechazado` is still listed.
2. **(B1: fixed)** `CalcularTotales` applied a flat 21% on the summed subtotal (`subtotal * 0.21m`), so mixed rates were wrong (mixed test: expected IVA 231, actual 252). IVA is now calculated per line from `AlicuotaIva`, rounded to 2 decimals with `MidpointRounding.AwayFromZero`, then summed. Line subtotals stay unrounded before the sum. Discount still applies before IVA.
3. **(B5: fixed)** `FacturarAsync` never checked `Estado`, so a second call invoiced again and subtracted stock twice. It now throws before any stock change when the presupuesto is already `Facturado`.
4. **(B4: fixed)** Stock was decremented with no availability check, so an over-quantity invoice could go negative. Demand is summed per article and checked against `StockActual` before any decrement; one `SaveChangesAsync` persists stock, factura, and `Facturado` together.
5. **(B3: fixed)** `ProximoNumeroPresupuestoAsync` used `Count+1`, so a delete reused a number. It now uses `Max(Numero)+1`, same as facturas. Two concurrent creates could still race on SQLite; a sequence or row lock is out of scope for this challenge.
6. **(B6: fixed)** `CrearAsync` snapshotted price and alícuota and saved without checking line inputs. It now rejects an empty item list, `cantidad <= 0`, and `descuentoPct` outside `[0, 100]` with `InvalidOperationException` (API returns 400 `{ error }`). Checked via API: `cantidad: 0` → "La cantidad debe ser mayor a cero."; `descuentoPct: 150` → "El descuento debe estar entre 0 y 100." Mixed create ART-001 + ART-004 → subtotal 39500, iva 7822.50, total 47322.50.



## Decisiones del cliente React



## Qué hice y qué dejé afuera



## Cómo usé IA



## Qué haría con más tiempo / qué falta para producción

