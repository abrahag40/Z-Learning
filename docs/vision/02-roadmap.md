# Roadmap — Z-Learning

> Versionado por bloques temáticos (no lineal). Cada bloque puede tener sub-versions (v0.1.0, v0.1.1...) según merge cadence.

## v0.x — Foundation (pre-MVP)

### v0.1.0 — BOOTSTRAP (sprint actual)
- [x] Repo clonado + docs fundacionales (CLAUDE.md + ADR-0001 + visión)
- [ ] Next.js 16 scaffold con App Router + Tailwind + shadcn/ui
- [ ] Prisma schema inicial: `Organization`, `User`, `Course`, `CourseModule`, `Enrollment`, `XApiStatement`
- [ ] Auth.js v5 con multi-tenant callback (`session.orgId`)
- [ ] Layout shells: `(marketing)`, `(org-admin)`, `(instructor)`, `(student)`
- [ ] CI básico (GitHub Actions: lint + typecheck + test)

### v0.2.0 — ENGINE-PHASER
- [ ] `IGameEngineAdapter` interface implementada (`lib/engines/IGameEngineAdapter.ts`)
- [ ] `PhaserAdapter` referencia — valida el contrato
- [ ] `<GameModule>` componente con dispatch por `engineType`
- [ ] xAPI schema Zod + LRS service (insert + query básico)
- [ ] Demo: 1 juego Phaser ("Memorama LATAM países") corriendo end-to-end con tracking

### v0.3.0 — CONTENT-BASIC
- [ ] `<CourseModulePlayer>` con kinds: `GAME`, `MDX`, `VIDEO`, `QUIZ`, `PDF`
- [ ] MDX lecciones con `next-mdx-remote` + componentes embebibles
- [ ] Video player con Mux + statements `viewed/completed`
- [ ] Quiz auto-grading (multiple choice + true/false + drag-drop básico)
- [ ] PDF viewer con `react-pdf` + tracking por página

### v0.4.0 — ENGINE-UNITY
- [ ] `UnityWebGLAdapter` con `createUnityInstance` loader
- [ ] R2 upload pipeline (signed URLs para uploads desde instructor dashboard)
- [ ] Bridge `postMessage` ↔ Unity `SendMessage` con validación Zod
- [ ] Demo: 1 juego Unity ("Driving sim") corriendo con tracking + checkpoint

## v1.0 — MVP comercial (target: Q4 2026)

### v1.0.0 — LAUNCH
- [ ] Stripe Subscriptions integración (3 tiers Starter/Pro/Enterprise)
- [ ] Dashboard org admin (seats management + reports xAPI)
- [ ] Dashboard instructor (CRUD cursos + módulos + uploads)
- [ ] Dashboard student (catálogo cursos + progreso)
- [ ] SCORM 1.2 / 2004 import (parser server-side → conversión a módulos xAPI)
- [ ] Email transactional (Resend): invites + progress digests + cert delivery
- [ ] Auditoría seguridad pre-launch (OWASP top 10 + tenant isolation tests)

### v1.0.1 — POLISH
- [ ] Certificados PDF auto-generados al completar curso (PDF rendering reusable de patrón Zenix)
- [ ] Mobile responsive review completa
- [ ] Accessibility audit WCAG 2.1 AA

## v1.x — Diferenciación

### v1.1.0 — LIVE-SESSIONS
- [ ] Integración Zoom OAuth + webhook attendance
- [ ] Integración Google Meet OAuth
- [ ] Módulo del curso tipo `LIVE_SESSION` con calendario + recording auto-import

### v1.2.0 — COHORTS
- [ ] Cohort model (group de students con instructor + start/end date)
- [ ] Discussion threads per módulo
- [ ] Notifications center

### v1.3.0 — ENGINE-UNREAL (premium tier)
- [ ] `UnrealPixelStreamAdapter` con signaling server (auto-host AWS GPU o partnership con Vagon/Eagle3D)
- [ ] Pricing add-on para Enterprise tier (cubre costo GPU/hora)

### v1.4.0 — ADVANCED-REPORTS
- [ ] xAPI dashboard analytics (funnel, drop-off, time-to-completion)
- [ ] Export reports (CSV, PDF)
- [ ] LRS query API pública

## v2.x — Marketplace

### v2.0.0 — INSTRUCTOR-MARKETPLACE
- [ ] Instructor sign-up self-service
- [ ] Curso publicación pública con price
- [ ] Stripe Connect (revenue share 70/30 default)
- [ ] Ratings + reviews

### v2.1.0 — GAME-MARKETPLACE
- [ ] Indie game devs suben juegos al marketplace (con sandbox para testing)
- [ ] Instructors compran/licencian juegos para sus cursos
- [ ] Revenue share game dev ↔ instructor ↔ plataforma

---

## Métricas de éxito por fase

| Fase | KPI principal | Target |
|---|---|---|
| v0.x | Foundation técnica | 1 demo end-to-end con Phaser + xAPI |
| v1.0 | Primer customer paga | 3 orgs piloto, $5k MRR |
| v1.x | Retención | 80% renewal a 6 meses |
| v2.x | Marketplace | 50+ cursos publicados, $25k MRR |
