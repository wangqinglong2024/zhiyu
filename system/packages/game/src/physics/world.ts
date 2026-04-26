/**
 * PhysicsWorld (ZY-09-07)
 *
 * Wraps `matter-js` with a tiny façade tuned for our games. Exposes:
 *   - World creation + gravity config
 *   - BodyFactory: rectangle / circle / polygon / fromVertices
 *   - DisplayObject sync helper (Pixi-shape compatible: `{ position, rotation }`)
 *   - Group/category-aware collision dispatch
 *
 * The Matter module is lazily imported so unit tests can exercise the
 * façade without pulling in WebAudio / DOM.
 */
import type Matter from 'matter-js';

export interface PhysicsWorldOptions {
  gravity?: { x?: number; y?: number; scale?: number };
  /** Optional injected Matter module (tests). */
  matter?: typeof Matter;
}

export interface BodyHandle {
  id: number;
  body: Matter.Body;
  group?: string;
}

export interface DisplayObjectLike {
  position: { x: number; y: number; set?: (x: number, y: number) => void };
  rotation: number;
}

export type CollisionListener = (a: BodyHandle, b: BodyHandle, pair: Matter.Pair) => void;

interface CollisionListenerEntry {
  group?: string;
  cb: CollisionListener;
}

export class PhysicsWorld {
  private matter: typeof Matter | null = null;
  private engine: Matter.Engine | null = null;
  private world: Matter.World | null = null;
  private readonly handlesById = new Map<number, BodyHandle>();
  private readonly syncMap = new Map<number, DisplayObjectLike>();
  private readonly collisionListeners: CollisionListenerEntry[] = [];
  private readonly options: PhysicsWorldOptions;

  constructor(opts: PhysicsWorldOptions = {}) {
    this.options = opts;
  }

  /** Lazily create the underlying Matter engine. Must be called before use. */
  async init(): Promise<void> {
    if (this.engine) return;
    const m = this.options.matter ?? ((await import('matter-js')) as unknown as typeof Matter);
    this.matter = m;
    const engine = m.Engine.create();
    if (this.options.gravity) {
      engine.gravity.x = this.options.gravity.x ?? engine.gravity.x;
      engine.gravity.y = this.options.gravity.y ?? engine.gravity.y;
      engine.gravity.scale = this.options.gravity.scale ?? engine.gravity.scale;
    }
    this.engine = engine;
    this.world = engine.world;
    m.Events.on(engine, 'collisionStart', (event) => this._onCollision(event));
  }

  step(dtMs: number): void {
    if (!this.matter || !this.engine) return;
    this.matter.Engine.update(this.engine, dtMs);
    for (const [id, dispObj] of this.syncMap) {
      const handle = this.handlesById.get(id);
      if (!handle) continue;
      const { x, y } = handle.body.position;
      if (dispObj.position.set) dispObj.position.set(x, y);
      else {
        dispObj.position.x = x;
        dispObj.position.y = y;
      }
      dispObj.rotation = handle.body.angle;
    }
  }

  destroy(): void {
    if (this.engine && this.matter) {
      this.matter.World.clear(this.engine.world, false);
      this.matter.Engine.clear(this.engine);
    }
    this.engine = null;
    this.world = null;
    this.handlesById.clear();
    this.syncMap.clear();
    this.collisionListeners.length = 0;
  }

  createRectangle(opts: { x: number; y: number; width: number; height: number; group?: string; options?: Matter.IBodyDefinition }): BodyHandle {
    return this._addBody(this._req().Bodies.rectangle(opts.x, opts.y, opts.width, opts.height, opts.options), opts.group);
  }

  createCircle(opts: { x: number; y: number; radius: number; group?: string; options?: Matter.IBodyDefinition }): BodyHandle {
    return this._addBody(this._req().Bodies.circle(opts.x, opts.y, opts.radius, opts.options), opts.group);
  }

  createPolygon(opts: { x: number; y: number; sides: number; radius: number; group?: string; options?: Matter.IBodyDefinition }): BodyHandle {
    return this._addBody(this._req().Bodies.polygon(opts.x, opts.y, opts.sides, opts.radius, opts.options), opts.group);
  }

  createFromVertices(opts: { x: number; y: number; vertexSets: Matter.Vector[][]; group?: string; options?: Matter.IBodyDefinition }): BodyHandle {
    const m = this._req();
    const body = m.Bodies.fromVertices(opts.x, opts.y, opts.vertexSets, opts.options);
    return this._addBody(body, opts.group);
  }

  remove(handle: BodyHandle): void {
    if (!this.world || !this.matter) return;
    this.matter.World.remove(this.world, handle.body);
    this.handlesById.delete(handle.id);
    this.syncMap.delete(handle.id);
  }

  /** Bind a Pixi-style DisplayObject to a body. */
  sync(handle: BodyHandle, displayObject: DisplayObjectLike): void {
    this.syncMap.set(handle.id, displayObject);
  }

  /** Subscribe to collision events optionally filtered by `group`. */
  onCollision(group: string | undefined, cb: CollisionListener): () => void {
    const entry: CollisionListenerEntry = { group, cb };
    this.collisionListeners.push(entry);
    return () => {
      const idx = this.collisionListeners.indexOf(entry);
      if (idx >= 0) this.collisionListeners.splice(idx, 1);
    };
  }

  private _addBody(body: Matter.Body, group?: string): BodyHandle {
    if (!this.world || !this.matter) throw new Error('physics_world_not_initialized');
    this.matter.World.add(this.world, body);
    const handle: BodyHandle = { id: body.id, body, group };
    this.handlesById.set(body.id, handle);
    return handle;
  }

  private _onCollision(event: Matter.IEventCollision<Matter.Engine>): void {
    if (!event.pairs) return;
    for (const pair of event.pairs) {
      const a = this.handlesById.get(pair.bodyA.id);
      const b = this.handlesById.get(pair.bodyB.id);
      if (!a || !b) continue;
      for (const entry of this.collisionListeners) {
        if (!entry.group || a.group === entry.group || b.group === entry.group) {
          try {
            entry.cb(a, b, pair);
          } catch {
            /* swallow listener error */
          }
        }
      }
    }
  }

  private _req(): typeof Matter {
    if (!this.matter) throw new Error('physics_world_not_initialized');
    return this.matter;
  }
}
