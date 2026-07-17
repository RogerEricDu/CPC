# cpc

## CPC deployment modes

- Development site: `npm run build:cpc-dev` (`/cpc-dev/`, API `/cpc-dev-api`).
- Production site: `npm run build:cpc-prod` (`/cpc/`, API `/cpc-api`).
- Imputation frontend handoff: `docs/imputation-online-v2.md`.

Never publish a cpc-dev build under the production `/cpc` link.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
