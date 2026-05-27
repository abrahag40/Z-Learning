# Visión — Z-Learning

## Pitch en una frase

Z-Learning es un LMS SaaS multi-tenant que trata juegos educativos (Phaser, Unity, Unreal) como **contenido de primera clase** junto a video, PDF, quizzes y SCORM/xAPI — el LMS que los proveedores tradicionales no construyeron porque vienen de la cultura corporate-training pre-gamificación.

## Audiencias

| Audiencia | Pain point | Cómo Z-Learning lo resuelve |
|---|---|---|
| **Org admin** (HR, training lead) | "Mi LMS solo embebe iframes de juegos, sin tracking real" | Tracking xAPI nativo unificado para juegos + tradicionales en un mismo reporte |
| **Instructor** (educador/diseñador) | "Quiero subir mi build Unity y que el progreso del alumno se sume al curso" | Upload directo a R2 + módulo del curso configurable; xAPI auto-wired |
| **Estudiante** | "Cada plataforma me hace pelear con el player. Y los juegos rompen el progreso" | Player unificado `<CourseModulePlayer>`; progreso visible siempre (NN/g H1) |
| **Developer indie / studio** | "Quiero monetizar mis juegos educativos sin construir backend de LMS" | (v1.x) marketplace: instructor publica juego, recibe revenue share |

## Modelo de negocio (MVP)

**B2B SaaS Multi-tenant — `Organization → Course → Student`.**

- Org paga subscripción mensual basada en seats activos / mes.
- Org admin invita instructores y students.
- Instructor crea cursos (mezcla de juegos + contenido tradicional).
- Student consume y genera tracking xAPI.

### Pricing tiers (draft, sin validar)

| Tier | Seats | Precio/mes | Features |
|---|---|---|---|
| Starter | hasta 25 | $99 | Contenido tradicional + Phaser games + xAPI reports basic |
| Pro | hasta 100 | $299 | + Unity WebGL games + SCORM imports + advanced reports |
| Enterprise | 100+ | Custom | + Unreal Pixel Streaming + SSO + custom branding + SLA |

> Pricing requiere validación con 5-10 prospects antes de cerrar. Pendiente sprint comercial post-MVP.

## Roadmap por capas

### v0.x — Foundation
Bootstrap + auth multi-tenant + engine adapter Phaser + módulos básicos (MDX, Quiz, Video).

### v1.0 — MVP comercial
+ Unity WebGL adapter + PDF viewer + SCORM imports + xAPI reports + Stripe billing + dashboard org admin.

### v1.x — Diferenciación
+ Live sessions (Zoom/Meet) + cohorts + certificados + Unreal Pixel Streaming (premium tier).

### v2.x — Marketplace
Instructor↔Org marketplace estilo Udemy + Stripe Connect + revenue share + ratings.

## Por qué ahora

1. **Mercado LMS B2B = $25.7B en 2024, CAGR 19.7% hasta 2030** (Grand View Research).
2. **Game-based learning crece 17.6% CAGR** (Mordor Intelligence 2024) pero los LMS mainstream **no soportan game tracking nativo** — embeben iframes sin xAPI bridge.
3. **xAPI (Tin Can) es estándar IEEE desde 2023 (P9274.1.1)** — el momento de construir LMS xAPI-first ya llegó; los legacy SCORM-first quedan obsoletos.
4. **Owner tiene capacidad técnica + foco** (proyecto Zenix corre en paralelo con disciplina docs-first ya probada).

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Unity WebGL builds pesados saturan ancho de banda gratuito Vercel | R2 público con Cloudflare CDN — $0 egress |
| Anti-cheat: alumno emite statements falsos via DevTools | Schema Zod en adapter + server-side score recompute cuando aplica (§9) |
| LRS interno se vuelve cuello de botella con muchos statements | Postgres con índices GIN; v1.x particionar por `organizationId` |
| Engine API breaks (Unity LTS upgrade) | Adapter aísla — cambio en 1 clase, no en LMS entero |
| Pricing no valida con clientes | Sprint comercial pre-launch con 5-10 prospects |
