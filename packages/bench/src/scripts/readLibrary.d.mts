export function readLibrary(options: { entries: string[]; root: string; packageRoots: string[] }): { components: Record<string, any>; sets: Record<string, (string | number)[]> };
