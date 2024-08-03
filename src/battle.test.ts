// Check if pokemon-showdown and damage-calc output the same results

import * as common from '../pokemon-showdown/test/common';

// @ts-expect-error
const commonTools = common.default as typeof import('../pokemon-showdown/test/common');
import {assert} from './utils';
import * as calc from '../damage-calc/calc/src/index';
// @ts-expect-error
const {calculate, Generations, Pokemon, Move} = calc.default;

async function test(move: string, p1:string, p2:string) {

	const battle = commonTools.createBattle();
	battle.setPlayer('p1', {team: [{species: p1, moves: ['sleep talk']}]});
	battle.setPlayer('p2', {team: [{species: p2, moves: [move]}]});
	battle.makeChoices('move sleep talk', `move ${move}`);
	const gen = Generations.get(battle.gen);
	const result = calculate(
		gen,
		new Pokemon(gen, p1),
		new Pokemon(gen, p2),
		new Move(gen, move),
	);
	const damage = battle.p1.active[0].maxhp - battle.p1.active[0].hp;
	assert(result.damage.includes(damage), 'Showdown damage is impossible according to damage-calc. Showdown: ' + damage + ', damage-calc: ' + result.damage);
}

test('psystrike', 'Mewtwo', 'Mewtwo').catch((e) => {
	console.error(e);
	process.exit(1);
});
