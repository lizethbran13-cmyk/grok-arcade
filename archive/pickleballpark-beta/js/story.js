// Grok Pickleball Park - what everyone says. Martina the tortoise runs the Pro Shop; friends call her "Torty".
import { S } from './save.js?v=ppk2';
import { LADDER, TOURNEYS, rankOf } from './data.js?v=ppk2';
export const LINES = {
  pirat: [['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Arr! Welcome to Stadium Court, matey. I call every line with me one good eye.'], ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Remember: serve underhand, diagonal. Let the serve bounce, and the return bounce. THEN ye may volley!'], ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'And no volleyin\' in the kitchen! Torty fined me three cheese cubes for that once.']],
  torty0: [['\uD83D\uDC22 Martina (Torty)', 'Welcome to Torty\'s Pro Shop! I\'m Martina, CEO of Tortuga Tech. Everybody calls me Torty.'], ['\uD83D\uDC22 Torty', 'Every paddle has three numbers: POWER for drives, CONTROL for soft dinks and drops, and SPIN for slice and topspin.'], ['\uD83D\uDC22 Torty', 'See the MaxGrit Signature on the glowing stand? Gritty face, tons of spin. And the Silent Serve foam balls are perfect for the Quiet Court.']],
  torty: [['\uD83D\uDC22 Torty', 'Slow and steady wins the rally! What can I get you today?']],
  luna0: [['\uD83D\uDC2D Luna', 'Hi hi! I\'m Luna, head coach of the Training Center. Ratita Industries sponsors the ball machines!'], ['\uD83D\uDC2D Luna', 'Drills last 60 seconds. Beat your best score and earn coins. The third-shot drop is the secret of real pickleball!']],
  luna: [['\uD83D\uDC2D Luna', 'Back for more practice? Let\'s get those dinks feathery!']],
  snowie: [['\uD83D\uDC01 Snowie', 'Welcome to the Dill-icious Snack Shack! Pickle juice is great after a long rally. Trust me, I fly a lot.']],
  candy: [['\uD83D\uDC36 Candy', 'Woof! *drops a slobbery pickleball at your feet* ...Woof?'], ['\uD83D\uDC36 Candy', '(Candy is on Quiet Court patrol. She approves of foam balls. Less loud. More chewable.)']],
  marge: [['\uD83D\uDCCB Marge (Front Desk)', 'Welcome to the Clubhouse, hon! Sign up for the Park Ladder or a tournament right here.']],
  tickets: [['\uD83C\uDF9F\uFE0F Ticket Booth', 'Entry is free today! The Park Ladder is in the Clubhouse, and the Pro Shop is just across the plaza.']],
};
// Pi-rat's extra umpire calls (sometimes he name-drops Torty)
export const UMP = ['Arr!', 'Quiet on the court, landlubbers!', 'Torty says that line call was IN.', 'One eye, zero mistakes.', 'Mind the kitchen, matey!', 'Torty is cheering from the shop!', 'Shiver me whiskers, what a rally!'];
// what to do next (shown in the HUD)
export function goal() {
  if (!S.seenMatch) return '\uD83C\uDFD3 Walk onto any court and play your first match';
  if (!S.talks.torty) return '\uD83D\uDED2 Visit Torty\'s Pro Shop across the plaza';
  if (!S.drills || !Object.keys(S.drills).length) return '\uD83C\uDFAF Try a drill with Luna at the Training Center';
  if (S.ladder >= 1) { const r = LADDER[10 - S.ladder]; return '\uD83E\uDE9C Ladder: challenge #' + S.ladder + ' ' + r.n + ' (Clubhouse)'; }
  const t = TOURNEYS.find((x) => !(S.tour && S.tour[x.id]) && S.rating >= x.need); if (t) return t.icon + ' Win the ' + t.n;
  return '\uD83D\uDC51 ' + rankOf(S.rating).n + '! Defend your title on Stadium Court';
}
