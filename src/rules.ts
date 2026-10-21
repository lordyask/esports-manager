export const ENGINE_VERSION = '0.3.0';
export const RULES_VERSION = 'gdd-1.3';
export type Weapon = 'basic' | 'intermediate' | 'main' | 'precision';
export type Range = 'short' | 'medium' | 'long';
export type Team = 'A' | 'B';
export type Sector = 'attack' | 'defense' | 'A' | 'B' | 'mid';
export type MapId = 'patio' | 'horizonte' | 'enlace';
export type Attributes = [number, number, number, number, number, number, number, number];
export const WEAPONS: Record<Weapon, {price: number; damage: number; cadence: number}> = {
  basic: {price: 0, damage: 30, cadence: 500},
  intermediate: {price: 1800, damage: 34, cadence: 500},
  main: {price: 3600, damage: 40, cadence: 500},
  precision: {price: 3600, damage: 100, cadence: 1000},
};
export const CADENCE_PRECISION = {short: 1500, medium: 1000, long: 750};
export const RANGE_SCORE = {short: -8, medium: 0, long: 8};
export const SKILL_COSTS = [300, 400, 700] as const;
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export function integer(x: number, lo: number, hi: number, label: string): number {
  if (!Number.isSafeInteger(x) || x < lo || x > hi) throw new Error(`Invalid ${label}`);
  return x;
}
export function finite(x: number, lo: number, hi: number, label: string): number {
  if (!Number.isFinite(x) || x < lo || x > hi) throw new Error(`Invalid ${label}`);
  return x;
}
export const MONEY_CAP = 12000;
export const ROUND_MS = 100000;
export const PLANT_MS = 4000;
export const DETONATION_MS = 40000;
export const DEFUSE_MS = 7000;
export function mapEdges(id: MapId): [Sector, Sector, number][] {
  const t = {patio: [12, 8, 6, 7, 9], horizonte: [18, 12, 10, 10, 12], enlace: [16, 8, 6, 9, 8]}[id];
  if (!t) throw new Error('Invalid map');
  return [ ['attack','A',t[0]*1000], ['attack','B',t[0]*1000], ['attack','mid',t[1]*1000],
    ['mid','A',t[2]*1000], ['mid','B',t[2]*1000], ['defense','A',t[3]*1000],
    ['defense','B',t[3]*1000], ['defense','mid',t[4]*1000] ];
}
export const edgeKey = (a: Sector, b: Sector) => [a,b].sort().join(':');
export const compareIds = (a: string,b: string) => a<b?-1:a>b?1:0;
export function shortestPath(id: MapId, from: Sector, to: Sector, blocked: string[] = []): {path: Sector[]; ms: number} | null {
  const sectors: Sector[] = ['attack','defense','A','B','mid'];
  if (!sectors.includes(from) || !sectors.includes(to)) throw new Error('Invalid sector');
  const distances = new Map<Sector, number>(sectors.map(s => [s, Infinity]));
  const paths = new Map<Sector, Sector[]>([[from,[from]]]);
  const remaining = new Set(sectors); distances.set(from,0);
  while (remaining.size) {
    const current = [...remaining].sort((a,b) => distances.get(a)!-distances.get(b)! || compareIds(a,b))[0];
    remaining.delete(current);
    if (!Number.isFinite(distances.get(current)!)) return null;
    if (current === to) return {path: paths.get(to)!, ms: distances.get(to)!};
    for (const [a,b,ms] of mapEdges(id)) {
      const next = a===current ? b : b===current ? a : null;
      if (!next || !remaining.has(next) || blocked.includes(edgeKey(a,b))) continue;
      if (distances.get(current)! + ms < distances.get(next)!) {
        distances.set(next,distances.get(current)!+ms); paths.set(next,[...paths.get(current)!,next]);
      }
    }
  }
  return null;
}
export function mobilityTime(normal: number, kind: 'dash' | 'step'): number {
  integer(normal,1,1e7,'travel duration');
  return Math.max(kind==='dash' ? 1000 : 1500, normal-3000);
}
