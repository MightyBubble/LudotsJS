// 4X 世界仿真 —— 大战略原型舞台（探索/扩张/开发/征服 + 外交）。
// 世界只暴露"事实"：各阵营的感知由传感器（core/sensors.js）写入各自知识包；
// AI 绝不直接读世界 —— 读的是自己的 BB/Mem/WS/Belief（主客观分离）。
// SoA 意识：单位/城市用定长数组 + 空闲槽复用；每 tick 不创建临时数组（除 UI 快照）。

export const TERRAIN = { PLAIN: 0, FOREST: 1, HILL: 2, WATER: 3 };
export const MAP_W = 22, MAP_H = 14;

//  seeded RNG（可复现）
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 单位类型表（数据驱动；cost=生产力，upkeep=金/回合）
export const UNIT_TYPES = {
  settler:   { label: '定居者', glyph: '⛺', cost: 30, hp: 10, atk: 0, def: 1, sight: 2, speed: 1, role: 'expand' },
  worker:    { label: '工人',   glyph: '⚒', cost: 20, hp: 10, atk: 0, def: 1, sight: 2, speed: 1, role: 'develop' },
  warrior:   { label: '勇士',   glyph: '⚔', cost: 20, hp: 20, atk: 4, def: 3, sight: 2, speed: 1, role: 'army' },
  catapult:  { label: '投石车', glyph: '☄', cost: 40, hp: 15, atk: 8, def: 1, sight: 2, speed: 1, role: 'siege' },
  scout:     { label: '侦察兵', glyph: '👁', cost: 15, hp: 10, atk: 1, def: 1, sight: 4, speed: 2, role: 'recon' },
  spy:       { label: '间谍',   glyph: '🗡', cost: 30, hp: 10, atk: 0, def: 1, sight: 3, speed: 2, role: 'covert' },
  diplomat:  { label: '外交官', glyph: '🕊', cost: 30, hp: 10, atk: 0, def: 1, sight: 2, speed: 2, role: 'diplomat' },
  caravan:   { label: '商队',   glyph: '🐫', cost: 25, hp: 10, atk: 0, def: 1, sight: 2, speed: 2, role: 'trade' },
};

export const BUILDINGS = {
  farm:     { label: '农场', cost: 20, food: 2 },
  mine:     { label: '矿场', cost: 20, production: 2 },
  market:   { label: '市场', cost: 25, gold: 3 },
  barracks: { label: '兵营', cost: 30, production: 1 },
  walls:    { label: '城墙', cost: 35, defense: 6 },
};

const CAP_U = 96, CAP_C = 24;

export function createWorld(seed = 20260726) {
  const rng = mulberry32(seed);
  const terrain = new Uint8Array(MAP_W * MAP_H);
  // 南北两块大陆 + 中央海峡（"征服北方大陆"的舞台）
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    let t = TERRAIN.PLAIN;
    if (y >= 6 && y <= 7) t = TERRAIN.WATER;                    // 海峡
    else {
      const r = rng();
      if (r < 0.14) t = TERRAIN.FOREST;
      else if (r < 0.24) t = TERRAIN.HILL;
      if (x < 2 || x > MAP_W - 3) { if (rng() < 0.5) t = TERRAIN.WATER; } // 东西海岸
    }
    terrain[y * MAP_W + x] = t;
  }
  // 海峡留两个渡口
  for (const bx of [5, 16]) { terrain[6 * MAP_W + bx] = TERRAIN.PLAIN; terrain[7 * MAP_W + bx] = TERRAIN.PLAIN; }

  const w = {
    time: 0, turn: 0, rng,
    mapW: MAP_W, mapH: MAP_H, terrain,
    tileAt(x, y) { return (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) ? TERRAIN.WATER : terrain[y * MAP_W + x]; },
    passable(x, y) { return this.tileAt(x, y) !== TERRAIN.WATER; },

    // 单位（SoA）
    units: {
      alive: new Uint8Array(CAP_U), faction: new Int16Array(CAP_U), type: new Array(CAP_U).fill(''),
      x: new Int16Array(CAP_U), y: new Int16Array(CAP_U), hp: new Float32Array(CAP_U),
      fortified: new Uint8Array(CAP_U),
    },
    unitIds: new Array(CAP_U).fill(null), // 附加对象（角色状态等，低频）
    // 城市（SoA）
    cities: {
      alive: new Uint8Array(CAP_C), faction: new Int16Array(CAP_C), name: new Array(CAP_C).fill(''),
      x: new Int16Array(CAP_C), y: new Int16Array(CAP_C), size: new Float32Array(CAP_C),
      hp: new Float32Array(CAP_C), prod: new Float32Array(CAP_C), // 累积生产力
      queue: new Array(CAP_C).fill(null), buildings: new Array(CAP_C).fill(null),
      food: new Float32Array(CAP_C),
    },

    factions: [],       // [{ id, name, color, gold, alive }]
    events: [],         // { t, type, msg, faction } UI 事件流（ capped ）
    diplomacy: null,    // 由 brain 注入
    hits: new Map(),    // agentId -> [{by,at}] 受击传感器缓冲

    log(type, msg, faction = null) {
      this.events.push({ t: this.turn, type, msg, faction });
      if (this.events.length > 400) this.events.splice(0, this.events.length - 400);
    },

    spawnUnit(factionIdx, type, x, y) {
      for (let i = 0; i < CAP_U; i++) {
        if (this.units.alive[i]) continue;
        this.units.alive[i] = 1; this.units.faction[i] = factionIdx; this.units.type[i] = type;
        this.units.x[i] = x; this.units.y[i] = y; this.units.hp[i] = UNIT_TYPES[type].hp; this.units.fortified[i] = 0;
        this.unitIds[i] = { id: i, missions: 0 };
        return i;
      }
      return -1;
    },
    killUnit(i) { this.units.alive[i] = 0; },
    foundCity(factionIdx, name, x, y) {
      for (let i = 0; i < CAP_C; i++) {
        if (this.cities.alive[i]) continue;
        const c = this.cities;
        c.alive[i] = 1; c.faction[i] = factionIdx; c.name[i] = name; c.x[i] = x; c.y[i] = y;
        c.size[i] = 1; c.hp[i] = 20; c.prod[i] = 0; c.food[i] = 0; c.queue[i] = []; c.buildings[i] = [];
        this.log('city', `${this.factions[factionIdx].name} 建立城市 ${name}`, this.factions[factionIdx].id);
        return i;
      }
      return -1;
    },
    captureCity(i, newFaction) {
      const old = this.cities.faction[i];
      this.cities.faction[i] = newFaction;
      this.cities.hp[i] = 20;
      this.cities.queue[i] = [];
      this.log('war', `${this.factions[newFaction].name} 攻占了 ${this.cities.name[i]}！`, this.factions[newFaction].id);
      this.log('war', `${this.factions[old].name} 失去了 ${this.cities.name[i]}`, this.factions[old].id);
    },

    // 城市回合：产出（食物/生产力/金）→ 增长/建造
    cityTurn(i) {
      const c = this.cities;
      if (!c.alive[i]) return;
      const f = this.factions[c.faction[i]];
      let food = 2, prod = 1, gold = 1;
      const t = this.tileAt(c.x[i], c.y[i]);
      if (t === TERRAIN.HILL) prod += 1;
      if (t === TERRAIN.FOREST) prod += 1;
      for (const b of c.buildings[i]) {
        const bd = BUILDINGS[b];
        food += bd.food || 0; prod += bd.production || 0; gold += bd.gold || 0;
      }
      const mult = 1 + Math.min(2, (c.size[i] - 1) * 0.5);
      c.food[i] += food * mult;
      c.prod[i] += prod * mult;
      f.gold += gold * mult;
      // 增长
      const need = 8 + c.size[i] * 6;
      if (c.food[i] >= need && c.size[i] < 8) {
        c.food[i] = 0; c.size[i] += 1;
        this.log('econ', `${f.name} 的 ${c.name[i]} 人口增长到 ${c.size[i]}`, f.id);
      }
      // 建造
      const q = c.queue[i];
      if (q.length) {
        const item = q[0];
        const cost = UNIT_TYPES[item]?.cost ?? BUILDINGS[item]?.cost ?? 20;
        if (c.prod[i] >= cost) {
          c.prod[i] -= cost;
          q.shift();
          if (UNIT_TYPES[item]) {
            const u = this.spawnUnit(c.faction[i], item, c.x[i], c.y[i]);
            if (u >= 0) this.log('econ', `${f.name} 的 ${c.name[i]} 训练出 ${UNIT_TYPES[item].label}`, f.id);
          } else {
            c.buildings[i].push(item);
            this.log('econ', `${f.name} 的 ${c.name[i]} 建成 ${BUILDINGS[item].label}`, f.id);
          }
        }
      }
    },

    // 视野：faction 可见集合（城市/单位 sight 半径）
    computeVisible(factionIdx) {
      const vis = new Set();
      const see = (x, y, r) => {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= r) vis.add((y + dy) * MAP_W + (x + dx));
        }
      };
      for (let i = 0; i < CAP_C; i++) if (this.cities.alive[i] && this.cities.faction[i] === factionIdx) see(this.cities.x[i], this.cities.y[i], 3);
      for (let i = 0; i < CAP_U; i++) if (this.units.alive[i] && this.units.faction[i] === factionIdx) see(this.units.x[i], this.units.y[i], UNIT_TYPES[this.units.type[i]].sight);
      return vis;
    },

    // 某阵营感知到的敌对世界快照（供传感器写 BB）
    perceiveFor(factionIdx) {
      const vis = this.computeVisible(factionIdx);
      const out = [];
      for (let i = 0; i < CAP_U; i++) {
        if (!this.units.alive[i] || this.units.faction[i] === factionIdx) continue;
        const key = this.units.y[i] * MAP_W + this.units.x[i];
        if (vis.has(key)) out.push({ kind: 'unit', id: i, faction: this.units.faction[i], type: this.units.type[i], x: this.units.x[i], y: this.units.y[i], hp: this.units.hp[i] });
      }
      for (let i = 0; i < CAP_C; i++) {
        if (!this.cities.alive[i] || this.cities.faction[i] === factionIdx) continue;
        const key = this.cities.y[i] * MAP_W + this.cities.x[i];
        if (vis.has(key)) out.push({ kind: 'city', id: i, faction: this.cities.faction[i], name: this.cities.name[i], x: this.cities.x[i], y: this.cities.y[i], size: this.cities.size[i], hp: this.cities.hp[i], walls: (this.cities.buildings[i] || []).includes('walls') });
      }
      return out;
    },

    dist(ax, ay, bx, by) { return Math.abs(ax - bx) + Math.abs(ay - by); },

    // 战斗：攻击者 → 相邻目标（单位或城市）
    attack(attackerIdx, targetKind, targetId) {
      const u = this.units;
      const atkType = UNIT_TYPES[u.type[attackerIdx]];
      const f = this.factions[u.faction[attackerIdx]];
      if (targetKind === 'unit') {
        const defType = UNIT_TYPES[u.type[targetId]];
        const dmg = Math.max(1, atkType.atk - defType.def * (u.fortified[targetId] ? 2 : 1) * 0.5 + this.rng() * 2);
        u.hp[targetId] -= dmg;
        this.hits.set(`u${targetId}`, [...(this.hits.get(`u${targetId}`) || []), { by: attackerIdx, at: this.time }]);
        if (u.hp[targetId] <= 0) {
          this.log('war', `${f.name} 的${atkType.label}歼灭了 ${this.factions[u.faction[targetId]].name} 的${defType.label}`, f.id);
          this.killUnit(targetId);
        }
        return true;
      }
      // 攻城
      const c = this.cities;
      const def = (c.buildings[targetId] || []).includes('walls') ? 0.4 : 1;
      const dmg = Math.max(1, (atkType.atk + (u.type[attackerIdx] === 'catapult' ? 4 : 0)) * def + this.rng() * 2);
      c.hp[targetId] -= dmg;
      if (c.hp[targetId] <= 0) this.captureCity(targetId, u.faction[attackerIdx]);
      return true;
    },

    recordHit(agentKey, hit) {
      this.hits.set(agentKey, [...(this.hits.get(agentKey) || []), hit]);
    },
    drainHits(agent) {
      const h = this.hits.get(agent.key) || [];
      this.hits.set(agent.key, []);
      return h;
    },

    tickTurn() {
      this.turn++;
      this.time += 1;
      for (let i = 0; i < CAP_C; i++) this.cityTurn(i);
      for (const f of this.factions) f.gold = Math.max(0, f.gold - 0.2); //  upkeep 简化
    },
  };
  return w;
}
