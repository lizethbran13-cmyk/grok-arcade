const CASES = [
  {
    id: "midnight-archive",
    title: "The Midnight Archive",
    district: "Old Stacks, Sector 4",
    difficulty: "Warm-up",
    brief:
      "At 01:14 the city archive's rare-folio wing went dark. By morning, the only copy of the Arc Charter was gone. Three people had after-hours badges. One of them walked out with the charter.",
    culprit: "nena",
    motive: "debt",
    method: "badge-clone",
    suspects: [
      {
        id: "nena",
        name: "Nena Voss",
        role: "Night archivist",
        blurb: "Keeps the late shift. Knows every lock by sound."
      },
      {
        id: "elio",
        name: "Elio Park",
        role: "Restoration donor",
        blurb: "Funded the wing. Claims he only came to check humidity logs."
      },
      {
        id: "marc",
        name: "Marc Ibarra",
        role: "Courier",
        blurb: "Dropped a sealed crate at 00:40 and says he left at once."
      }
    ],
    clues: [
      {
        id: "c1",
        title: "Badge log",
        text: "Nena's badge pinged the rare-folio door at 01:11 and again at 01:19. Elio's badge pinged the lobby only. Marc's badge never entered the wing."
      },
      {
        id: "c2",
        title: "Humidity slip",
        text: "Elio's humidity printout is timestamped 00:52 from the public kiosk, not the vault. He could not have printed it inside."
      },
      {
        id: "c3",
        title: "Crate seal",
        text: "Marc's crate is still sealed. The charter would not fit in a courier sleeve; it needs a flat folio case."
      },
      {
        id: "c4",
        title: "Pawn note",
        text: "A torn note in the trash room lists Nena's name and a same-day debt collection for 4,200 credits."
      },
      {
        id: "c5",
        title: "Clone smear",
        text: "The door reader shows two near-identical badge signatures one second apart: a hardware clone, not a borrowed card."
      }
    ],
    interviews: {
      nena: [
        {
          q: "Where were you when the lights died?",
          a: "In the stacks, reshelving. The wing door sticks. I badged twice. That is all."
        },
        {
          q: "The pawn note has your name on it.",
          a: "Collectors pad the number. I did not touch the charter. Ask the donor. He hovers."
        },
        {
          q: "The reader logged a cloned badge.",
          a: "...Clones are courier tricks. I only have the one card. Check Marc."
        }
      ],
      elio: [
        {
          q: "Why were you here after midnight?",
          a: "The wing runs damp. I printed the humidity log and left. Philanthropy is not a crime."
        },
        {
          q: "Your printout came from the lobby kiosk.",
          a: "Then the kiosk clock is wrong. I was in the lobby the whole time. Ask the log."
        }
      ],
      marc: [
        {
          q: "Did you open the crate?",
          a: "No. Seal's intact. I drop, I go. Archives give me the creeps."
        },
        {
          q: "Someone cloned a badge.",
          a: "Not mine. My reader died last month. I sign paper now."
        }
      ]
    },
    motives: [
      { id: "debt", label: "Same-day debt pressure" },
      { id: "fame", label: "Wanted the public credit" },
      { id: "rival", label: "A rival archive paid them" }
    ],
    methods: [
      { id: "badge-clone", label: "Cloned badge at the folio door" },
      { id: "crate", label: "Smuggled out in the courier crate" },
      { id: "donor-key", label: "Used the donor's master key" }
    ]
  },
  {
    id: "signal-orchard",
    title: "Signal Orchard",
    district: "Roof gardens, East Span",
    difficulty: "Standard",
    brief:
      "The orchard drones that pollinate the span went rogue at dusk and stripped one private greenhouse. The owner says a saboteur retuned the hive. Three people had the orchard app that night.",
    culprit: "silo",
    motive: "patent",
    method: "override",
    suspects: [
      {
        id: "silo",
        name: "Silo Chen",
        role: "Hive technician",
        blurb: "Wrote the override used in emergencies."
      },
      {
        id: "ada",
        name: "Ada Quill",
        role: "Greenhouse owner",
        blurb: "Filed a claim before the drones even landed."
      },
      {
        id: "bren",
        name: "Bren Holt",
        role: "Rival grower",
        blurb: "Lost a contract to Ada last week."
      }
    ],
    clues: [
      {
        id: "c1",
        title: "Override hash",
        text: "The rogue route was signed with an emergency override. Only Silo's key can mint that signature."
      },
      {
        id: "c2",
        title: "Claim clock",
        text: "Ada's insurance draft was started at 16:02. The swarm left the hive at 18:41. Early, but it cites last month's hail damage, not tonight."
      },
      {
        id: "c3",
        title: "Rival alibi",
        text: "Bren was on a recorded span-tram from 18:10 to 19:05. His app session is read-only telemetry, no write rights."
      },
      {
        id: "c4",
        title: "Patent draft",
        text: "Silo's laptop has an unsent patent filing for 'adaptive orchard routing,' using tonight's flight path as the example dataset."
      }
    ],
    interviews: {
      silo: [
        {
          q: "Your key signed the rogue route.",
          a: "Emergency overrides log under my key even if someone else pushes the button. That is a bad design. I know."
        },
        {
          q: "The patent draft uses tonight's path.",
          a: "I simulate. I do not steal fruit. Ada has been begging for a showy failure so she can refinance."
        }
      ],
      ada: [
        {
          q: "You filed before the swarm launched.",
          a: "That draft is about hail. I reuse the template. Check the date in the header."
        },
        {
          q: "Who else can fly the hive?",
          a: "Silo. Bren watches, he doesn't fly. If the signature is Silo's, stop interviewing me."
        }
      ],
      bren: [
        {
          q: "You lost the contract.",
          a: "I lost it clean. I was on the tram. Telemetry only. I like watching drones. That's not sabotage."
        }
      ]
    },
    motives: [
      { id: "patent", label: "Needed a real flight for a patent" },
      { id: "insurance", label: "Insurance payout" },
      { id: "revenge", label: "Revenge for a lost contract" }
    ],
    methods: [
      { id: "override", label: "Emergency override only Silo can sign" },
      { id: "app-share", label: "Shared app session from the tram" },
      { id: "manual", label: "Hand-flew the drones from the greenhouse" }
    ]
  },
  {
    id: "last-lamp",
    title: "The Last Lamp",
    district: "Pier 9, blackout block",
    difficulty: "Sharp",
    brief:
      "During a planned blackout test, the last lamp on Pier 9 stayed lit for eleven minutes. Under it, a witness saw a figure lift the harbor master's case. When the grid returned, the case was in the water and the lamp was cold.",
    culprit: "iona",
    motive: "silence",
    method: "lamp-loop",
    suspects: [
      {
        id: "iona",
        name: "Iona Reese",
        role: "Grid tester",
        blurb: "Ran the blackout script. Says the lamp was a fault."
      },
      {
        id: "hugo",
        name: "Hugo Pell",
        role: "Harbor master",
        blurb: "Owns the case. Says it held tide bribes he was about to report."
      },
      {
        id: "wynn",
        name: "Wynn Calder",
        role: "Witness, night fisher",
        blurb: "Saw the figure. Won't describe the coat."
      }
    ],
    clues: [
      {
        id: "c1",
        title: "Script diff",
        text: "Iona's blackout script has a one-line exception: Pier 9 lamp stays powered for 600 seconds, labeled 'sightline.'"
      },
      {
        id: "c2",
        title: "Case contents",
        text: "Divers recovered the case. Inside: a recorder, wiped, and a note in Hugo's hand naming Iona as the person who offered him silence money."
      },
      {
        id: "c3",
        title: "Fisher's net",
        text: "Wynn's boots are dry. The pier ladder is wet. Whoever ditched the case climbed down. Wynn never left the rail."
      },
      {
        id: "c4",
        title: "Coat thread",
        text: "A grid-tester reflective thread is caught on the lamp cage. Hugo wears wool. Wynn wears oilskin."
      }
    ],
    interviews: {
      iona: [
        {
          q: "Why does your script keep Pier 9 lit?",
          a: "Safety sightline. If I kill every lamp, someone walks into the water. Procedure."
        },
        {
          q: "Hugo's note says you paid for silence.",
          a: "Hugo writes fiction when he's scared. I test grids. I don't buy harbors."
        },
        {
          q: "Your thread is on the lamp cage.",
          a: "I inspect lamps. Of course my kit sheds thread. That is not a theft."
        }
      ],
      hugo: [
        {
          q: "What was in the case?",
          a: "A recorder. I was going to turn it in. Someone knew the lamp would stay on. That someone runs the test."
        },
        {
          q: "Did you drop it yourself?",
          a: "And swim? Look at me. No. I was in the office when the grid died. Door log says so."
        }
      ],
      wynn: [
        {
          q: "Describe the figure.",
          a: "Tall enough. Reflective at the cuffs. Moved like they knew the pier. I don't do coats. I do fish."
        },
        {
          q: "Did you climb down?",
          a: "Dry boots. Check them. I yelled. That's the job I gave myself."
        }
      ]
    },
    motives: [
      { id: "silence", label: "Stop a recorder from being turned in" },
      { id: "bribe", label: "Steal the bribe cash" },
      { id: "attention", label: "Wanted a witness story" }
    ],
    methods: [
      { id: "lamp-loop", label: "Kept the lamp on as a private sightline" },
      { id: "office", label: "Took it from the harbor office during the dark" },
      { id: "fisher", label: "Pulled it up in a net" }
    ]
  }
];

const state = {
  screen: "title",
  caseId: null,
  found: [],
  talked: {},
  notes: [],
  accusation: { who: "", motive: "", method: "" },
  solved: {}
};

function currentCase() {
  return CASES.find((c) => c.id === state.caseId);
}

function el(html) {
  document.getElementById("app").innerHTML = html;
  bind();
}

function bind() {
  document.querySelectorAll("[data-go]").forEach((node) => {
    node.addEventListener("click", () => {
      const go = node.dataset.go;
      if (go === "cases") state.screen = "cases";
      if (go === "title") state.screen = "title";
      if (go === "case") {
        state.caseId = node.dataset.id;
        state.found = [];
        state.talked = {};
        state.notes = [];
        state.accusation = { who: "", motive: "", method: "" };
        state.screen = "desk";
        state.tab = "brief";
      }
      if (go === "desk") state.screen = "desk";
      if (go === "clue") {
        const id = node.dataset.id;
        if (!state.found.includes(id)) state.found.push(id);
      }
      if (go === "ask") {
        const person = node.dataset.person;
        const idx = Number(node.dataset.idx);
        state.talked[person] = state.talked[person] || [];
        if (!state.talked[person].includes(idx)) state.talked[person].push(idx);
        state.lastAsk = { person, idx };
      }
      if (go === "accuse") state.screen = "accuse";
      if (go === "file") fileAccusation();
      render();
    });
  });
  document.querySelectorAll("[data-field]").forEach((node) => {
    node.addEventListener("change", () => {
      state.accusation[node.dataset.field] = node.value;
    });
  });
}

function fileAccusation() {
  const c = currentCase();
  const a = state.accusation;
  const ok = a.who === c.culprit && a.motive === c.motive && a.method === c.method;
  state.solved[c.id] = ok ? "closed" : "miss";
  state.lastResult = ok;
  state.screen = "result";
}

function render() {
  if (state.screen === "title") return title();
  if (state.screen === "cases") return cases();
  if (state.screen === "desk") return desk();
  if (state.screen === "accuse") return accuse();
  if (state.screen === "result") return result();
}

function title() {
  const closed = Object.values(state.solved).filter((v) => v === "closed").length;
  el(`
    <div class="shell">
      <div class="mast">
        <div>
          <div class="brand">Bureau of Unfinished Signals</div>
          <h1>Grok Detect</h1>
        </div>
        <div class="stat">${closed} / ${CASES.length} cases closed</div>
      </div>
      <p class="sub">A short detective desk. Read the brief, pull the clues, ask the questions that matter, then file who, why, and how. Guessing is allowed. Being right is better.</p>
      <div class="row" style="margin-top:22px">
        <button class="btn" data-go="cases">Open the case file</button>
      </div>
      <p class="footer-note">Three cases. No timer. Evidence does not lie. People do.</p>
    </div>
  `);
}

function cases() {
  const cards = CASES.map((c) => {
    const mark = state.solved[c.id] === "closed" ? "Closed" : state.solved[c.id] === "miss" ? "Reopened" : c.difficulty;
    return `
      <button class="card" data-go="case" data-id="${c.id}">
        <span class="tag">${mark}</span>
        <h3>${c.title}</h3>
        <p>${c.district}</p>
      </button>`;
  }).join("");
  el(`
    <div class="shell">
      <div class="mast">
        <div>
          <div class="brand">Grok Detect</div>
          <h1 style="font-size:42px">Case board</h1>
        </div>
        <button class="btn alt" data-go="title">Back</button>
      </div>
      <div class="grid">${cards}</div>
    </div>
  `);
}

function desk() {
  const c = currentCase();
  const tab = state.tab || "brief";
  const tabs = ["brief", "clues", "interviews", "board"]
    .map((t) => `<button data-go="tab" data-tab="${t}" class="${tab === t ? "on" : ""}">${t}</button>`)
    .join("");
  el(`
    <div class="shell">
      <div class="mast">
        <div>
          <div class="brand">${c.district}</div>
          <h1 style="font-size:42px">${c.title}</h1>
        </div>
        <div class="row">
          <button class="btn alt" data-go="cases">Cases</button>
          <button class="btn" data-go="accuse">File accusation</button>
        </div>
      </div>
      <div class="tabs">${tabs}</div>
      <div class="panel">${panel(c, tab)}</div>
    </div>
  `);
}

function panel(c, tab) {
  if (tab === "brief") {
    const people = c.suspects
      .map((s) => `<div class="person"><h4>${s.name}</h4><div class="muted">${s.role}. ${s.blurb}</div></div>`)
      .join("");
    return `<p class="dialogue">${c.brief}</p>${people}`;
  }
  if (tab === "clues") {
    return c.clues
      .map((clue) => {
        const open = state.found.includes(clue.id);
        return `
          <div class="clue">
            <h4>${clue.title}</h4>
            ${open ? `<div class="muted">${clue.text}</div>` : `<button class="btn alt" data-go="clue" data-id="${clue.id}">Examine</button>`}
          </div>`;
      })
      .join("");
  }
  if (tab === "interviews") {
    return c.suspects
      .map((s) => {
        const lines = c.interviews[s.id]
          .map((line, idx) => {
            const asked = (state.talked[s.id] || []).includes(idx);
            const show = state.lastAsk && state.lastAsk.person === s.id && state.lastAsk.idx === idx;
            return `
              <div class="clue">
                <button class="btn alt" data-go="ask" data-person="${s.id}" data-idx="${idx}">${line.q}</button>
                ${asked ? `<p class="muted">${s.name}: ${line.a}</p>` : ""}
              </div>`;
          })
          .join("");
        return `<h3>${s.name}</h3><div class="muted">${s.role}</div>${lines}`;
      })
      .join("");
  }
  const pins = state.found
    .map((id) => c.clues.find((clue) => clue.id === id))
    .filter(Boolean)
    .map((clue) => `<span class="pin">${clue.title}</span>`)
    .join("");
  const asks = Object.entries(state.talked)
    .map(([person, idxs]) => {
      const s = c.suspects.find((x) => x.id === person);
      return `<span class="pin">${s.name}: ${idxs.length} answers</span>`;
    })
    .join("");
  return `
    <p class="muted">Pin what you have. You can accuse with an empty board. You will just be wrong.</p>
    <div class="board">${pins || "<span class='muted'>No clues examined.</span>"}</div>
    <div class="board" style="margin-top:10px">${asks || ""}</div>`;
}

function accuse() {
  const c = currentCase();
  const who = c.suspects
    .map((s) => `<option value="${s.id}" ${state.accusation.who === s.id ? "selected" : ""}>${s.name}</option>`)
    .join("");
  const motive = c.motives
    .map((m) => `<option value="${m.id}" ${state.accusation.motive === m.id ? "selected" : ""}>${m.label}</option>`)
    .join("");
  const method = c.methods
    .map((m) => `<option value="${m.id}" ${state.accusation.method === m.id ? "selected" : ""}>${m.label}</option>`)
    .join("");
  el(`
    <div class="shell">
      <div class="mast">
        <div>
          <div class="brand">Accusation</div>
          <h1 style="font-size:42px">${c.title}</h1>
        </div>
        <button class="btn alt" data-go="desk">Back to desk</button>
      </div>
      <div class="panel">
        <label>Who</label>
        <select data-field="who"><option value="">Select</option>${who}</select>
        <label>Why</label>
        <select data-field="motive"><option value="">Select</option>${motive}</select>
        <label>How</label>
        <select data-field="method"><option value="">Select</option>${method}</select>
        <div class="row" style="margin-top:18px">
          <button class="btn" data-go="file">File it</button>
        </div>
      </div>
    </div>
  `);
}

function result() {
  const c = currentCase();
  const ok = state.lastResult;
  el(`
    <div class="shell">
      <div class="panel">
        <div class="brand">Bureau stamp</div>
        <h2 class="verdict ${ok ? "good" : "bad"}">${ok ? "Case closed." : "Wrong file."}</h2>
        <p class="dialogue">${
          ok
            ? "Who, why, and how line up. The board holds."
            : "One or more of who, why, and how is off. The city keeps the file open."
        }</p>
        <div class="row">
          <button class="btn" data-go="cases">Case board</button>
          <button class="btn alt" data-go="case" data-id="${c.id}">Reopen desk</button>
        </div>
      </div>
    </div>
  `);
}

render();
