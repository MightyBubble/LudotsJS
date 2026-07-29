// HFSM —— 真·层级有限状态机核（纯数据驱动，JSON 配置即全部语义）。
//
// 语义对齐 SCXML / UE StateTree 子集：
//   · 状态可嵌套：state.states = { 子key: 子状态 }，state.initial 声明初始子状态；
//   · 进入复合态 = 沿 initial 链下沉到叶（hfsmLeafOf）；
//   · 转移继承 / 冒泡：出边从当前叶逐级向祖先查找，首条命中即转移（stanceEvent）；
//     定义在复合态上的转移天然被全部后代继承；
//   · 配置继承：子状态未声明的 autocast / chase / leash / behavior 沿祖先链继承；
//   · 行为 = 图：叶状态的 behavior 指向 GraphVM 图（模板/GraphDef），缺省由配置推导生成。
//
// 扁平 key = 层级路径（'Paladin.Field'）：全局唯一、可读、可直接做黑板/事件词汇。
// 扁平机（无嵌套）是层级机的 depth-1 特例 —— 路径即 key，三种方言统一规整：
//   A. 经典：state.{autocast, chase, leash, transitions:[{on,to}]}
//   B. 扩展：state.utility:{autocast,chase,leash} + machine.transitions:[{from,to,event,within}]
//   C. 层级：state.states + state.initial + state.behavior/behaviorInputs（本文件新增）

// 状态 key 解析：精确匹配优先；否则按末节名唯一匹配（'Field' → 'Paladin.Field'）
export function resolveStateKey(machine, key) {
  if (!key || !machine?.states) return null;
  if (machine.states[key]) return key;
  const tail = `.${key}`;
  let hit = null;
  for (const p of Object.keys(machine.states)) {
    if (p.endsWith(tail)) { if (hit) return hit; hit = p; } // 歧义取首个（确定性）
  }
  return hit;
}

// 旧数组方言（FsmEditor 早期：states:[{id,name,x,y,is_initial,action_id}],
// transitions:[{id,from,to,condition_ids}]）→ HFSM map 方言。
// resolveName(id) 把 TaskNode 实体 id 解析为模板/图名（action/condition 引用）。
// 多条件 AND → conditions:[...]（fsm 运行时支持）；姿态内容块不存在于旧方言，无需转换。
export function legacyToHfsm(data, resolveName = () => null) {
  if (!data || !Array.isArray(data.states)) return data?.states ? data : { initial: null, states: {}, transitions: [] };
  const idToKey = {};
  const states = {};
  for (const s of data.states) {
    let base = String(s.name || s.id || 'State').replace(/[^\w一-龥]+/g, '_') || 'State';
    let key = base, i = 2;
    while (states[key]) key = `${base}_${i++}`;
    idToKey[s.id] = key;
    const st = { label: s.name || key, color: '#94a3b8', x: s.x || 0, y: s.y || 0 };
    const act = s.action_id ? resolveName(s.action_id) : null;
    if (act) st.action = act;
    states[key] = st;
  }
  const initS = data.states.find((s) => s.is_initial) || data.states[0];
  const transitions = (data.transitions || []).map((t) => {
    const conds = (t.condition_ids || []).map((cid) => resolveName(cid)).filter(Boolean);
    const out = { from: idToKey[t.from], to: idToKey[t.to] };
    if (conds.length === 1) out.condition = conds[0];
    else if (conds.length > 1) out.conditions = conds;
    return out;
  }).filter((t) => t.from && t.to);
  return { initial: idToKey[initS?.id] || Object.keys(states)[0] || null, states, transitions };
}

// 进入：复合态沿 initial 链下沉到叶（直接赋值复合态/根 key 也兼容）
export function hfsmLeafOf(machine, key) {
  let p = resolveStateKey(machine, key) || key;
  for (let guard = 0; guard < 16; guard++) {
    const st = machine.states[p];
    if (!st) return key; // 未知 key：原样返回（调用方兜底）
    if (st.isLeaf) return p;
    p = st.initial && machine.states[`${p}.${st.initial}`] ? `${p}.${st.initial}` : st.children[0];
    if (!p) return key;
  }
  return p;
}

// 转移冒泡：从当前叶逐级向祖先查 transitions（{on:event, to}），首命中返回目标叶路径。
// 机级 transitions 已在规整期折叠进 from 状态（from=复合态 ⇒ 全部后代经冒泡继承）。
export function hfsmEvent(machine, current, event) {
  let p = resolveStateKey(machine, current) || current;
  for (let guard = 0; p && guard < 16; guard++) {
    const st = machine.states[p];
    if (!st) break;
    const t = (st.transitions || []).find((x) => x.on === event);
    if (t) {
      const to = resolveStateKey(machine, t.to);
      if (to) return { to: hfsmLeafOf(machine, to), from: p, via: st };
    }
    p = st.parent;
  }
  return null;
}

// 祖先链（含自身，叶→根序）—— 调试/编辑 UI 用
export function hfsmPath(machine, key) {
  const out = [];
  let p = resolveStateKey(machine, key) || key;
  for (let guard = 0; p && guard < 16; guard++) {
    const st = machine.states[p];
    if (!st) break;
    out.unshift(p);
    p = st.parent;
  }
  return out;
}

// 规整：三种方言 → 扁平路径 map。每个状态携带有效配置（祖先链合并，子覆盖父）。
export function normalizeHfsm(m) {
  if (!m?.states) return m;
  const out = { initial: m.initial, roots: [], states: {}, transitions: m.transitions || [] };
  const visit = (key, st, parent, inherited) => {
    const path = parent ? `${parent}.${key}` : key;
    const util = st.utility || {};
    const kids = st.states ? Object.keys(st.states) : [];
    const eff = {
      key: path, name: key, parent, depth: parent ? (out.states[parent]?.depth ?? 0) + 1 : 0,
      label: st.label ?? inherited?.label ?? key,
      color: st.color ?? inherited?.color,
      // 有效行为配置：子覆盖父（autocast 整体替换；chase/leash/behavior 空值继承）
      autocast: (util.autocast || st.autocast || inherited?.autocast || []).map((c) => ({ ...c })),
      chase: util.chase ?? st.chase ?? inherited?.chase,
      leash: util.leash ?? st.leash ?? inherited?.leash,
      behavior: st.behavior ?? inherited?.behavior ?? null,
      behaviorInputs: st.behaviorInputs ?? inherited?.behaviorInputs ?? null,
      action: st.action ?? inherited?.action ?? null, // 统一 FSM 运行时的状态行为图（模板 id）
      transitions: (st.transitions || []).map((t) => ({ ...t })),
      children: [], initial: st.initial || null,
      isLeaf: kids.length === 0,
      src: st, // 原始声明（编辑 UI 读写用；引擎只读有效配置）
    };
    out.states[path] = eff;
    if (parent) out.states[parent].children.push(path);
    else out.roots.push(path);
    for (const ck of kids) visit(ck, st.states[ck], path, eff);
  };
  for (const [k, st] of Object.entries(m.states)) visit(k, st, null, null);
  // 机级 transitions 折叠进 from 状态（冒泡期命中；from=复合态 ⇒ 后代继承）：
  // event → {on}（事件转移）；condition/conditions → {cond:[...]}（条件蓝图，运行时逐 tick 求值）
  for (const t of out.transitions) {
    const fromPath = resolveStateKey(out, t.from);
    const st = fromPath && out.states[fromPath];
    if (!st || !t.to) continue;
    if (t.event) st.transitions.push({ on: t.event, to: t.to, within: t.within });
    else if (t.condition || t.conditions) st.transitions.push({ cond: t.conditions || [t.condition], to: t.to });
  }
  return out;
}