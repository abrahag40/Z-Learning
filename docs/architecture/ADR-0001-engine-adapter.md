# ADR-0001 — `IGameEngineAdapter` Strategy pattern

> **Estado:** Aceptada · **Fecha:** 2026-05-26 · **Owner:** Abraham
> **Formato:** MADR 3.0

## Contexto

Z-Learning es un LMS que trata juegos educativos como contenido de primera clase. El MVP roadmap confirma **tres engines** desde día 1:

1. **Phaser** (JS canvas/WebGL 2D, ~1-5MB bundle) — juegos ligeros embebidos en el bundle del LMS.
2. **Unity WebGL** (bundle 20-150MB de assets) — juegos 3D / 2D complejos, build estático servido desde object storage.
3. **Unreal Engine Pixel Streaming** (zero build, render server-side + WebRTC video al browser) — juegos AAA / fidelidad alta, sprint comercial posterior.

Cada engine tiene un montaje, ciclo de vida, y mecanismo de comunicación radicalmente distintos:

| Engine | Mount | Comm pattern | Build size | Costo por sesión |
|---|---|---|---|---|
| Phaser | `new Phaser.Game(config)` en `<canvas>` | EventEmitter JS directo | ~1-5MB | $0 |
| Unity WebGL | `createUnityInstance(canvas, config, ...)` async loader | `SendMessage` + `Module.SendMessage` callbacks | 20-150MB | $0 (CDN) |
| Unreal Pixel Stream | WebRTC peer connection a GPU server | Pixel Streaming protocol (data channel) | 0 (server-render) | $0.50-2/hr GPU |

## Decisión

Adoptar **Strategy pattern** vía interface `IGameEngineAdapter` con implementación por engine. El LMS consume un único componente React `<GameModule courseModuleId={...} />` que lee `module.engineType` y delega al adapter correcto.

## Justificación

### Regla "rule of three"
La regla canónica de abstracción (Fowler, *Refactoring* 1999) dice: no abstraer hasta tener 3 ejemplos del patrón. Aquí los **3 casos están confirmados desde día 1**, no son hipotéticos. La abstracción se justifica de entrada.

### Costo comparado

| Opción | Setup inicial | Costo cuando entra engine #2 | Costo cuando entra engine #3 |
|---|---|---|---|
| **A — Adapter desde día 1** | +4-6h | +1 clase nueva (~1 día-dev) | +1 clase nueva (~1-2 días-dev) |
| **B — Acoplado, refactor después** | 0h | 2-4 días-dev (refactor cascada: UI + schema + tracking + tests) | 2-4 días-dev otra vez |

Con 3 engines confirmados: **A = ~6h + 2-3 días-dev acumulados; B = 4-8 días-dev acumulados + riesgo de regresiones**.

### Coherencia con el resto del LMS

El bus de tracking xAPI (§2 de [CLAUDE.md](../../CLAUDE.md)) consume statements vía `adapter.onStatement(...)` sin importar el engine. Si el adapter no existe, cada engine acopla su propia lógica de tracking al LMS → fragmentación inevitable.

### Extensibilidad futura

Engines adicionales posibles sin refactor:
- **Godot HTML5** (export web nativo, comunidad creciente)
- **Construct 3** (browser-native, popular en edu-tech)
- **Bevy WASM** (Rust, emergente)
- **PlayCanvas** (WebGL nativo, modelo cloud)

## Contrato del adapter

```ts
// lib/engines/IGameEngineAdapter.ts
import type { XApiStatement } from '@/lib/xapi/schema'

export type EngineType = 'PHASER' | 'UNITY_WEBGL' | 'UNREAL_PIXEL_STREAM'

export interface MountOpts {
  /** URL pública o signed URL del build (Phaser: bundle JS; Unity: loader.js; Unreal: signaling server) */
  buildUrl: string
  /** Identifier del módulo del curso — el juego puede usarlo para checkpoint persistence */
  moduleId: string
  /** Identifier del usuario (anonimizable para juegos free) */
  userId: string
  /** Token JWT corto para auth de statements server-side */
  sessionToken: string
  /** Locale del estudiante para juegos i18n */
  locale: string
  /** Variables custom que el instructor configura per-módulo */
  customVars?: Record<string, string | number | boolean>
}

export interface GameSession {
  readonly id: string
  readonly engineType: EngineType
  readonly mountedAt: Date
  /** Pausar el juego (Unity: SetActive false; Unreal: pause stream; Phaser: scene.pause) */
  pause(): Promise<void>
  resume(): Promise<void>
  /** Snapshot del estado para resume cross-device (juegos que soportan) */
  saveCheckpoint(): Promise<unknown | null>
  restoreCheckpoint(state: unknown): Promise<boolean>
}

export type StatementHandler = (stmt: XApiStatement) => void | Promise<void>
export type Unsubscribe = () => void

export interface IGameEngineAdapter {
  readonly engineType: EngineType

  /**
   * Monta el juego en el contenedor DOM.
   * Implementaciones deben validar el origen del postMessage para anti-cheat.
   */
  mount(container: HTMLElement, opts: MountOpts): Promise<GameSession>

  /**
   * Desmonta y libera recursos. Idempotente.
   */
  unmount(session: GameSession): Promise<void>

  /**
   * Suscribe a statements xAPI emitidos por el juego.
   * El adapter es responsable de validar el statement con Zod
   * antes de propagarlo (§9 CLAUDE.md).
   */
  onStatement(session: GameSession, handler: StatementHandler): Unsubscribe

  /**
   * Health check pre-mount: verifica que el browser/device soporta el engine.
   * Permite UI amigable ("Este juego requiere desktop") antes de cargar 100MB.
   */
  canRun(opts: { device: 'MOBILE' | 'TABLET' | 'DESKTOP', userAgent: string }): {
    supported: boolean
    reason?: string
  }
}
```

## Consecuencias

### Positivas
- Componente `<GameModule>` único, schema único (`course_module.engineType`), tracking único.
- Sumar engine nuevo = 1 PR aislado (1 clase + 1 row en enum + tests del adapter).
- Tests aislables: mock `IGameEngineAdapter` para probar progress/grading sin cargar engines reales.
- Habilita marketplace futuro donde instructor sube su engine custom (con sandbox).

### Negativas
- 4-6h iniciales antes del primer juego corriendo.
- Riesgo de diseñar la interface mal antes de ver los 3 casos. **Mitigación:** implementar Phaser y Unity en serie corta (mismo sprint BOOTSTRAP) antes de cerrar el contrato como inmutable.

### Neutras
- El adapter no expone toda la API del engine — solo el subconjunto que el LMS necesita (mount, unmount, statements, checkpoint). Funcionalidad engine-específica vive dentro del juego, no atraviesa la interface.

## Alternativas consideradas

### B — Acoplar Phaser primero, refactorizar al entrar Unity
**Descartada:** con 3 engines confirmados, el refactor llega 100% seguro × 2 veces. Costo acumulado mayor + riesgo de regresiones en producción con students activos.

### C — Un componente React por engine, sin abstracción
**Descartada:** fragmenta tracking xAPI (cada componente reinventa el bridge), fragmenta progress UI, fragmenta tests. El "ahorro" de no escribir la interface se paga en cascada.

### D — Usar un SaaS de game hosting (CrazyGames embeds, etc.)
**Descartada:** no aplica al modelo SaaS multi-tenant — los juegos son contenido propietario del instructor/organización, no hosted en plataforma externa. Además, tracking xAPI no estaría disponible.

## Referencias

- Fowler, M. (1999). *Refactoring: Improving the Design of Existing Code*. Cap. 1 (Rule of three).
- IEEE P9274.1.1 — Experience API (xAPI) standard.
- Unity Manual — WebGL Build Reference: https://docs.unity3d.com/Manual/webgl.html
- Phaser 3 Docs — Game Configuration: https://docs.phaser.io/
- Unreal Engine — Pixel Streaming Overview: https://docs.unrealengine.com/5.0/en-US/pixel-streaming-in-unreal-engine/
- Patrón análogo en proyecto hermano Zenix: `IFiscalAdapter` (§89), `IFxAdapter` (§111), `ICompsetAdapter`.
