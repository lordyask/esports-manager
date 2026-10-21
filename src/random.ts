// Integer xorshift32. Algorithm is part of ENGINE_VERSION; state is serializable.
import { integer } from './rules.ts';
export class Random {
  state: number;
  constructor(seed: number) {this.state = integer(seed,1,0xffffffff,'seed') >>> 0;}
  next(): number {
    let x=this.state; x^=x<<13; x^=x>>>17; x^=x<<5; this.state=x>>>0;
    return this.state;
  }
  chance(basisPoints: number): boolean {
    integer(basisPoints,0,10000,'probability');
    // Rejection sampling avoids bias from a simple remainder operation.
    const ceiling = Math.floor(0x100000000/10000)*10000;
    let x: number; do {x=this.next();} while(x>=ceiling);
    return x%10000 < basisPoints;
  }
}
export function randomStreams(seed: number) {
  integer(seed,1,0xffffffff,'seed');
  const mix = (salt: number) => ((seed ^ salt) >>> 0) || salt;
  return {combat: new Random(mix(0x9e3779b9)), decisions: new Random(mix(0x85ebca6b)), generation: new Random(mix(0xc2b2ae35))};
}
