'use strict';

const RELEASE_AT = Date.UTC(2026, 10, 19, 5, 0, 0);
const CAMPAIGN_START = Date.UTC(2026, 7, 24, 12, 0, 0);
const TARGET = 1000000;

const spots = {
  command: { x: 500, y: 330, label: 'SAFEHOUSE', type: 'desk' },
  garage: { x: 165, y: 670, label: 'SUNSET GARAGE', type: 'desk' },
  marina: { x: 825, y: 665, label: 'NEON MARINA', type: 'desk' },
  arcade: { x: 240, y: 205, label: 'PIXEL ARCADE', type: 'desk' },
  club: { x: 760, y: 205, label: 'BAYFRONT CLUB', type: 'desk' },
  port: { x: 865, y: 420, label: 'PORT', type: 'desk' },
  downtown: { x: 360, y: 505, label: 'DOWNTOWN', type: 'street' },
  beach: { x: 635, y: 735, label: 'OCEAN DRIVE', type: 'street' },
  tower: { x: 500, y: 120, label: 'DATA TOWER', type: 'desk' },
  plaza: { x: 640, y: 455, label: 'CENTRAL PLAZA', type: 'talk' },
  junction: { x: 465, y: 555, label: 'JUNCTION', type: 'talk' }
};

const agents = [
  {
    id: 'helm', name: 'HELM', role: 'BOSS', color: '#ff4f7b', offset: 0,
    route: ['command', 'plaza', 'club', 'command', 'junction'],
    thoughts: ['routing the next move', 'checking the empire ledger', 'assigning mission owners', 'reading every signal']
  },
  {
    id: 'scout', name: 'SCOUT', role: 'OPPORTUNITIES', color: '#ffd447', offset: 11000,
    route: ['arcade', 'downtown', 'marina', 'plaza', 'tower'],
    thoughts: ['mapping a new opportunity', 'watching city demand', 'pricing the next acquisition', 'tracking an opening']
  },
  {
    id: 'driver', name: 'DRIVER', role: 'LOGISTICS', color: '#60ddff', offset: 23000,
    route: ['garage', 'junction', 'port', 'beach', 'garage'],
    thoughts: ['optimizing the route', 'moving resources downtown', 'clearing the delivery lane', 'recalculating arrival time']
  },
  {
    id: 'cipher', name: 'CIPHER', role: 'SYSTEMS', color: '#a980ff', offset: 37000,
    route: ['tower', 'arcade', 'command', 'plaza', 'tower'],
    thoughts: ['parsing city signals', 'unlocking a data lead', 'checking the digital perimeter', 'linking public records']
  },
  {
    id: 'forge', name: 'FORGE', role: 'BUILDER', color: '#65e581', offset: 52000,
    route: ['garage', 'command', 'club', 'marina', 'downtown'],
    thoughts: ['upgrading the operation', 'turning a lead into revenue', 'building the next asset', 'repairing the cashflow']
  },
  {
    id: 'sentinel', name: 'SENTINEL', role: 'RISK', color: '#ff8d45', offset: 69000,
    route: ['port', 'tower', 'junction', 'command', 'beach'],
    thoughts: ['checking exposure', 'lowering the heat level', 'auditing the escape plan', 'rejecting a weak move']
  }
];

const missions = [
  {
    title: 'NEON MARINA ACQUISITION',
    objective: 'Turn the marina lease into a recurring cashflow asset.',
    district: 'VICE BAY', reward: 18400,
    stages: ['SCOUTING OWNERS', 'VERIFYING LEDGER', 'ROUTING NEGOTIATION', 'SECURING ASSET']
  },
  {
    title: 'DOWNTOWN COURIER RECOVERY',
    objective: 'Recover the lost shipment before the night window closes.',
    district: 'DOWNTOWN', reward: 7600,
    stages: ['READING TRAFFIC', 'LOCATING VEHICLE', 'CLEARING ROUTE', 'DELIVERING CARGO']
  },
  {
    title: 'BAYFRONT CLUB TAKEOVER',
    objective: 'Reprice the venue, fix operations and reopen tonight.',
    district: 'BAYFRONT', reward: 32900,
    stages: ['CHECKING DEMAND', 'MODELING MARGIN', 'BUILDING OFFER', 'CLOSING DEAL']
  },
  {
    title: 'PORT LOGISTICS REROUTE',
    objective: 'Move high-value inventory through the fastest legal corridor.',
    district: 'SOUTH PORT', reward: 12800,
    stages: ['SCANNING PORT', 'MATCHING WINDOWS', 'RISK REVIEW', 'ROUTE ACTIVE']
  },
  {
    title: 'LUXURY AUCTION INTELLIGENCE',
    objective: 'Find the underpriced lot and prepare the winning ceiling.',
    district: 'OCEAN DRIVE', reward: 24100,
    stages: ['READING CATALOG', 'TRACING OWNERSHIP', 'PRICING EDGE', 'BID READY']
  },
  {
    title: 'DATA VAULT RETRIEVAL',
    objective: 'Recover the archive and return it to the shared safehouse.',
    district: 'TECH ISLAND', reward: 15800,
    stages: ['MAPPING ACCESS', 'VERIFYING SOURCE', 'PACKET TRANSFER', 'ARCHIVE SECURED']
  }
];

const businessNames = [
  ['Sunset Garage', 'AUTO', 72000],
  ['Neon Marina', 'MARINE', 118000],
  ['Pixel Arcade', 'ENTERTAINMENT', 54000],
  ['Bayfront Club', 'NIGHTLIFE', 145000],
  ['Courier Depot', 'LOGISTICS', 83000],
  ['Ocean Drive Rentals', 'MOBILITY', 96000],
  ['Port Warehouse', 'STORAGE', 132000],
  ['Night Radio', 'MEDIA', 68000],
  ['Auto Customs', 'WORKSHOP', 89000]
];

const feedTemplates = [
  ['SCOUT', 'found an underpriced city asset and routed the evidence to HELM.'],
  ['HELM', 'split the operation across intelligence, logistics and risk.'],
  ['CIPHER', 'linked a fresh public signal to the active mission.'],
  ['DRIVER', 'cut the route time and moved the delivery window forward.'],
  ['SENTINEL', 'rejected one route and cleared the lower-risk alternative.'],
  ['FORGE', 'converted the approved plan into a new revenue stream.'],
  ['HELM', 'closed the mission and deployed cash into the next district.'],
  ['SCOUT', 'opened a new lead near Ocean Drive.'],
  ['CIPHER', 'updated the shared ledger with verified context.'],
  ['FORGE', 'finished an upgrade at Sunset Garage.']
];

function hash(value) {
  let h = 2166136261;
  const input = String(value);
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function noise(seed, step) {
  return hash(seed + ':' + step) * 2 - 1;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildMotionPlan(agent, now) {
  const plan = [];
  const cycle = 22000 + Math.floor(hash(agent.id) * 8000);
  const baseIndex = Math.floor((now + agent.offset) / cycle);
  let fromName = agent.route[((baseIndex - 1) % agent.route.length + agent.route.length) % agent.route.length];

  for (let index = baseIndex; index < baseIndex + 5; index += 1) {
    const routeIndex = ((index % agent.route.length) + agent.route.length) % agent.route.length;
    const destinationName = agent.route[routeIndex];
    const from = spots[fromName];
    const destination = spots[destinationName];
    const startsAt = index * cycle - agent.offset;
    const moveShare = 0.28 + hash(agent.id + index) * 0.2;
    const movesUntil = startsAt + cycle * moveShare;
    plan.push({
      startsAt,
      movesUntil,
      endsAt: startsAt + cycle,
      fromX: from.x,
      fromY: from.y,
      toX: destination.x,
      toY: destination.y,
      destination: destination.label,
      destinationType: destination.type
    });
    fromName = destinationName;
  }

  return plan;
}

function agentState(agent, now) {
  const plan = buildMotionPlan(agent, now);
  const current = plan.find((part) => now >= part.startsAt && now < part.endsAt) || plan[0];
  const moving = now < current.movesUntil;
  const progress = moving
    ? clamp((now - current.startsAt) / Math.max(1, current.movesUntil - current.startsAt), 0, 1)
    : 1;
  const eased = progress * progress * (3 - 2 * progress);

  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    color: agent.color,
    x: current.fromX + (current.toX - current.fromX) * eased,
    y: current.fromY + (current.toY - current.fromY) * eased,
    moving,
    zone: current.destination,
    thought: agent.thoughts[Math.floor((now + agent.offset) / 9000) % agent.thoughts.length],
    motionPlan: plan
  };
}

function empireState(now) {
  const totalWindow = Math.max(1, RELEASE_AT - CAMPAIGN_START);
  const progress = clamp((now - CAMPAIGN_START) / totalWindow, 0, 1);
  const growth = Math.pow(progress, 0.86);
  const wave = Math.sin(now / 170000) * 9200 + Math.sin(now / 43000) * 2400;
  const value = Math.round(clamp(42000 + growth * 958000 + wave, 42000, TARGET));
  const exposure = Math.round(value * (0.41 + 0.08 * Math.sin(now / 80000)));
  const cash = Math.round(clamp(value - exposure, 12000, value));
  const daily = Math.round(1800 + progress * 15800 + Math.sin(now / 36000) * 3100);
  return { value, cash, exposure, daily, target: TARGET, progress: value / TARGET };
}

function pnlHistory(now, current) {
  const points = [];
  const stepNow = Math.floor(now / 5000);
  let value = current - 34 * 380;
  for (let index = 0; index < 35; index += 1) {
    value += 380 + noise('pnl', stepNow - 34 + index) * 920;
    points.push(Math.round(value));
  }
  const delta = current - points[points.length - 1];
  return points.map((point, index) => Math.round(point + delta * (index / (points.length - 1))));
}

function missionState(now) {
  const missionWindow = 74000;
  const cycle = Math.floor(now / missionWindow);
  const mission = missions[cycle % missions.length];
  const local = now % missionWindow;
  const progress = Math.round((local / missionWindow) * 100);
  const stageIndex = Math.min(mission.stages.length - 1, Math.floor(progress / (100 / mission.stages.length)));
  return { ...mission, id: 'GTA-' + String(cycle % 10000).padStart(4, '0'), progress, stage: mission.stages[stageIndex] };
}

function buildBusinesses(empire, now) {
  const unlocked = clamp(Math.floor(empire.progress * businessNames.length) + 1, 1, businessNames.length);
  return businessNames.map(([name, type, value], index) => ({
    id: 'business-' + index,
    name,
    type,
    value,
    active: index < unlocked,
    income: index < unlocked ? Math.round(value * (0.006 + hash(name) * 0.008)) : 0,
    pulse: Math.floor(now / 3600 + index) % 9 === 0
  }));
}

function handoffState(now, currentAgents) {
  const windowMs = 6800;
  const pairIndex = Math.floor(now / windowMs);
  const pairs = [
    ['scout', 'helm', 'opportunity packet'],
    ['helm', 'cipher', 'context request'],
    ['cipher', 'sentinel', 'verified evidence'],
    ['sentinel', 'driver', 'safe route'],
    ['driver', 'forge', 'delivery window'],
    ['forge', 'helm', 'revenue receipt'],
    ['helm', 'scout', 'next district']
  ];
  const local = now % windowMs;
  if (local > 4100) return [];
  const count = local < 1500 ? 2 : 1;
  return Array.from({ length: count }, (_, offset) => {
    const pair = pairs[(pairIndex + offset * 3) % pairs.length];
    const from = currentAgents.find((agent) => agent.id === pair[0]);
    const to = currentAgents.find((agent) => agent.id === pair[1]);
    return { id: pairIndex + '-' + offset, from: from.id, to: to.id, label: pair[2], color: from.color, expiresAt: now + (4100 - local) };
  });
}

function feedState(now) {
  const step = Math.floor(now / 6500);
  return Array.from({ length: 7 }, (_, index) => {
    const item = feedTemplates[((step - index) % feedTemplates.length + feedTemplates.length) % feedTemplates.length];
    return {
      id: step - index,
      agent: item[0],
      message: item[1],
      time: new Date((step - index) * 6500).toISOString()
    };
  });
}

function getState(now = Date.now()) {
  const empire = empireState(now);
  const currentAgents = agents.map((agent) => agentState(agent, now));
  const remainingMs = Math.max(0, RELEASE_AT - now);
  const wanted = 1 + Math.floor((Math.sin(now / 52000) + 1) * 1.45);

  return {
    generatedAt: now,
    release: {
      at: RELEASE_AT,
      remainingMs,
      days: Math.floor(remainingMs / 86400000),
      title: 'GTA VI RELEASE'
    },
    empire,
    pnl: { current: empire.daily, history: pnlHistory(now, empire.daily) },
    wanted,
    mission: missionState(now),
    agents: currentAgents,
    businesses: buildBusinesses(empire, now),
    handoffs: handoffState(now, currentAgents),
    feed: feedState(now),
    stats: {
      missions: 318 + Math.floor((now - CAMPAIGN_START) / 74000),
      decisions: 8421 + Math.floor((now - CAMPAIGN_START) / 4900),
      districts: 7
    }
  };
}

module.exports = { getState };

