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
	battle.setPlayer('p2', {team: [{species: p2.species, ability: p2.ability || 'Battle Armor', moves: ['sleeptalk']}]});
	battle.makeChoices(`move ${move}`, 'move sleep talk');
	const gen = Generations.get(battle.gen);
	const result = calculate(
		gen,
		new Pokemon(gen, p1.species, {ability: p1.ability || 'Pressure'}),
		new Pokemon(gen, p2.species, {ability: p2.ability || 'Battle Armor'}), // Battle Armor is used to prevent crits
		new Move(gen, move),
	);
	const damage = battle.p2.active[0].maxhp - battle.p2.active[0].hp;
	if(battle.p2.active[0].maxhp < result.damage[0]) {
		throw new Error(`This test is useless, the defender is dead. Attacker: ${p1.species}, Defender: ${p2.species}, Move: ${move}`);
	}
	if(Array.isArray(result.damage[0])) {
		const damage_rolls = [...new Set(fastCartesian(result.damage as number[][]).map((d) => d.reduce((a, b) => a + b, 0)))];
		assert(damage_rolls.includes(damage), `Showdown damage is impossible according to damage-calc. Attack: ${p1.species}, Defender: ${p2.species}, Move: ${move}. Showdown: ${damage}, damage-calc: ${result.damage}, seed: ${battle.prng.seed}, logs: ${battle.log.join('\n')}`);
	}
	else {
		assert(result.damage.includes(damage), `Showdown damage is impossible according to damage-calc. Attack: ${p1.species}, Defender: ${p2.species}, Move: ${move}. Showdown: ${damage}, damage-calc: ${result.damage}, seed: ${battle.prng.seed}, logs: ${battle.log.join('\n')}`);
	}
}

// TODO: If an ability is specified for the defender, the test can fail due to crits
const tests: readonly [string, Pokemon, Pokemon][] = [
	['psystrike', {species: 'Mewtwo-Mega-Y'}, {species: 'Kyogre'}],
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
