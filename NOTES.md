# NOTES

## Bugs encontrados (backend)

Baseline antes de corregir: `dotnet test` daba 3 passed y 3 failed (IVA mixto, facturar sin stock, facturar dos veces). En Swagger, un POST creaba el presupuesto en `Borrador` y el GET de la lista volvía vacío.

1. **IVA (arreglado).** `CalcularTotales` aplicaba 21 % fijo sobre el subtotal sumado (`subtotal * 0.21`). Con alícuotas mezcladas el test esperaba IVA 231 y devolvía 252. Ahora el IVA se calcula por línea según `AlicuotaIva`, se redondea a 2 decimales con `MidpointRounding.AwayFromZero` y recién después se suma. El subtotal de línea no se redondea antes de esa suma. El descuento sigue aplicándose antes del IVA.
2. **Lista vacía después de crear (arreglado).** El alta guardaba `Borrador` y el listado excluía ese estado, así que el presupuesto existía por id pero no aparecía en la grilla. El alta ahora queda en `Aprobado`. El filtro de borradores se mantiene. `Rechazado` sigue listándose.
3. **Numeración (arreglado).** El próximo número de presupuesto era `Count + 1`, así que borrar el último reutilizaba un número. Ahora hay una tabla `Numeraciones`: el primer número sale de `Max(Numero) + 1` y los siguientes incrementan ese contador, así que borrar el último no lo reutiliza. Número de presupuesto, número de factura y `Facturas.PresupuestoId` tienen índice único.
4. **Stock (arreglado).** Facturar restaba stock sin mirar el disponible, y podía quedar negativo. La demanda se suma por artículo y se compara con `StockActual` antes de descontar. Un solo `SaveChanges` guarda stock, factura y estado `Facturado`.
5. **Doble facturación (arreglado).** No se miraba el estado, así que una segunda llamada facturaba de nuevo y descontaba stock otra vez. Si ya está `Facturado`, lanza error antes de tocar el stock.
6. **Datos inválidos (arreglado).** El alta copiaba precio y alícuota y guardaba sin validar las líneas. Ahora rechaza lista vacía, cantidad menor o igual a cero y descuento fuera de 0–100, con 400 `{ error }`. Cantidad 0 → "La cantidad debe ser mayor a cero." Descuento 150 → "El descuento debe estar entre 0 y 100." ART-001 + ART-004 sin descuento → subtotal 39500, IVA 7822.50, total 47322.50.



## Decisiones del cliente React

El cliente está en `frontend/`: Vite, React y TypeScript, `fetch` nativo, sin estado global. La URL de la API sale de `VITE_API_BASE_URL` (`http://localhost:5080`).

Hay dos vistas. **Presupuestos** concentra el trabajo diario: indicadores, alta y grilla (facturar y duplicar). **Ranking** es el reporte, separado para no mezclarlo con el alta.

Los totales en vivo están en `frontend/src/domain/totales.ts` y copian la regla del backend: subtotal de línea `cantidad × precio × (1 − descuento/100)` sin redondear; IVA de línea `round(subtotal × alícuota/100, 2)` con mitad alejándose de cero; después se suman. El valor que se guarda lo calcula el backend al crear.

## Qué hice y qué dejé afuera

Primero la Parte A y la Parte B. Los seis bugs quedaron corregidos y los tests de la consigna pasan (6/6). El cliente lista, crea con totales en vivo y factura mostrando el error.

Después la Parte C:

- **Duplicar presupuesto:** `POST /api/presupuestos/{id}/duplicar` y el botón Duplicar. Copia cliente, validez, cantidades y descuentos. Número nuevo, fecha de hoy, precio e IVA del artículo actual.
- **Reporte:** `GET /api/reportes/top-articulos?desde&hasta&top`, en la vista Ranking. Ordena por monto facturado (subtotal de línea más IVA) dentro del rango.
- **Tests propios:** `StretchTests` cubre la copia con precio actualizado y que el ranking ignore facturas fuera de rango. No modifiqué los tests originales.

Quedó afuera lo que esta consigna no pide: autenticación y paginación en el servidor.

Las entidades siguen anémicas a propósito. Las reglas están en los servicios. No moví esa lógica a un agregado ni a value objects: los tests oficiales construyen `PresupuestoItem` con decimales y llaman al servicio. Cambiar el modelo ahora no mejora el comportamiento y sí arriesga esos tests.

## Cómo usé IA

Usé principalmente Cursor en el desarrollo del ejercicio para ubicar los bugs contra los tests, proponer el arreglo y armar el cliente.

Validé lo que coincidía con la consigna y con `dotnet test`: IVA por línea, validación de cantidad y descuento, numeración `Max+1`, alta en `Aprobado`, control de stock, facturación única y el cliente React.

Descarté un CRUD extra, interfaces y repositorios sin un segundo consumidor, y reescribir el descuento cuando el valor se pasa de 100. En facturación, cambiar los `foreach` por `Select` no aportaba; el cambio útil fue leer los artículos en una sola consulta.

Se equivocó al no limpiar el formulario después de crear, al dejar el aviso de éxito dentro de la página (se perdía si no había scroll) y al guardar 10 cuando se tipeaba 101 en el descuento. Eso se corrigió mirando la pantalla.

## Qué haría con más tiempo / qué falta para producción

- Un agregado `Presupuesto` que concentre facturar, duplicar y la validez, y un value object para el descuento (0–100, hasta dos decimales). Hoy eso está en los servicios porque el modelo público lo usan los tests.
- Autenticación y autorización por rol.
- Paginación en el servidor cuando la lista no entre en memoria.
- Tests de extremo a extremo del cliente y un pipeline de CI.
- Migraciones de EF en lugar de `EnsureCreated`.

