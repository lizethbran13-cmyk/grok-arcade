// Grok Pickleball Park - what everyone says. Martina the tortoise runs the Pro Shop; friends call her "Torty".
import { S } from './save.js?v=ppk2';
import { LADDER, TOURNEYS, rankOf } from './data.js?v=ppk2';
import { dillersOwned, smashOwned } from './dlc.js?v=ppk2';
export const LINES = {
  pirat: [['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Arr! Welcome to Stadium Court, matey. I call every line with me one good eye.'], ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'Remember: serve underhand, diagonal. Let the serve bounce, and the return bounce. THEN ye may volley!'], ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat', 'And no volleyin\' in the kitchen! Torty fined me three cheese cubes for that once.']],
  torty0: [['\uD83D\uDC22 Martina (Torty)', 'Welcome to Torty\'s Pro Shop! I\'m Martina, CEO of Tortuga Tech. Everybody calls me Torty.'], ['\uD83D\uDC22 Torty', 'Every paddle has three numbers: POWER for drives, CONTROL for soft dinks and drops, and SPIN for slice and topspin.'], ['\uD83D\uDC22 Torty', 'See the MaxGrit Signature on the glowing stand? Gritty face, tons of spin. And if your paddle grit wears down or cracks from Super Smashes, I\'ll re-grit it — or rebuild it FREE if you\'re ever out of coins!']],
  torty: [['\uD83D\uDC22 Torty', 'Slow and steady wins the rally! Need a new power paddle, Silent Serve foam balls, or a MaxGrit re-grit & edge-guard repair?']],
  luna0: [['\uD83D\uDC2D Luna', 'Hi hi! I\'m Luna, head coach of the Training Center. Ratita Industries sponsors the ball machines and the Super Smash Lab!'], ['\uD83D\uDC2D Luna', 'Drills last 60 seconds. Beat your best score and earn coins. And check out the Super Smash Arena on the west avenue!']],
  luna: [['\uD83D\uDC2D Luna', 'Back for more practice? Let\'s get those dinks feathery — or head to the Super Smash Pavilion to charge up your Super Meter!']],
  snowie: [['\uD83D\uDC01 Snowie', 'Welcome to the Dill-icious Snack Shack! Pickle juice is great after a long rally. Trust me, I fly a lot.']],
  candy: [['\uD83D\uDC36 Candy', 'Woof! *drops a slobbery pickleball at your feet* ...Woof?'], ['\uD83D\uDC36 Candy', '(Candy is on Quiet Court patrol. She approves of foam balls. Less loud. More chewable.)']],
  marge: [['\uD83D\uDCCB Marge (Front Desk)', 'Welcome to the Clubhouse, hon! Sign up for the Park Ladder, a tournament, or the Super Smash Cup right here.']],
  tickets: [['\uD83C\uDF9F\uFE0F Ticket Booth', 'Entry is free today! Super Smash Arena is on the west avenue, Drive Dillers Indoor Center is on the east avenue, and the Pro Shop is across the plaza!']],
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
    ['\uD83D\uDC22 Torty (Drive Dillers Pro Rack)', 'Tortuga Tech engineered the carbon-honeycomb Drive Diller Pro paddle specifically for indoor 26-hole and Silent Serve foam play! Grab your free indoor & foam balls at the Ball Bar!'],
  ],
  lunaSmash: [
    ['\uD83D\uDC2D Luna (Chief Smash Engineer)', 'Squeak!! Welcome to the SUPER SMASH ARENA! I ported our Ratita Industries Super Energy Generator straight from the OG Grok Pickleball Smash Lab!'],
    ['\uD83D\uDC2D Luna (Chief Smash Engineer)', 'In Super Smash Mode \uD83D\uDCA5, every hit charges your SUPER METER (\u26A1 0\u2013100%). Normal winners score 1 PT, overhead SMASH winners score 2 PTS, and a full-charge SUPER SMASH scores 3 PTS!'],
    ['\uD83D\uDC2D Luna (Chief Smash Engineer)', 'Pick any of the 6 OG Smashers — Rocket Rita \uD83D\uDE80, Frosty Fran \u2744\uFE0F, Bolt Bo \u26A1, Big Bertha \uD83C\uDFD0, Dill Dan \uD83E\uDD52, or Curvy Kiki \uD83C\uDF4C — and play across Lava Island, Moon Base, and Candy Stadium!'],
  ],
  snowieSmash: [
    ['\uD83D\uDC01 Snowie (Smash Cup Announcer)', 'Squeak-squeak!! Ready for the 3-Round SUPER SMASH CUP \uD83C\uDFC6?! Round 1 is on Lava Island \uD83C\uDF0B, Round 2 blasts off to Moon Base \uD83D\uDE80, and the Championship Final is on Candy Stadium \uD83C\uDF6D!'],
    ['\uD83D\uDC01 Snowie (Smash Cup Announcer)', 'Grab a free Rocket Blaster paddle & Silent Serve Super Foam ball from our Smash Gear Bar before you step onto the court!'],
  ],
  tortySmash: [
    ['\uD83D\uDC22 Torty (MaxGrit Repair Forge)', 'Heavy overhead smashes and Super Smashes wear down your paddle\'s MaxGrit surface and can crack the edge guard!'],
    ['\uD83D\uDC22 Torty (MaxGrit Repair Forge)', 'Bring your paddle to my Forge anytime for a fresh MaxGrit re-grit & edge-guard rebuild. And Tortuga Tech\'s Never-Stuck Guarantee means if your paddle hits 0% or you\'re out of coins, I rebuild it 100% FREE!'],
  ],
  candySmash: [
    ['\uD83D\uDC36 Candy (Smash Ball Hound)', 'WOOF! *bounces a glowing Silent Serve Super Foam ball high into the air for you to SMASH!*'],
    ['\uD83D\uDC36 Candy (Smash Ball Hound)', '(Whenever you\'re low on coins, Candy digs up a Lucky Golden Pickleball stipend so you can always repair your gear and keep smashing!)'],
  ],
  piratSmash: [
    ['\uD83C\uDFF4\u200D\u2620\uFE0F Umpire Pi-rat (Candy Stadium)', 'ARR! Welcome to Candy Stadium Smash Court, matey! Overhead smashes count DOUBLE (2 pts) and Super Smashes count TRIPLE (3 pts)! Fire the cannons!'],
  ],
};
// Pi-rat's extra umpire calls (sometimes he name-drops Torty)
export const UMP = ['Arr!', 'Quiet on the court, landlubbers!', 'Torty says that line call was IN.', 'One eye, zero mistakes.', 'Mind the kitchen, matey!', 'Torty is cheering from the shop!', 'Shiver me whiskers, what a rally!', 'BOOM! That smash rattled me eyepatch!'];
// what to do next (shown in the HUD)
export function goal() {
  if ((S.padCond ?? 100) <= 25) return '\uD83D\uDEE0\uFE0F Paddle grit worn (' + Math.round(S.padCond) + '%)! Visit Torty\'s MaxGrit Forge (West Ave) or Pro Shop for a tune-up!';
  if (smashOwned() && !(S.smash && S.smash.wins)) return '\uD83D\uDCA5 Visit Super Smash Arena (west avenue) & play the Super Smash Cup across Lava, Moon & Candy courts!';
  if (dillersOwned() && !(S.dillers && S.dillers.wins)) return '\uD83C\uDFDF\uFE0F Visit Drive Dillers Indoor Center (east avenue) & enter Snowie\'s Indoor Tournament!';
  if (!S.seenMatch) return '\uD83C\uDFD3 Walk onto any court and play your first match';
  if (!S.talks.torty) return '\uD83D\uDED2 Visit Torty\'s Pro Shop across the plaza';
  if (!S.drills || !Object.keys(S.drills).length) return '\uD83C\uDFAF Try a drill with Luna at the Training Center';
  if (S.ladder >= 1) { const r = LADDER[10 - S.ladder]; return '\uD83E\uDE9C Ladder: challenge #' + S.ladder + ' ' + r.n + ' (Clubhouse)'; }
  const t = TOURNEYS.find((x) => !(S.tour && S.tour[x.id]) && S.rating >= x.need); if (t) return t.icon + ' Win the ' + t.n;
  return '\uD83D\uDC51 ' + rankOf(S.rating).n + '! Defend your title on Stadium Court';
}
