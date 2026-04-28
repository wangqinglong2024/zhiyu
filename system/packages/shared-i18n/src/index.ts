import zh from './zh.ts';
import en from './en.ts';
import vi from './vi.ts';
import th from './th.ts';
import id from './id.ts';

export const RESOURCES = { zh, en, vi, th, id } as const;
export type ResourceShape = typeof zh;
