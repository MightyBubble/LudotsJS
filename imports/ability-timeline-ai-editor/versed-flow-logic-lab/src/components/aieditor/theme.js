// 苹果系深色视觉主题 —— 所有画布编辑器（GraphLab / BT / FSM / GOAP / HTN）共享。
// 设计规格：Apple HIG 深色（明度分层、半透明白边、系统强调色）× 哑光 pastel 节点色。
// 注意：toolbar 必须保持 6 位 hex（HTN 用 `${UE.toolbar}ee` 拼 8 位透明色）。
import { MarkerType } from 'reactflow';

export const UE = {
  // 画布与面板（明度分层：画布最暗 → 面板 → 浮层最亮）
  canvas: '#0C0D10',                  // 画布底色
  grid: 'rgba(255,255,255,0.09)',     // 网格点
  panel: '#131417',                   // 侧栏/面板底
  panelDeep: '#0E0F12',               // 更深的输入框底
  border: 'rgba(255,255,255,0.08)',   // 面板描边（半透明白，禁实色灰）
  toolbar: '#131417',                 // 6 位 hex，勿改格式
  elevated: '#1C1E22',                // 浮层（菜单/下拉）
  hover: 'rgba(255,255,255,0.05)',
  active: 'rgba(255,255,255,0.08)',
  selectedBg: 'rgba(10,132,255,0.16)',
  // 节点
  nodeBody: '#1A1C20',
  nodeBorder: 'rgba(255,255,255,0.12)',
  nodeTitle: 'rgba(255,255,255,0.95)',
  selected: '#E8E8ED',                // 亮银
  accent: '#E8E8ED',
  // 文字（Apple label 四级）
  text: 'rgba(255,255,255,0.92)',
  dim: 'rgba(235,235,245,0.62)',
  faint: 'rgba(235,235,245,0.38)',
  // exec
  exec: '#EBEBF0',
  // 数据引脚（金属灰阶类型色）
  pin: {
    number: '#C7C7CC',      // float 银
    bool: '#E8E8ED',        // bool 亮银
    string: '#AEAEB2',      // string 镍
    any: '#7C7C80',         // 通配铁灰
    array: '#D1D1D6',       // 数组铬
    object: '#98989D',      // 对象钢
  },
  // 语义色（Apple 深色系统色）
  ok: '#30D158',
  warn: '#FFD60A',
  err: '#FF453A',
  // 阴影与字体
  shadowMenu: '0 0 0 1px rgba(255,255,255,.08), 0 8px 24px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.30)',
  insetHi: 'inset 0 1px 0 rgba(255,255,255,.05)',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, "JetBrains Mono", Consolas, monospace',
};

export const pinColor = (t) => UE.pin[t] || UE.pin.any;

// UE 连线样式：白色 exec / 数据按源引脚色，闭合箭头
export const ueEdgeStyle = (color, width = 2) => ({
  style: { stroke: color, strokeWidth: width },
  markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
});

// 节点外框（Studio 直角玻璃：分层渐变 + 顶部内高光 + 银线选中 + 微光晕）
export const ueNodeBox = (selected, extra = {}) => ({
  background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012) 30%, rgba(0,0,0,0.18)), #16181C',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  border: `1px solid ${selected ? 'rgba(232,232,237,0.55)' : 'rgba(255,255,255,0.09)'}`,
  borderRadius: 0,
  boxShadow: selected
    ? `0 0 0 1px ${UE.accent}, 0 0 20px rgba(232,232,237,0.10), 0 12px 30px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)`
    : '0 3px 10px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05)',
  overflow: 'visible',
  ...extra,
});

// 标题带：类别色横向渐隐铺底 + 发丝底边 + 3px 色块锚点（直角）
export const ueHeader = (color) => ({
  background: `linear-gradient(90deg, ${color}38, ${color}12 62%, transparent)`,
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 0,
  padding: '5px 10px 5px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: `inset 3px 0 0 ${color}`,
});

// exec 三角引脚（白箭头，蓝图标志性形状）
export const EXEC_TRI = {
  width: 0, height: 0, background: 'transparent', border: 'none',
  borderLeft: `8px solid ${UE.exec}`, borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
};

// React Flow 面板控件暗色化（Controls / MiniMap 用）
export const UE_CONTROLS_CLS = '[&>button]:!bg-[#1C1E22] [&>button]:!border-[rgba(255,255,255,0.10)] [&>button]:!fill-[rgba(235,235,245,0.75)] [&>button:hover]:!bg-[#26282D] [&>button]:!rounded-md';

// 分类标题带色（金属灰阶：铂/铬/银/镍/钢/铁/石墨/锌）
export const CATEGORY_BAND = {
  流程: '#8E8E93',   // 石墨
  事件: '#D1D1D6',   // 铬
  动作: '#C7C7CC',   // 银
  条件: '#AEAEB2',   // 镍
  数据: '#98989D',   // 钢
  数学: '#98989D',
  逻辑: '#98989D',
  世界: '#C7C7CC',
  宏: '#8E8E93',
  函数: '#E5E5EA',   // 铂
};
export const bandColor = (def) => def?.color || CATEGORY_BAND[def?.category] || '#8E8E93';

// ── React Flow 共享交互预设（UE 蓝图基础交互，全部编辑器统一） ──
// 左键拖空白=框选（部分覆盖即选中）· 右键/中键拖=平移 · 右键点=联想菜单
// Shift+点=多选加选 · Delete=删除 · 滚轮=缩放至光标 · 网格吸附 20px · 手柄磁吸 24px
// 拖线头可重插（edgesReconnectable + onReconnect）
export const UE_RF_COMMON = {
  selectionOnDrag: true,
  panOnDrag: [1, 2],
  snapToGrid: true,
  snapGrid: [20, 20],
  connectionRadius: 24,
  selectionKeyCode: false,
  multiSelectionKeyCode: 'Shift',
  deleteKeyCode: ['Delete'],
  edgesReconnectable: true,
  elevateEdgesOnSelect: true,
  minZoom: 0.25,
  maxZoom: 2,
  fitViewOptions: { padding: 0.2, maxZoom: 1.25 },
  proOptions: { hideAttribution: true },
};

// 小地图
export const UE_MINIMAP = {
  pannable: true,
  zoomable: true,
  maskColor: 'rgba(12,13,16,0.72)',
  style: { background: '#131417', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 },
};
