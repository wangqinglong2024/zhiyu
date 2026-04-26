/**
 * Tiny zustand-style store without the dep. Single state object, listeners,
 * and `getState`/`setState`. Selector subscriptions return primitives or
 * memoized refs; we keep it simple with `useSyncExternalStore`.
 */
import { useSyncExternalStore } from 'react';

type Listener = () => void;
type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
) => void;
type GetState<T> = () => T;
type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

interface StoreApi<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Listener) => () => void;
}

export function create<T extends object>(initializer: StateCreator<T>): {
  <U>(selector: (state: T) => U): U;
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Listener) => () => void;
} {
  let state: T;
  const listeners = new Set<Listener>();
  const setState: SetState<T> = (partial) => {
    const next = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(state) : partial;
    if (Object.is(next, state)) return;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const getState: GetState<T> = () => state;
  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  state = initializer(setState, getState);
  function useStore<U>(selector: (state: T) => U): U {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(state),
    );
  }
  (useStore as unknown as StoreApi<T>).getState = getState;
  (useStore as unknown as StoreApi<T>).setState = setState;
  (useStore as unknown as StoreApi<T>).subscribe = subscribe;
  return useStore as typeof useStore & StoreApi<T>;
}
