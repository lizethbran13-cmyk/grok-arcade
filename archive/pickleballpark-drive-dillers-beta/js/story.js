// Grok Pickleball Park - what everyone says. Martina the tortoise runs the Pro Shop; friends call her "Torty".
import { S } from './save.js?v=ppk2';
import { LADDER, TOURNEYS, rankOf } from './data.js?v=ppk2';
import { dillersOwned } from './dlc.js?v=ppk2';
export const LINES = {
  pirat: [['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Arr! Welcome to Stadium Court, matey. I call every line with me one good eye.'], ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Remember: serve underhand, diagonal. Let the serve bounce, and the return bounce. THEN ye may volley!'], ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'And no volleyin\' in the kitchen! Torty fined me three cheese cubes for that once.']],
  torty0: [['\uD83D\uDC22 Martina (Torty)', 'Welcome to Torty\'s Pro Shop! I\'m Martina, CEO of Tortuga Tech. Everybody calls me Torty.'], ['\uD83D\uDC22 Torty', 'Every paddle has three numbers: POWER for drives, CONTROL for soft dinks and drops, and SPIN for slice and topspin.'], ['\uD83D\uDC22 Torty', 'See the MaxGrit Signature on the glowing stand? Gritty face, tons of spin. And the Silent Serve foam balls are perfect for the Quiet Court and Drive Dillers!']],
  torty: [['\uD83D\uDC22 Torty', 'Slow and steady wins the rally! What can I get you today?']],
  luna0: [['\uD83D\uDC2D Luna', 'Hi hi! I\'m Luna, head coach of the Training Center. Ratita Industries sponsors the ball machines!'], ['\uD83D\uDC2D Luna', 'Drills last 60 seconds. Beat your best score and earn coins. The third-shot drop is the secret of real pickleball!']],
  luna: [['\uD83D\uDC2D Luna', 'Back for more practice? Let\'s get those dinks feathery!']],
  snowie: [['\uD83D\uDC01 Snowie', 'Welcome to the Dill-icious Snack Shack! Pickle juice is great after a long rally. Trust me, I fly a lot.']],
  candy: [['\uD83D\uDC36 Candy', 'Woof! *drops a slobbery pickleball at your feet* ...Woof?'], ['\uD83D\uDC36 Candy', '(Candy is on Quiet Court patrol. She approves of foam balls. Less loud. More chewable.)']],
  marge: [['\uD83D\uDCCB Marge (Front Desk)', 'Welcome to the Clubhouse, hon! Sign up for the Park Ladder or a tournament right here.']],
  tickets: [['\uD83C\uDF9F\uFE0F Ticket Booth', 'Entry is free today! The Park Ladder is in the Clubhouse, Pro Shop is across the plaza, and Drive Dillers Indoor Center is down the east avenue!']],
  snowieDill: [
    ['\uD83D\uDC01 Director Snowie', 'Squeak-squeak!! Welcome to DRIVE DILLERS Indoor Pickleball Center! Look at my cute pink director visor and mini Drive Diller paddle!'],
    ['\uD83D\uDC01 Director Snowie', 'In the Drive Dillers Indoor Tournament \uD83C\uDFDF\uFE0F, you travel across all 3 indoor courts — Emerald Rec Court 1, Silent Serve Foam Court 2, and Drive Dillers Center Stage — and each match gets harder!'],
    ['\uD83D\uDC01 Director Snowie', 'Watch out for Courts Manager Lola and Candy at the court doors! Only 26-Hole Indoor balls or Silent Serve Foam balls are allowed inside — if you bring a 40-Hole Outdoor ball, Candy barks and steals it and Lola kicks you out!'],
  ],
  lolaDill: [
    ['\uD83D\uDC69\u200D\u2696\uFE0F Courts Manager Lola', 'Hold it right there! I\'m Lola, Courts Manager of Drive Dillers, and Candy here is my official Ball Inspector!'],
    ['\uD83D\uDC36 Candy', 'WOOF! WOOF! *sniffs your pickleball bag suspiciously*'],
    ['\uD83D\uDC69\u200D\u2696\uFE0F Courts Manager Lola', 'Rule #1 of Drive Dillers: INDOOR PICKLEBALL BALLS or SILENT SERVE FOAM BALLS ONLY! If you try to start a match with a hard 40-Hole Outdoor ball, Candy will steal it and I\'ll kick you right out the front doors!'],
  ],
  candyDill: [
    ['\uD83D\uDC36 Candy (Indoor Ball Guard)', 'WOOF! *wags tail at Silent Serve foam balls, growls at 40-hole outdoor balls*'],
    ['\uD83D\uDC36 Candy (Indoor Ball Guard)', '(Candy is on strict indoor court duty with Courts Manager Lola! Try playing with an outdoor ball and she will bark and steal it right off the court!)'],
  ],
  lunaDill: [
    ['\uD83D\uDC2D Luna (Spin & Foam Lab)', 'Ratita Industries tested the Franklin Silent Serve foam balls at 42 decibels! Zero clack, super high bounce, and 100% legal on every Drive Dillers indoor court!'],
  ],
  piratDill: [
    ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Arr! Welcome to Drive Dillers Center Stage! Beat Round 1 and Round 2 in the Indoor Tournament and ye\'ll face Director Snowie & Coach Luna right here for the Golden Dill Cup!'],
  ],
  tortyDill: [
    ['\uD83D\uDC22 Torty (Drive Dillers Pro Rack)', 'Tortuga Tech engineered the carbon- honeycomb Drive Diller Pro paddle specifically for indoor 26-hole and Silent Serve foam play! Grab your free indoor & foam balls at the Ball Bar!'],
  ],
};
// Pi-rat's extra umpire calls (sometimes he name-drops Torty)
export const UMP = ['Arr!', 'Quiet on the court, landlubbers!', 'Torty says that line call was IN.', 'One eye, zero mistakes.', 'Mind the kitchen, matey!', 'Torty is cheering from the shop!', 'Shiver me whiskers, what a rally!'];
// what to do next (shown in the HUD)
export function goal() {
  if (dillersOwned() && !(S.dillers && S.dillers.wins)) return '\uD83C\uDFDF\uFE0F Visit Drive Dillers Indoor Center (east avenue) & enter Snowie\'s Indoor Tournament!';
  if (!S.seenMatch) return '\uD83C\uDFD3 Walk onto any court and play your first match';
  if (!S.talks.torty) return '\uD83D\uDED2 Visit Torty\'s Pro Shop across the plaza';
  if (!S.drills || !Object.keys(S.drills).length) return '\uD83C\uDFAF Try a drill with Luna at the Training Center';
  if (S.ladder >= 1) { const r = LADDER[10 - S.ladder]; return '\uD83E\uDE9C Ladder: challenge #' + S.ladder + ' ' + r.n + ' (Clubhouse)'; }
  const t = TOURNEYS.find((x) => !(S.tour && S.tour[x.id]) && S.rating >= x.need); if (t) return t.icon + ' Win the ' + t.n;
  return '\uD83D\uDC51 ' + rankOf(S.rating).n + '! Defend your title on Stadium Court';
}
