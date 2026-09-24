# NOTES

> Completá este archivo a medida que avanzás. Es parte de la entrega.

## Baseline (Phase 00 — 2026-09-24)

### `dotnet test` (pre-fix)

- Passed: 3 · Failed: 3 · Total: 6  
- Failures: mixed IVA totals; facturar without stock check; facturar twice without idempotency.

### Swagger Flow 1 (create → list → get by id)

1. **POST** `/api/Presupuestos` (`clienteId: 1`, one line ART-001) → **200**, `id: 1`, `numero: 1`, `estado: "Borrador"`, subtotal 35000, iva 7350, total 42350.  
2. **GET** `/api/Presupuestos` → **200**, body **`[]`** (empty).  
3. **GET** `/api/Presupuestos/1` → **200**, same presupuesto as created (`estado: Borrador`).

**Observation:** the entity is persisted and readable by id, but excluded from the list. Root cause hypothesis: create sets `Borrador` while `ListarAsync` filters `Estado != Borrador` (**Bug B2**).

Full matrix: `docs/phases/phase-00-baseline-results.md`.

## Bugs encontrados (backend)

<!-- Por cada bug: qué pasaba, por qué pasaba, cómo lo arreglaste. Update when fixing in Phases 01–03. -->

1. **(B2 — observed)** List empty after create while GET by id works — pending fix in Phase 02.  
2. **(B1 — fixed)** `CalcularTotales` applied a flat 21% on the summed subtotal (`subtotal * 0.21m`), so mixed rates were wrong (mixed test: expected IVA 231, actual 252). IVA is now calculated per line from `AlicuotaIva`, rounded to 2 decimals with `MidpointRounding.AwayFromZero`, then summed. Line subtotals stay unrounded before the sum. Discount still applies before IVA.  
3. **(B4/B5 — tests)** Facturar allows insufficient stock and double invoice — pending fix in Phase 03.  
4. **(B3 — code review)** Numeración `Count+1` — pending fix in Phase 02.  
5. **(B6 — code review)** No validation on cantidad/descuento — pending fix in Phase 01.

## Decisiones del cliente React

<!--
Estructura del proyecto, librerías que usaste y por qué, y cómo resolvés los
totales en vivo (subtotal, IVA, total) para que coincidan con el backend.
-->

## Qué hice y qué dejé afuera

<!-- Qué completaste, qué priorizaste y por qué, qué quedó pendiente. -->

## Cómo usé IA

<!--
Para qué partes la usaste, qué le pediste, qué aceptaste y qué descartaste,
y dónde se equivocó o te llevó por mal camino.
-->

## Qué haría con más tiempo / qué falta para producción

