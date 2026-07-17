# Imputation Online v2 frontend handoff

Updated: 2026-07-17

## Files

- `src/views/database/ImputationTool.vue`: complete user workflow and responsive presentation.
- `src/views/database/index.vue`: database portal integration and account gate.
- `src/api/imputation.js`: user endpoints.
- `src/views/admin/ImputationAccessReview.vue`: administrator approval UI.
- `src/views/admin/index.vue` and `src/api/admin.js`: administrator navigation/API integration.

## Behavior contract

The user must be logged in with BASIC access, then separately approved for Imputation. The form requires a BGZF `.vcf.gz` and the exact matching `${vcfFilename}.tbi`, assembly GRCh38, and a server-provided panel/chromosome option. Task state, progress, events, cancellation, retry and one-time download are read from the backend; the browser never invents success.

`cancelRequested` is a distinct visual state: show `Cancelling` and do not offer a second cancel action. History is paginated and refresh preserves access to pages beyond the first 50 tasks.

## Environment

```dotenv
# .env.cpc-dev
NODE_ENV=production
VUE_APP_PUBLIC_PATH=/cpc-dev/
VUE_APP_BASE_API=/cpc-dev-api
```

Build and check:

```powershell
npm ci
npm run lint
npm run build:cpc-dev
```

The six JS/Vue files changed for Imputation pass ESLint. Repository-wide `npm run lint` currently also inspects unrelated legacy pages and reports 11 pre-existing errors; the `cpc-dev` production build itself succeeds.

The backend handoff and deployment guide live in `RogerEricDu/CPC_backend` under `docs/imputation-v2-handoff.md` and `deploy/cpc-dev/DEPLOYMENT_GUIDE.md`. The deployed backend runs on clc021; web01 only serves static files and proxies cpc-dev API traffic.

## Extending the database portal

SNP/SV/PanGraph work should use separate Vue components and API modules, keep the existing login/BASIC access gate, and avoid coupling general database access to the Imputation-specific approval state. Preserve the portal tab styling and responsive behavior already used by the Imputation tool.
