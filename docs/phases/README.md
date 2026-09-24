# Phases index — Mini ERP Challenge

Master plan: [`../IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md)

| Phase | File | Goal | Est. |
|-------|------|------|------|
| 0 | [phase-00-baseline-and-hygiene.md](./phase-00-baseline-and-hygiene.md) · [results](./phase-00-baseline-results.md) | Repo hygiene + baseline tests + **Swagger smoke (before fixes)** — **DONE** | 20–40 min |
| 1 | [phase-01-backend-iva-and-validation.md](./phase-01-backend-iva-and-validation.md) | Fix IVA + create validations — **DONE** | 30–45 min |
| 2 | [phase-02-backend-numbering-list-estado.md](./phase-02-backend-numbering-list-estado.md) | Numeración + list/estado — **DONE** | 20–35 min |
| 3 | [phase-03-backend-facturacion.md](./phase-03-backend-facturacion.md) | Stock + idempotencia facturación — **DONE** | 30–45 min |
| 4 | [phase-04-frontend-scaffold-and-core.md](./phase-04-frontend-scaffold-and-core.md) | React client: scaffold + list + create + live totals + facturar — **DONE** | 90–150 min |
| 5 | [phase-05-notes-hardening-delivery.md](./phase-05-notes-hardening-delivery.md) | NOTES, README, stretch opcional, hand-off | 40–70 min |

**Rule:** finish one phase (acceptance checklist green) before starting the next.  
**Tests:** never modify `MiniErp.Tests` existing files.  
**Commits:** small, English or Spanish consistent; prefer one concern per commit.
