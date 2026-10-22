import { CheeseDash, ShellSlide, CandyCatch, GooFloor } from './games1.js';
import { PickleSmash, TreasureDig, BumperShells, CrownChase } from './games2.js';
export const GAMES = [
  { id: 'cheese', n: 'Cheese Dash', ic: '🧀', C: CheeseDash, how: 'Race through the maze and grab the most cheese! Golden cheese = +5. Watch out for mousetraps (they snap away 2 cheese) and the cheese thieves.', act: '' },
  { id: 'slide', n: 'Shell Slide', ic: '🐢', C: ShellSlide, how: 'Slide Torty down the ice onto the target! Steer to aim, tap GO when the power is just right. Bullseye = 5. Too hard and Torty falls in the icy water!', act: 'GO!' },
  { id: 'catch', n: "Candy's Catch", ic: '🎾', C: CandyCatch, how: 'You are Candy! Run under the falling pickleballs to catch them. Golden balls = +3. Green Goo Balls make you dizzy and cost 1!', act: '' },
  { id: 'goo', n: 'Goo Floor', ic: '🧪', C: GooFloor, how: "Dr. Vic's goo is rising! Red tiles are about to sink, so move and JUMP over gaps. Brown Tortuga Tech tiles never sink. Fall in and you're out!", act: 'JUMP' },
  { id: 'smash', n: 'Pickleball Smash', ic: '🏓', C: PickleSmash, how: 'Quick 2v2! Run to the ball and you hit it by yourself. Hold SMASH for a fast shot. First team to 5 wins!', act: 'SMASH' },
  { id: 'dig', n: "Pi-rat's Treasure Dig", ic: '🏴‍☠️', C: TreasureDig, how: 'Stand on an X and HOLD DIG! Coins +1, gems +3, cheese chests +5… but goo bombs splat you for -2. Arr!', act: 'DIG' },
  { id: 'bumper', n: 'Bumper Shells', ic: '🛟', C: BumperShells, how: 'Ride a shell-tough bumper shell! Tap BUMP to dash and knock rivals into the water (+2). Fall in yourself and lose 1.', act: 'BUMP' },
];
export const FINAL = { id: 'crown', n: 'GRAND FINAL: Crown Chase', ic: '👑', C: CrownChase, how: 'Grab the crown and keep it! Every half second with the crown = +1. DASH into the crown holder to steal it. Stars = +3. Final scores count DOUBLE!', act: 'DASH' };
export const gameById = (id) => id === 'crown' ? FINAL : GAMES.find((g) => g.id === id);
