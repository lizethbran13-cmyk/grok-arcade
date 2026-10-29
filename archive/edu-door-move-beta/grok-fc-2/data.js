/* Grok FC 2 - data: bootleg leagues, clubs, nations, star players, family pet legends */
(function () {
  'use strict';
  const D = window.FC2D = {};
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const FIRST = ['Gus', 'Toni', 'Rafa', 'Jojo', 'Mats', 'Iker', 'Dani', 'Theo', 'Nico', 'Paco', 'Bram', 'Lalo', 'Kai', 'Ruben', 'Enzo', 'Hugo', 'Milo', 'Sven', 'Beto', 'Chuy', 'Owen', 'Remy', 'Luca', 'Yusuf', 'Otto', 'Joao', 'Ivo', 'Seb', 'Tomas', 'Ali'];
  const LAST = ['Crumbs', 'Bricko', 'Nutmeg', 'Volley', 'Pasta', 'Cheddar', 'Brie', 'Rondo', 'Panenka', 'Tiki', 'Taka', 'Header', 'Rabona', 'Chipper', 'Wall', 'Gloves', 'Bicycle', 'Offside', 'Woodwork', 'Toepoke', 'Scissors', 'Megs', 'Trivela', 'Stepover', 'Cross', 'Lobster', 'Boots', 'Sweeper', 'Target', 'Pressing'];
  const SKIN = ['#f1c7a3', '#e0ac85', '#c68863', '#9a6440', '#6e4428', '#4a2c1a'], HAIR = ['#1b1210', '#3b2414', '#6b4423', '#c9a55c', '#e8d6a0', '#a23b1d', '#111'];
  const BOOT = ['#ff3d7f', '#22d3ee', '#facc15', '#a3e635', '#ffffff', '#111827', '#f97316'];
  const POS = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW', 'FW'];
  function st(base, pos) { const v = (k) => Math.max(35, Math.min(97, Math.round(base - 7 + (rnd() - 0.5) * 16 + k))); const o = { PAC: v(pos === 'FW' ? 4 : 0), SHO: v(pos === 'FW' ? 6 : pos === 'DF' ? -16 : -4), PAS: v(pos === 'MF' ? 6 : 0), DRI: v(pos === 'DF' ? -8 : 2), DEF: v(pos === 'DF' || pos === 'GK' ? 8 : pos === 'FW' ? -22 : -6), PHY: v(0) }; return o; }
  D.ovr = (s) => { const a = [s.PAC, s.SHO, s.PAS, s.DRI, s.DEF, s.PHY].sort((x, y) => y - x); return Math.round((a[0] + a[1] + a[2] + a[3]) / 4); };
  function star(n, pos, s, look) { const [PAC, SHO, PAS, DRI, DEF, PHY] = s; return { n, pos, s: { PAC, SHO, PAS, DRI, DEF, PHY }, star: true, look }; }
  function roster(base, stars) {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const pos = POS[i], sp = stars.find((x) => x.pos === pos && !x.used);
      if (sp) { sp.used = true; out.push(Object.assign({ num: i === 0 ? 1 : [0, 4, 5, 8, 10, 9, 7][i] }, sp)); continue; }
      out.push({ n: FIRST[(rnd() * FIRST.length) | 0] + ' ' + LAST[(rnd() * LAST.length) | 0], pos, s: st(base, pos), num: [1, 4, 5, 8, 10, 9, 11][i],
        look: { skin: SKIN[(rnd() * 6) | 0], hair: HAIR[(rnd() * 7) | 0], style: (rnd() * 6) | 0, boot: BOOT[(rnd() * 7) | 0], beard: rnd() < 0.25 } });
    }
    stars.forEach((x) => delete x.used); return out;
  }
  const L = (skin, hair, style, boot, beard) => ({ skin, hair, style, boot, beard: !!beard });
  const S = {
    holland: star('Erling Holland', 'FW', [89, 94, 66, 80, 45, 92], L('#f6d4b8', '#f1dc92', 2, '#facc15')),
    kidman: star('Luka Kidman', 'MF', [72, 78, 92, 89, 72, 68], L('#efc8a6', '#8b6a3e', 1, '#ffffff')),
    messy: star('Leo Messy', 'FW', [82, 92, 93, 96, 38, 66], L('#e9bf98', '#2a1a10', 0, '#ff3d7f', true)),
    mbop: star('Kylian M-Bop', 'FW', [97, 90, 80, 92, 36, 78], L('#7a4a2c', '#111', 4, '#f97316')),
    vini: star('Vini Samba Jr.', 'FW', [95, 84, 80, 93, 30, 70], L('#6e4428', '#111', 5, '#22d3ee')),
    cane: star('Harry Cane', 'FW', [70, 93, 85, 82, 46, 84], L('#f1c7a3', '#6b4423', 0, '#ffffff')),
    jam: star('Jude Bellingjam', 'MF', [80, 85, 85, 88, 78, 84], L('#8a5a38', '#111', 0, '#a3e635')),
    pulis: star('Christian Pulis-Sick', 'FW', [86, 80, 79, 85, 40, 68], L('#efc8a6', '#3b2414', 0, '#ff3d7f')),
    chucky: star('Chucky Lozanacho', 'FW', [91, 82, 77, 86, 35, 70], L('#c68863', '#1b1210', 3, '#facc15')),
    ochoa: star('Memo Ochoa-Wall', 'GK', [55, 30, 70, 60, 88, 80], L('#c68863', '#1b1210', 5, '#22d3ee')),
    vinijr: star('Vinny Gaúcho', 'MF', [84, 82, 88, 92, 50, 66], L('#9a6440', '#111', 3, '#facc15')),
    bruno: star('Bruno Fernandezzz', 'MF', [74, 86, 90, 84, 66, 74], L('#e0ac85', '#1b1210', 0, '#ffffff', true)),
    mandrilV: star('Vinicius Mandril', 'FW', [95, 86, 80, 94, 30, 70], L('#6e4428', '#111', 5, '#22d3ee')),
    lamine: star('Lamine Yappal', 'FW', [92, 84, 86, 93, 34, 60], L('#9a6440', '#111', 0, '#ff3d7f')),
    messyMia: star('Leo Messy', 'FW', [82, 92, 93, 96, 38, 66], L('#e9bf98', '#2a1a10', 0, '#ff3d7f', true)),
    dembel: star('Ousmane Dembelly', 'FW', [93, 84, 82, 92, 34, 66], L('#6e4428', '#111', 4, '#a3e635')),
    gignac: star('André-Pierre Taco-Gignac', 'FW', [68, 88, 78, 80, 40, 86], L('#e0ac85', '#1b1210', 0, '#f97316', true)),
    berterame: star('Rayo Berterame', 'FW', [82, 85, 74, 82, 38, 76], L('#efc8a6', '#3b2414', 1, '#22d3ee')),
    henry: star('Henry Martini', 'FW', [80, 84, 72, 80, 42, 80], L('#c68863', '#1b1210', 0, '#facc15')),
    chicha: star('Chicharito Jr.', 'FW', [84, 86, 70, 80, 36, 70], L('#e0ac85', '#1b1210', 0, '#ffffff'))
  };
  const C = (id, n, sh, kit, base, stars, lg) => ({ id, n, short: sh, kit, base, lg, stars });
  D.LEAGUES = [
    { id: 'pcl', n: 'Premier Crown League', flag: '👑', teams: [
      C('mnsu', 'Manchester Not-So-United', 'MNU', ['#7dd3fc', '#ffffff', '#7dd3fc'], 84, [S.holland]),
      C('mibc', 'Manchester Is Blue City', 'MIB', ['#dc2626', '#ffffff', '#111111'], 81, [S.bruno]),
      C('lgun', 'London Gunners Grok', 'LGG', ['#ef4444', '#ffffff', '#ffffff'], 82, []),
      C('lpool', 'Liverpoodle FC', 'LPD', ['#b91c1c', '#b91c1c', '#b91c1c'], 82, []),
      C('chel', 'Chelski Blues', 'CHL', ['#1d4ed8', '#1d4ed8', '#ffffff'], 79, [])] },
    { id: 'lsl', n: 'La Sol Liga', flag: '☀️', teams: [
      C('rmand', 'Real Mandril', 'RMD', ['#ffffff', '#ffffff', '#ffffff'], 85, [S.mandrilV, S.jam]),
      C('bark', 'FC Bark-elona', 'BRK', ['#a50044', '#004d98', '#a50044'], 84, [S.lamine]),
      C('atl', 'Atlético Madrat', 'ATM', ['#cb3524', '#1e3a8a', '#cb3524'], 80, []),
      C('sev', 'Sevilla Naranjas', 'SEV', ['#f8fafc', '#ef4444', '#ffffff'], 77, [])] },
    { id: 'sfm', n: 'Serie Formaggio', flag: '🧀', teams: [
      C('juv', 'Juventoast', 'JUV', ['#111111', '#ffffff', '#111111'], 81, []),
      C('milm', 'AC Milano Mozza', 'ACM', ['#b91c1c', '#ffffff', '#111111'], 80, []),
      C('intm', 'Inter Mozzarella', 'INT', ['#1e3a8a', '#111111', '#1e3a8a'], 82, []),
      C('nap', 'Napoli Pizza', 'NAP', ['#38bdf8', '#ffffff', '#38bdf8'], 80, [])] },
    { id: 'l1', n: 'Ligue Un', flag: '🥐', teams: [
      C('psg', 'Paris Saint-Gouda', 'PSG', ['#0b1f4f', '#0b1f4f', '#dc2626'], 84, [S.dembel]),
      C('om', 'Olympique Marsala', 'OM', ['#ffffff', '#ffffff', '#38bdf8'], 77, []),
      C('lyon', 'Lyon Lions', 'OL', ['#ffffff', '#1d4ed8', '#dc2626'], 76, []),
      C('mon', 'Monaco Croissant', 'MCO', ['#dc2626', '#ffffff', '#dc2626'], 78, [])] },
    { id: 'mls', n: 'MLS Stars', flag: '🇺🇸', teams: [
      C('mia', 'Inter Miami Palms', 'MIA', ['#f7b5cd', '#111111', '#f7b5cd'], 79, [S.messyMia]),
      C('lag', 'LA Galaxy Gouda', 'LAG', ['#ffffff', '#1e3a8a', '#facc15'], 76, []),
      C('sea', 'Seattle Sonar', 'SEA', ['#65a30d', '#1e3a8a', '#65a30d'], 75, []),
      C('nyc', 'NYC Rat-ers', 'NYC', ['#7dd3fc', '#1e3a8a', '#ffffff'], 74, [])] },
    { id: 'lmx', n: 'Liga MX Fiesta', flag: '🌮', teams: [
      C('ame', 'Club América Águilas', 'AME', ['#facc15', '#1e3a8a', '#facc15'], 79, [S.henry]),
      C('chiv', 'Chivas Guadalajara', 'GDL', ['#ffffff', '#1e3a8a', '#dc2626'], 77, [S.chicha]),
      C('tig', 'Tigres del Norte', 'TIG', ['#facc15', '#1e3a8a', '#facc15'], 78, [S.gignac]),
      C('mty', 'Monterrey Rayos', 'MTY', ['#1e3a8a', '#ffffff', '#1e3a8a'], 78, [S.berterame]),
      C('cruz', 'Cruz Azul Celestes', 'CAZ', ['#1d4ed8', '#ffffff', '#1d4ed8'], 76, []),
      C('pum', 'Pumas Unam-azing', 'PUM', ['#ffffff', '#1e3a8a', '#ca8a04'], 75, [])] }
  ];
  D.NATIONS = [
    C('cro', 'Croatia Checkers', 'CRO', ['checker', '#ffffff', '#1d4ed8'], 82, [S.kidman]),
    C('nor', 'Norway Fjords', 'NOR', ['#dc2626', '#ffffff', '#1e3a8a'], 79, [S.holland]),
    C('arg', 'Argentina Albiceleste', 'ARG', ['stripe', '#111111', '#ffffff'], 86, [S.messy]),
    C('fra', 'France Bleus', 'FRA', ['#1e3a8a', '#ffffff', '#dc2626'], 86, [S.mbop]),
    C('mex', 'Mexico El Tri', 'MEX', ['#15803d', '#ffffff', '#dc2626'], 79, [S.chucky, S.ochoa]),
    C('usa', 'USA Stars', 'USA', ['#ffffff', '#1e3a8a', '#ffffff'], 78, [S.pulis]),
    C('bra', 'Brazil Samba', 'BRA', ['#facc15', '#1d4ed8', '#ffffff'], 85, [S.vini, S.vinijr]),
    C('eng', 'England Three Lions', 'ENG', ['#ffffff', '#1e3a8a', '#ffffff'], 84, [S.cane, S.jam])
  ];
  D.ALL = [];
  D.LEAGUES.forEach((l) => l.teams.forEach((t) => { t.lg = l.id; D.ALL.push(t); }));
  D.NATIONS.forEach((t) => { t.lg = 'nat'; D.ALL.push(t); });
  D.ALL.forEach((t) => { t.players = roster(t.base, t.stars.slice()); });
  D.team = (id) => D.ALL.find((t) => t.id === id) || (D.custom && D.custom.id === id ? D.custom : null);
  D.strength = (t) => Math.round(t.players.reduce((a, p) => a + D.ovr(p.s), 0) / t.players.length);
  // family pet legends: signable in the Transfer Market, sideline mascots, commentators
  D.PETS = [
    { id: 'luna', n: 'Luna', kind: 'fancy rat', icon: '🐀', col: '#b08968', role: 'Sideline Mascot & Legend Winger', pos: 'MF', s: { PAC: 96, SHO: 80, PAS: 88, DRI: 95, DEF: 50, PHY: 55 }, line: 'Luna twirls her tail — the crowd goes wild!' },
    { id: 'pirat', n: 'Pi-rat', kind: 'one-eyed fancy rat', icon: '🏴‍☠️', col: '#6b5b4b', role: 'Co-Commentator & Legend Striker', pos: 'FW', s: { PAC: 90, SHO: 94, PAS: 78, DRI: 88, DEF: 40, PHY: 60 }, line: 'Pi-rat in the booth: "Arr, that be a screamer!"' },
    { id: 'snowie', n: 'Snowie', kind: 'white fancy rat', icon: '❄️', col: '#f8fafc', role: 'Legend Playmaker', pos: 'MF', s: { PAC: 84, SHO: 78, PAS: 97, DRI: 90, DEF: 62, PHY: 52 }, line: 'Snowie threads a pass through the eye of a needle!' },
    { id: 'candy', n: 'Candy', kind: 'miniature schnauzer', icon: '🐕', col: '#9ca3af', role: 'Head Mascot & Legend Defender', pos: 'DF', s: { PAC: 88, SHO: 60, PAS: 74, DRI: 70, DEF: 95, PHY: 90 }, line: 'Candy on the touchline: "Woof! Woof!"' },
    { id: 'torty', n: 'Torty (Martina)', kind: 'desert tortoise', icon: '🐢', col: '#65a30d', role: 'Lead Commentator & Legend Keeper', pos: 'GK', s: { PAC: 30, SHO: 40, PAS: 80, DRI: 40, DEF: 99, PHY: 99 }, line: 'Torty (Martina): "Slow and steady wins the league, folks."' }
  ];
  D.PETS.forEach((p) => { p.pet = true; p.price = 60 + D.ovr(p.s); p.look = { pet: p.id }; });
  // transfer market pool: every star + every pet legend + a few free agents
  D.market = function () {
    const out = [], seen = {};
    D.ALL.forEach((t) => t.players.forEach((p) => { if (p.star && !seen[p.n]) { seen[p.n] = 1; out.push(Object.assign({}, p, { from: t.n, price: Math.round(D.ovr(p.s) * 1.4 - 40) })); } }));
    D.ALL.forEach((t, i) => { if (i % 3 === 0) { const p = t.players[1 + (i % 6)]; out.push(Object.assign({}, p, { from: t.n, price: Math.max(8, D.ovr(p.s) - 50) })); } });
    D.PETS.forEach((p) => out.push(Object.assign({}, p, { from: 'Family Pet Legend', price: p.price })));
    return out.sort((a, b) => D.ovr(b.s) - D.ovr(a.s));
  };
})();
