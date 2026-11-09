// Field Trips DLC: trip data. Each trip = walkable destination, NPC guide, discovery stops (facts), a short lesson (slides) and a themed quiz mini-game.
// Facts are real, kid-friendly science. Answers: index 0 is right (shuffled at play time).
export const TRIPS = [
  { id: 'desert', icon: '🌵', name: 'Desert Nature Walk', where: "Torty Town · Martina's Desert Habitat", guide: 'torty', guideName: 'Torty (Martina)', color: '#d97706', ready: true,
    blurb: "Hike Torty's desert trail, peek in a real tortoise burrow and learn how desert life beats the heat.",
    hello: "Welcome to my habitat, class! I'm Martina, but everyone calls me Torty. Walk slow, look close. Find the 5 glowing trail signs!",
    stops: [
      ['🌵 Giant Saguaro', 'A saguaro cactus stores water in its pleated stem. The pleats stretch like an accordion after it rains!'],
      ['🕳️ Tortoise Burrow', 'Desert tortoises dig burrows to hide from the heat and the cold. They spend most of their lives underground.'],
      ['🌸 Wildflowers', 'Desert wildflower seeds can wait in the ground for years, then bloom all at once after a good rain.'],
      ['🥬 Torty\'s Lunch Patch', 'Desert tortoises get most of their water from the plants they eat, like grasses and cactus pads.'],
      ['🚫🖐️ Ranger Rule', 'If you see a wild tortoise, leave it alone! Picking one up can scare it into losing the water it saved.'],
    ],
    slides: [
      ['What is a desert?', 'A desert is a place that gets very little rain, usually less than 10 inches (25 cm) a year.'],
      ['Beating the heat', 'Desert animals hide in burrows and shade in the hot day and come out when it is cooler.'],
      ['Saving water', 'Cactuses store water in their stems. Tortoises store water in their bodies and get it from food.'],
    ],
    quiz: [
      ['Where do desert tortoises hide from the hot sun?', ['In burrows underground', 'In treetops', 'In ponds']],
      ['Where do desert tortoises get most of their water?', ['From the plants they eat', 'From rivers', 'From snow']],
      ['A desert usually gets less than about how much rain a year?', ['10 inches (25 cm)', '10 feet (3 m)', '100 inches']],
      ['You see a wild tortoise on the trail. What do you do?', ['Leave it alone', 'Pick it up', 'Feed it pizza']],
      ['Where does a saguaro cactus store water?', ['In its stem', 'In its spines', 'In its flowers']],
    ],
    game: { name: "Torty's Shade Dash", good: 'Torty reached the shade! 🌸', bad: 'Ouch, sunburn! −1 💧', life: '💧' } },
  { id: 'lab', icon: '🧪', name: 'Ratita Science Lab Tour', where: 'Ratita Industries · Science Wing', guide: 'luna', guideName: 'Luna & Snowie', color: '#2563eb', ready: true,
    blurb: 'Goggles on! Tour the Ratita Industries lab with Luna and Snowie and learn how scientists work.',
    hello: "Welcome to the Ratita Industries Science Wing! I'm Luna, the boss. Snowie runs the rocket bay. Goggles first, then find the 5 glowing lab stations!",
    stops: [
      ['🥽 Safety Station', 'Real scientists always put on safety goggles before an experiment, and they never taste anything in a lab.'],
      ['🔬 Microscope', 'A microscope makes tiny things look big. It helps us see cells, the tiny building blocks of living things.'],
      ['🧊 Matter Tank', 'Matter comes in states: solid ice, liquid water and gas steam. Heating ice melts it; heating water turns it to steam.'],
      ['🌱 Plant Lab', 'Plants make their own food from sunlight, water and air. This is called photosynthesis.'],
      ['🚀 Rocket Bay', 'A rocket pushes hot gas down, and the gas pushes the rocket up. For every action there is an equal and opposite reaction.'],
    ],
    slides: [
      ['The scientific method', 'Ask a question, make a guess (hypothesis), test it, look at the results, then share what you learned.'],
      ['Lab safety', 'Goggles on, hair tied back, listen to the grown-up scientist, and clean up when you are done.'],
      ['Matter and energy', 'Heat can change matter: solid to liquid to gas. Light from the sun gives plants energy to grow.'],
    ],
    quiz: [
      ['What do you put on before an experiment?', ['Safety goggles', 'A party hat', 'Oven mitts on your feet']],
      ['Water turning into steam changes from a liquid to a...', ['Gas', 'Solid', 'Cheese']],
      ['What does a microscope help you see?', ['Tiny things like cells', 'Faraway planets', 'Through walls']],
      ['Plants making food from sunlight is called...', ['Photosynthesis', 'Hibernation', 'Evaporation']],
      ['What is the first step of the scientific method?', ['Ask a question', 'Write the answer', 'Clean up']],
    ],
    game: { name: 'Beaker Blast', good: 'Perfect mix! Rocket launched 🚀', bad: 'Goo explosion! −1 🧪', life: '🧪' } },
  { id: 'airport', icon: '✈️', name: 'Airport Geography Trip', where: 'Ratita Airways · Grok Airport', guide: 'snowie', guideName: 'Snowie', color: '#0891b2', ready: false, blurb: 'Map skills, continents and how planes find their way. Coming next!' },
  { id: 'farm', icon: '🚜', name: 'Harvest Hollow Farm Trip', where: "Torty's Farm · Harvest Hollow", guide: 'torty', guideName: 'Torty', color: '#65a30d', ready: false, blurb: 'Where food comes from: seeds, soil, harvest and the farm animals. Coming next!' },
  { id: 'puptown', icon: '🚒', name: 'Pup Town Community Helpers', where: 'Pup Town · Fire Station & Park', guide: 'candy', guideName: 'Candy', color: '#dc2626', ready: false, blurb: 'Meet the firefighters, librarians and park rangers who keep Pup Town safe. Coming next!' },
];
export const tripById = (id) => TRIPS.find((t) => t.id === id);
