/**
 * @zhiyu/game — public surface
 *
 * Shared game engine layer for ZY-09 (Epic E09). All exports are tree-shake
 * friendly so individual games may pull only what they need.
 */
export const GAME_ENGINE_VERSION = '0.1.0';

export * from './core/index.js';
export * from './scenes/index.js';
export * from './assets/index.js';
export * from './audio/index.js';
export * from './input/index.js';
export * from './physics/index.js';
export * from './ui/index.js';
export * from './wordpack/index.js';
export * from './fullscreen/index.js';
export * from './analytics/index.js';
