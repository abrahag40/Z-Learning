@AGENTS.md

# CLAUDE.md — Z-Learning

> Plataforma LMS SaaS multi-tenant con soporte nativo para juegos educativos (Phaser, Unity WebGL, Unreal Pixel Streaming) además de contenidos tradicionales (video, PDF, quizzes, MDX, SCORM/xAPI, live sessions).
> **Última actualización:** 2026-05-26 (kickoff). Owner: Abraham. Repo: https://github.com/abrahag40/Z-Learning.git
>
> ⚠️ **Importante:** `AGENTS.md` (importado arriba) advierte que esta versión de Next.js (16) tiene breaking changes vs. el conocimiento de modelos. Antes de escribir código que toque Next, leer la guía relevante en `node_modules/next/dist/docs/`.

---

## Estado del proyecto

- **Versión en curso:** v0.1.0 (bootstrap / pre-MVP)
- **Sprint activo:** BOOTSTRAP — scaffolding Next.js 16 + docs fundacionales + engine adapter contract.
- **Modelo de negocio:** SaaS multi-tenant B2B. Jerarquía `Organization → Course → Student`. Orgs compran licencias y asignan a sus students (modelo TalentLMS / Udemy Business).
- **Diferenciador:** ningún LMS mainstream (Moodle, Canvas, TalentLMS, Docebo, LearnWorlds, Teachable) trae soporte de juegos multi-engine nativo. Z-Learning trata juegos como contenido de primera clase con tracking xAPI estándar.

---

## Principios rectores (heredados de la disciplina ZaharDev)

### Debate epistémico
Toda decisión técnica se debate con fundamento verificable: estudios académicos (NN/g, Baymard, ISO 9241), estándares de industria (xAPI/Tin Can spec, SCORM 2004, WCAG 2.1 AA), o documentación oficial del vendor. Nunca "porque sí".

### Análisis crítico
Antes de implementar: (1) identificar riesgos, (2) contrapropuesta cuando aplica, (3) justificar con citas, (4) tratar la propuesta del owner como hipótesis no axioma, (5) educar mientras se ejecuta.

### Diseño cimentado
UI/UX basado en NN/g 10 Heurísticas, Apple HIG 2024, WCAG 2.1 AA, Material Design 3. Carga cognitiva ≤7 elementos simultáneos (Sweller 1988, Miller 1956).

### No sobre-ingeniería
"Don't design for hypothetical future requirements." Tres ejemplos antes de abstraer (rule of three). Excepción: cuando los 3+ casos están confirmados desde día 1 — entonces la abstracción ya no es hipotética (caso del engine adapter, ver §1).

---

## Decisiones no-negociables

### Arquitectura

**§1 — `IGameEngineAdapter` Strategy pattern desde día 1.** Tres engines confirmados en MVP roadmap (Phaser, Unity WebGL, Unreal Pixel Streaming) justifican la abstracción inmediata. El LMS consume `<GameModule courseModuleId={...} />` sin conocer el engine — el componente lee `module.engineType` y delega al adapter correcto. Ver [docs/architecture/ADR-0001-engine-adapter.md](docs/architecture/ADR-0001-engine-adapter.md) para contrato completo + justificación.

**§2 — xAPI (Tin Can) es el bus de tracking universal.** Todos los engines emiten `XApiStatement` al LMS vía `adapter.onStatement(...)`. El LMS persiste statements en un LRS interno (tabla `xapi_statement`) que sirve tanto a juegos como a contenidos tradicionales (video watched, PDF read, quiz answered). Estándar abierto IEEE P9274.1.1, mejor que SCORM 2004 legacy. SCORM solo se soporta como **importación** (cursos legacy de Articulate/Captivate), convertido a xAPI internamente.

**§3 — Multi-tenant: `Organization → Course → Student` con `organizationId` denormalizado en cada tabla.** Toda query filtra por `organizationId` (excepto contenidos públicos del marketplace). JWT lleva `orgId` + `userId` + `roles[]`. Sin Postgres RLS en v0.x — enforcement en app-layer (middleware Next.js). RLS reservado como defense-in-depth para v1.x.

**§4 — Builds de juegos en object storage (R2/S3), nunca en repo ni servidos desde el origin Next.js.** Unity WebGL build = 20-150MB; servirlo desde Vercel rompe los límites de bundle. Cloudflare R2 público para juegos free / signed URLs (1h TTL) para juegos premium.

**§5 — Stack core inamovible v0.x:** Next.js 16 (App Router + Cache Components) + Postgres (Neon) + Prisma + Auth.js (next-auth v5) + Tailwind CSS + Stripe. Sin reescritura en v1.x — el adapter pattern absorbe la variación de engines y de proveedores externos.

### Engines

**§6 — Phaser primero como referencia del contrato `IGameEngineAdapter`.** Phaser es JS puro, bundle mínimo, sin assets externos pesados — implementación más simple. Valida el contrato antes de invertir en Unity (caso WebGL pesado) o Unreal (caso server-side rendering).

**§7 — Unity WebGL build artifacts servidos como estáticos:** los 4 archivos canónicos (`Build/{name}.data`, `.wasm`, `.framework.js`, `.loader.js`) van a R2. `UnityWebGLAdapter` los carga con `createUnityInstance(...)`. Comunicación LMS↔juego vía `SendMessage` (LMS→juego) y `unityInstance.Module.SendMessage` callbacks (juego→LMS).

**§8 — Unreal Pixel Streaming es producto premium, no MVP base.** Requiere infra GPU dedicada (~$0.50-2/hr de g4dn/g5 AWS por sesión activa). Implementar `UnrealPixelStreamAdapter` solo cuando haya demanda comercial validada. Adapter pattern (§1) garantiza que sumar Unreal después no toca el resto del LMS.

**§9 — Comunicación juego↔LMS vía `postMessage` con schema validado (Zod).** Nunca confiar en payloads del juego — un alumno malicioso puede emitir statements falsos. El adapter valida cada statement contra `XApiStatementSchema` antes de propagarlo al LMS. Score-based grading se firma server-side (re-cálculo de score en backend cuando es factible).

### Contenidos tradicionales

**§10 — Video con HLS streaming.** Mux o Cloudflare Stream como proveedor v0.x (managed, sub $1/hora de video procesado). Self-host con ffmpeg + S3 reservado para v1.x si volumen justifica. Tracking xAPI: statements `viewed/seeked/paused/completed` cada 10s o evento.

**§11 — PDF viewer inline con `react-pdf` + tracking de páginas.** xAPI `experienced` por página visitada + `completed` al alcanzar última página.

**§12 — Quizzes auto-grading nativo.** Tipos MVP: multiple choice, true/false, drag-drop, short text (exact match). Open answer / essay queda para v1.x con grading manual o LLM-assisted.

**§13 — MDX lecciones con `next-mdx-remote`.** Componentes interactivos embebibles en lecciones (`<Quiz>`, `<GameEmbed>`, `<Video>`). Carga cognitiva: límite blando 2000 palabras por lección, partir si excede.

**§14 — SCORM/xAPI imports vía parser server-side.** Aceptar `.zip` SCORM 1.2 / 2004 / xAPI Tin Can package. Extraer manifest, convertir tracking a statements xAPI internos, servir contenido estático desde R2.

**§15 — Live sessions: integración Zoom/Meet vía OAuth, no embed iframe.** El módulo crea la sesión, registra asistencia automática vía webhook del provider. Grabación post-evento queda como video del módulo.

### UX

**§16 — Player único `<CourseModulePlayer>` con dispatch interno por `module.kind`.** Estudiante no salta entre layouts según el tipo de contenido — un mismo shell con player intercambiable (game adapter, video player, PDF viewer, quiz form, MDX renderer). NN/g consistency H4.

**§17 — Progreso visible en cada interacción.** Barra de progreso del curso siempre visible. Cada statement xAPI completed actualiza la barra inmediatamente (optimistic UI + reconciliación server). NN/g visibility of system status H1.

**§18 — Mobile-first responsive, pero juegos pueden requerir desktop.** Marcar `module.minDeviceClass: 'MOBILE' | 'TABLET' | 'DESKTOP'`. Mostrar bloqueo amistoso ("Este juego requiere desktop") en lugar de cargar y fallar.

---

## Stack técnico

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | Next.js 16 (App Router + Cache Components) | Stack ya conocido por owner; deploy Vercel trivial; PPR para landing públicas |
| DB | Postgres (Neon) | Branching para previews; serverless-friendly; gratis hasta 0.5GB |
| ORM | Prisma | Type-safe, migrations versionadas |
| Auth | Auth.js (next-auth v5) | Multi-provider (Google/GitHub/email), multi-tenant via custom callbacks |
| Storage | Cloudflare R2 | $0 egress, S3-compatible, builds Unity caben sin sangrar |
| Pagos | Stripe (+Connect futuro) | Multi-tenant subscriptions; Stripe Connect cuando llegue marketplace de instructores |
| Video | Mux (v0.x) | Managed HLS; reemplazable por self-host en v1.x |
| Email | Resend | Transactional, simple, $20/mes 50k emails |
| LRS | Postgres interno (tabla `xapi_statement`) | Sin SaaS LRS externo; consultas con índices GIN sobre `verb`+`object` |
| Game embed | iframe sandbox + postMessage | Aislamiento de origen; CSP estricta |
| Tests | Vitest + Playwright | Standard en Next.js 16 era |

---

## Estructura del proyecto (objetivo)

```
Z-Learning/
├── src/
│   ├── app/                      Next.js App Router
│   │   ├── (marketing)/          Landing público, pricing, login
│   │   ├── (org-admin)/          Dashboard de Organization admin
│   │   ├── (instructor)/         Dashboard de instructor (crea cursos)
│   │   ├── (student)/            Dashboard del estudiante
│   │   └── api/                  Route handlers + webhooks (Stripe, Mux, Zoom)
│   ├── components/
│   │   ├── player/               <CourseModulePlayer> + impls por kind
│   │   └── ui/                   shadcn/ui base
│   └── lib/
│       ├── engines/              Engine adapter system
│       │   ├── IGameEngineAdapter.ts Interface canónica (§1)
│       │   ├── phaser/           PhaserAdapter
│       │   ├── unity/            UnityWebGLAdapter
│       │   └── unreal/           UnrealPixelStreamAdapter (futuro)
│       ├── xapi/                 Schema Zod + LRS service
│       ├── tenancy/              Multi-tenant helpers + middleware
│       └── auth/                 Auth.js config
├── prisma/
│   ├── schema.prisma             Models
│   └── migrations/
├── docs/
│   ├── vision/                   Estrategia + roadmap
│   └── architecture/             ADRs (decisiones documentadas)
└── public/
```

---

## Comandos

```bash
# Setup local
npm install
cp .env.example .env.local
npx prisma migrate dev

# Desarrollo
npm run dev

# Tests (pendientes — sprint v0.1.0)
npm test
npm run test:e2e

# Build
npm run build
```

---

## Documentos hermanos

| Documento | Contenido |
|---|---|
| [docs/vision/01-overview.md](docs/vision/01-overview.md) | Visión, modelo de negocio, audiencias |
| [docs/vision/02-roadmap.md](docs/vision/02-roadmap.md) | Roadmap v0.x → v1.x → v2.x |
| [docs/architecture/ADR-0001-engine-adapter.md](docs/architecture/ADR-0001-engine-adapter.md) | Contrato `IGameEngineAdapter` + justificación |

---

## Bitácora de cambios mayores

- **2026-05-26** — Kickoff. Repo clonado desde `https://github.com/abrahag40/Z-Learning.git`. Decisiones §1-§18 registradas. Stack confirmado: Next.js 16 + Postgres + Prisma. Modelo SaaS multi-tenant B2B 3 niveles (Organization → Course → Student). Engines confirmados MVP: Phaser + Unity WebGL. Unreal Pixel Streaming queda como sprint posterior. Contenidos tradicionales: Video (Mux), PDF, Quizzes, MDX, SCORM/xAPI imports, Live sessions. Next.js 16 scaffold inicial bootstrappeado vía `create-next-app` con TypeScript + Tailwind + App Router + src dir + Turbopack.
