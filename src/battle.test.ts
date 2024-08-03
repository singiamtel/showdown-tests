// Check if pokemon-showdown and damage-calc output the same results

import * as common from '../pokemon-showdown/test/common';

 //@ts-expect-error
const commonTools = (common.default) as typeof common;
import {assert} from './utils';
import * as calc from '../damage-calc/calc/src/index';
// @ts-expect-error
const {calculate, Generations, Pokemon, Move} = calc.default;
import fastCartesian from 'fast-cartesian'

type Pokemon = {species: string, ability?: string};

async function test(move: string, p1:Pokemon, p2:Pokemon) {
	/* p1 is the attacker, p2 is the defender */
	const battle = commonTools.createBattle();
	battle.resetRNG(null);
	battle.setPlayer('p1', {team: [{species: p1.species, ability: p1.ability || 'Pressure', moves: [move]}]});
	battle.setPlayer('p2', {team: [{species: p2.species, ability: p2.ability || 'Pressure', moves: ['sleeptalk']}]});
	battle.makeChoices(`move ${move}`, 'move sleep talk');
	const gen = Generations.get(battle.gen);
	const result = calculate(
		gen,
		new Pokemon(gen, p1.species, {ability: p1.ability || 'Pressure'}),
		new Pokemon(gen, p2.species, {ability: p2.ability || 'Pressure'}),
		new Move(gen, move),
	);
	const damage = battle.p2.active[0].maxhp - battle.p2.active[0].hp;
	if(Array.isArray(result.damage[0])) {
		const damage_rolls = [...new Set(fastCartesian(result.damage as number[][]).map((d) => d.reduce((a, b) => a + b, 0)))];
		assert(damage_rolls.includes(damage), 'Showdown damage is impossible according to damage-calc. Showdown: ' + damage + ', damage-calc: ' + damage_rolls);
	}
	else {
		assert(result.damage.includes(damage), 'Showdown damage is impossible according to damage-calc. Showdown: ' + damage + ', damage-calc: ' + result.damage);
	}
}

const tests: readonly [string, Pokemon, Pokemon][] = [
	['psystrike', {species: 'Mewtwo-Mega-Y'}, {species: 'Blissey'}],
	['fake out', {species: 'Kangaskhan-Mega', ability: 'Parental Bond'}, {species: 'Shuckle'}],
] as const;

const promises = tests.map(([move, p1, p2]) => test(move, p1, p2));

Promise.all(promises).catch((e) => {
	console.error(e);
	process.exit(1);
});

//test(...tests[1]).catch((e) => {
//	console.error(e);
//	process.exit(1);
//})
