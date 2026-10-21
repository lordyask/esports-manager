import {writeFileSync} from 'node:fs';
import {simulateMap} from '../src/autonomous.ts';
import {profiles,plans} from '../test/fixtures.ts';
const game=simulateMap(profiles(),{map:'enlace',seed:20261016,plans});
writeFileSync(new URL('../match-result.json',import.meta.url),JSON.stringify(game,null,2));
console.log(JSON.stringify(game.summary,null,2));
