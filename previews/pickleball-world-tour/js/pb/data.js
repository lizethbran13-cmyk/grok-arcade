/* Grok Pickleball - constants, courts, opponents, shop */
(function () {
  'use strict';
  const PB = window.PB;
  const D = PB.D = {};
  // real court in metres: 20 ft x 44 ft, kitchen 7 ft, net 36 in at the posts / 34 in in the middle
  D.HW = 3.048; D.HL = 6.705; D.K = 2.134; D.NET_SIDE = 0.914; D.NET_MID = 0.864; D.POST = 3.35; D.BR = 0.037;
  D.netH = (x) => { const t = Math.min(1, Math.abs(x) / D.HW); return D.NET_MID + (D.NET_SIDE - D.NET_MID) * t * t; };

  D.DIFF = {
    easy:   { n: 'Easy',   react: 0.36, speed: 0.76, aim: 0.74, err: 0.09, clear: 0.4, power: 0.72, smart: 0.3, kitchenSlip: 0.03, reach: 0.96, pace: 0.86 },
    medium: { n: 'Medium', react: 0.28, speed: 0.85, aim: 0.58, err: 0.065, clear: 0.32, power: 0.85, smart: 0.5, kitchenSlip: 0.015, reach: 1.0, pace: 0.92 },
    hard:   { n: 'Hard',   react: 0.23, speed: 0.91, aim: 0.47, err: 0.05, clear: 0.27, power: 0.92, smart: 0.66, kitchenSlip: 0.008, reach: 1.03, pace: 0.97 },
    pro:    { n: 'Pro',    react: 0.18, speed: 0.97, aim: 0.38, err: 0.04, clear: 0.22, power: 1.0, smart: 0.8, kitchenSlip: 0.003, reach: 1.06, pace: 1.02 }
  };
  D.DIFF_ORDER = ['easy', 'medium', 'hard', 'pro'];

})();
