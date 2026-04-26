/**
 * Scene contract (ZY-09-03)
 *
 * Per epic 09 §MVP, only Loading / Game / GameOver scenes are required;
 * V1 may add Pause. We model it as a simple lifecycle interface so each
 * game declares its own scenes.
 */
export interface Scene {
  readonly name: string;
  /** Called once when the scene is mounted onto the stack. */
  enter?: (params?: Record<string, unknown>) => void | Promise<void>;
  /** Called every fixed step (ms) while this scene is the top of the stack. */
  update?: (dt: number) => void;
  /** Called once per frame to render. */
  render?: (interpolation: number) => void;
  /** Called when popped or replaced. */
  exit?: () => void | Promise<void>;
}

/**
 * Convenience base class with no-op lifecycle hooks. Subclass when you only
 * need to override a subset.
 */
export abstract class BaseScene implements Scene {
  abstract readonly name: string;
  enter(_params?: Record<string, unknown>): void | Promise<void> {
    /* override */
  }
  update(_dt: number): void {
    /* override */
  }
  render(_interpolation: number): void {
    /* override */
  }
  exit(): void | Promise<void> {
    /* override */
  }
}

/** Built-in scene names per E09 / E10 spec. */
export const BUILTIN_SCENES = ['loading', 'game', 'gameover'] as const;
export type BuiltinSceneName = (typeof BUILTIN_SCENES)[number];
