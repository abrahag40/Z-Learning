# Z-Learning

LMS SaaS multi-tenant con soporte nativo para juegos educativos (Phaser, Unity WebGL, Unreal Pixel Streaming) y contenidos tradicionales (video, PDF, quizzes, MDX, SCORM/xAPI imports, live sessions).

## Estado

🚧 **v0.1.0 — Bootstrap** (pre-MVP). Sprint activo: scaffolding + engine adapter contract.

## Documentación

- **[CLAUDE.md](CLAUDE.md)** — instrucciones técnicas + decisiones no-negociables §1-§18.
- **[AGENTS.md](AGENTS.md)** — aviso de Next.js 16 (breaking changes vs. training data).
- **[docs/vision/01-overview.md](docs/vision/01-overview.md)** — visión, modelo de negocio, audiencias.
- **[docs/vision/02-roadmap.md](docs/vision/02-roadmap.md)** — roadmap v0.x → v2.x.
- **[docs/architecture/ADR-0001-engine-adapter.md](docs/architecture/ADR-0001-engine-adapter.md)** — contrato `IGameEngineAdapter` + justificación.

## Stack

Next.js 16 (App Router + Turbopack) · React 19 · TypeScript · Tailwind v4 · Postgres (Neon) · Prisma · Auth.js v5 · Cloudflare R2 · Stripe · Mux · Vitest · Playwright.

## Setup local

```bash
npm install
cp .env.example .env.local   # rellena los valores
# npx prisma migrate dev      # cuando el schema esté listo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Licencia

Privado (propiedad de Abraham / ZaharDev). Pendiente decisión de licencia comercial al lanzar v1.0.
