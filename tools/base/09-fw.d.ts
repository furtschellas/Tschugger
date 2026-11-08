// types for the TypeScript check of the components (tests/tsconfig.json); the build reads only .js
export const html: (s: TemplateStringsArray, ...v: any[]) => any;
export const h: (...a: any[]) => any;
export const prender: (vnode: any, el: Element) => void;
export const ISLANDS: Record<string, (props: any) => any>;
export function useState<T>(v: T | (() => T)): [T, (v: T | ((o: T) => T)) => void];
export function useEffect(fn: () => void | (() => void), deps?: any[]): void;
export function useMemo<T>(fn: () => T, deps: any[]): T;
export function useRef<T>(v?: T): { current: T };
export function useLayoutEffect(fn: () => void | (() => void), deps?: any[]): void;
export function toHTML(vnode: any): string;
