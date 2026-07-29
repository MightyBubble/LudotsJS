// 知识层 —— 主客观分离（分层决策的基石）。
//
//  客观层（本文件）                主观层（belief.js）
//  ┌──────────────────────────┐   ┌──────────────────────────┐
//  │ Blackboard 引用/快照     │ → │ Belief 映射曲线求值       │
//  │ （感知快照、目标引用、    │   │ （威胁度/信心/紧迫感…     │
//  │  位置——可验证的世界数据） │   │  0..1 主观标量）          │
//  ├──────────────────────────┤   └──────────────────────────┘
//  │ Mem 事件记录（发生过什么）│
//  ├──────────────────────────┤
//  │ WorldState 纯位开关       │ ← GOAP/HTN 规划器的事实词汇
//  └──────────────────────────┘
//
// BB 管"引用与快照"（客观数据，谁都能验证）；Mem 管"记录"（带时间戳的事件流水）；
// WorldState 用纯 bit 记录 bool 开关（规划器前件/效果直接位运算，0GC）；
// 黑板 → 主观认识的映射曲线在 belief.js（归一化 × 响应曲线，参考 Utility 项目的语义）。

// ── WorldState：命名位注册表 + 位组（每 agent 一个 Uint32 视图） ──
export function createBitRegistry(names = []) {
  const index = new Map();
  const list = [];
  for (const n of names) define(n);
  function define(name) {
    if (index.has(name)) return index.get(name);
    if (list.length >= 32) throw new Error('WorldState 位超出 32 位上限（可分组扩展）');
    index.set(name, list.length);
    list.push(name);
    return list.length - 1;
  }
  return { index, list, define, mask: (name) => 1 << index.get(name) };
}

export function createWorldState(registry) {
  return {
    reg: registry,
    bits: 0,
    get(name) { const i = this.reg.index.get(name); return i === undefined ? false : (this.bits & (1 << i)) !== 0; },
    set(name, v = true) {
      const i = this.reg.index.get(name);
      if (i === undefined) throw new Error(`未知 WorldState 位: ${name}`);
      this.bits = v ? (this.bits | (1 << i)) : (this.bits & ~(1 << i));
    },
    // 规划器热路径：纯整数运算
    satisfies(pre) { // pre: [{bit, val}]
      for (let k = 0; k < pre.length; k++) {
        const i = this.reg.index.get(pre[k].bit);
        const has = i !== undefined && (this.bits & (1 << i)) !== 0;
        if (has !== (pre[k].val !== false)) return false;
      }
      return true;
    },
    applyEffects(eff, bits) { // 在拷贝整数上应用效果，返回新整数（规划器用）
      let b = bits;
      for (let k = 0; k < eff.length; k++) {
        const i = this.reg.index.get(eff[k].bit);
        if (i === undefined) continue;
        b = eff[k].val === false ? (b & ~(1 << i)) : (b | (1 << i));
      }
      return b;
    },
    goalMask(goal) { // goal: [{bit,val}] → {mask, expect}
      let mask = 0, expect = 0;
      for (let k = 0; k < goal.length; k++) {
        const i = this.reg.index.get(goal[k].bit);
        if (i === undefined) continue;
        mask |= (1 << i);
        if (goal[k].val !== false) expect |= (1 << i);
      }
      return { mask, expect };
    },
    snapshot() { return { ...Object.fromEntries(this.reg.list.map((n, i) => [n, (this.bits & (1 << i)) !== 0])) }; },
  };
}

// ── Mem：事件记录（环形缓冲，容量固定，0GC；带 TTL 查询） ──
export function createMem(cap = 128) {
  const buf = new Array(cap);
  let head = 0, size = 0;
  return {
    cap,
    add(type, data, at) {
      buf[head] = { type, data, at: at ?? MemClock.time };
      head = (head + 1) % cap;
      if (size < cap) size++;
    },
    count(type, within = Infinity, now = MemClock.time) {
      let c = 0;
      for (let i = 0; i < size; i++) {
        const r = buf[i];
        if (r.type === type && now - r.at <= within) c++;
      }
      return c;
    },
    last(type) {
      for (let i = 1; i <= size; i++) {
        const r = buf[(head - i + cap) % cap];
        if (r.type === type) return r;
      }
      return null;
    },
    recent(n = 10) {
      const out = [];
      for (let i = 1; i <= Math.min(n, size); i++) out.push(buf[(head - i + cap) % cap]);
      return out;
    },
    clear() { head = 0; size = 0; },
  };
}
// Mem 的默认时钟（世界 tick 时注入）
export const MemClock = { time: 0 };

// ── Blackboard：键 → 客观值（引用/快照）。键带类型声明，读写不装箱。 ──
export function createBlackboard(schema = {}) {
  const data = Object.create(null);
  return {
    schema,
    get(key) { return data[key]; },
    set(key, v) { data[key] = v; },
    has(key) { return data[key] !== undefined; },
    delete(key) { delete data[key]; },
    keys() { return Object.keys(data); },
    snapshot() { return { ...data }; },
    _data: data,
  };
}

// ── Agent 知识包：BB + Mem + WS 三件套（传感器写入、决策读取的唯一入口） ──
// registry 可共享（阵营内所有 agent 用同一份位词汇表；ws 实例各自独立或显式共享）
export function createKnowledge({ bits, registry, bbSchema, memCap, shareWs } = {}) {
  const reg = registry || createBitRegistry(bits || []);
  return {
    bb: createBlackboard(bbSchema),
    mem: createMem(memCap || 128),
    ws: shareWs || createWorldState(reg),
    bitRegistry: reg,
  };
}
