import type { XApiStatement } from '@/lib/xapi/schema'

/**
 * Game engine adapter contract — see ADR-0001 + §1 CLAUDE.md.
 *
 * Z-Learning treats games as first-class course content. Each supported engine
 * (Phaser, Unity WebGL, Unreal Pixel Streaming, ...) implements this interface
 * so the rest of the LMS — progress tracking, grading, UI shell — stays
 * engine-agnostic.
 */

export type EngineType = 'PHASER' | 'UNITY_WEBGL' | 'UNREAL_PIXEL_STREAM'

export type DeviceClass = 'MOBILE' | 'TABLET' | 'DESKTOP'

export interface MountOpts {
  /** Public URL or signed URL of the build. Engine-specific:
   *  - PHASER: JS bundle entry point
   *  - UNITY_WEBGL: `*.loader.js`
   *  - UNREAL_PIXEL_STREAM: signaling server WebSocket URL
   */
  buildUrl: string
  /** Course module identifier — games may use for checkpoint persistence. */
  moduleId: string
  /** User identifier (may be anonymized for free/public games). */
  userId: string
  /** Short-lived JWT for server-authenticated statement submission. */
  sessionToken: string
  /** BCP-47 locale for i18n-aware games. */
  locale: string
  /** Per-module instructor-configured variables. */
  customVars?: Record<string, string | number | boolean>
}

export interface GameSession {
  readonly id: string
  readonly engineType: EngineType
  readonly mountedAt: Date
  pause(): Promise<void>
  resume(): Promise<void>
  /** Save state for cross-device resume. Returns `null` if engine/game does not support it. */
  saveCheckpoint(): Promise<unknown | null>
  restoreCheckpoint(state: unknown): Promise<boolean>
}

export type StatementHandler = (stmt: XApiStatement) => void | Promise<void>
export type Unsubscribe = () => void

export interface CanRunResult {
  supported: boolean
  /** Localized reason when `supported=false` (e.g. "Requires desktop"). */
  reason?: string
}

export interface IGameEngineAdapter {
  readonly engineType: EngineType

  /**
   * Mount the game in a DOM container. Implementations MUST validate the
   * origin of any `postMessage` payload before forwarding statements.
   */
  mount(container: HTMLElement, opts: MountOpts): Promise<GameSession>

  /** Tear down and release resources. Idempotent. */
  unmount(session: GameSession): Promise<void>

  /**
   * Subscribe to xAPI statements emitted by the game. The adapter validates
   * each statement against `XApiStatementSchema` (Zod) before delivering it.
   * See §9 CLAUDE.md.
   */
  onStatement(session: GameSession, handler: StatementHandler): Unsubscribe

  /**
   * Pre-mount feasibility check. Used to render a friendly block UI
   * ("This game requires desktop") instead of loading 100MB and failing.
   */
  canRun(opts: { device: DeviceClass; userAgent: string }): CanRunResult
}
