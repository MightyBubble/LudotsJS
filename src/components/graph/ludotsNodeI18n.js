const ZH = {
  Const:'常量', Bool:'布尔', Int:'整数', Float:'浮点', Load:'读取', Write:'写入', Attribute:'属性', Self:'自身', Has:'检查', Tag:'标签', Add:'相加', Sub:'相减', Mul:'相乘', Div:'相除', Abs:'绝对值', Neg:'取负', Min:'最小值', Max:'最大值', Clamp:'钳制', Compare:'比较', Select:'选择', Entity:'实体', Caster:'施法者', Explicit:'显式', Target:'目标', Random:'随机', Blackboard:'黑板', Config:'配置', Context:'上下文', Source:'来源', Query:'查询', Radius:'半径', Cone:'扇形', Rectangle:'矩形', Line:'线形', Hex:'六边格', Range:'范围', Ring:'环', Neighbors:'邻居', All:'全部', Map:'地图', From:'来自', Collection:'集合', Filter:'过滤', Not:'排除', Layer:'层', Relationship:'关系', Team:'队伍', Template:'模板', Any:'任意', None:'无', Sort:'排序', By:'按', Stable:'稳定', Limit:'限制', Agg:'聚合', Count:'计数', Sum:'求和', Average:'平均', Distance:'距离', Apply:'应用', Effect:'效果', Fan:'扇出', Out:'', Dynamic:'动态', Remove:'移除', Dispatch:'分发', Modify:'修改', Send:'发送', Event:'事件', Ensure:'确保', Link:'链接', Set:'设置', Metric:'指标', Flag:'标记', Get:'获取', Outgoing:'出向', Incoming:'入向', Mutual:'双向', Between:'两者间', Pair:'实体对', Invoke:'调用', Builtin:'内置处理器', Jump:'跳转', If:'如果', False:'假', Begin:'开始', Lifecycle:'生命周期', Transaction:'事务', TargetList:'目标列表', Position:'位置', Viewer:'观察者', Payload:'载荷', Projection:'投影', Knowledge:'知识', Snap:'吸附', Nearest:'最近', Graph:'图', Edge:'边', Force:'作用力', Direction:'方向', Normalize:'归一化', Length:'长度'
};

const split = value => value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ');
const toEnglish = op => split(op).join(' ');
const toChinese = op => split(op).map(word => ZH[word] || word).filter(Boolean).join('');

const describe = (op, zh) => {
  if (op.startsWith('Query')) return [`执行${zh}并输出确定性的实体集合。`, `Runs ${toEnglish(op)} and returns a deterministic entity collection.`];
  if (op.startsWith('Relationship')) return [`通过 Ludots 关系存储执行${zh}。`, `Performs ${toEnglish(op)} through the Ludots relationship store.`];
  if (op.includes('Blackboard')) return [`在当前 Graph VM 黑板中${zh}。`, `${toEnglish(op)} in the current Graph VM blackboard.`];
  if (op.includes('Effect') || op === 'InvokeBuiltin') return [`向 GAS 执行管线提交${zh}。`, `Submits ${toEnglish(op)} to the GAS execution pipeline.`];
  if (op.startsWith('Load')) return [`从当前执行上下文${zh}。`, `${toEnglish(op)} from the current execution context.`];
  if (op.startsWith('Agg')) return [`对当前集合执行${zh}。`, `Applies ${toEnglish(op)} to the current collection.`];
  return [`在 Ludots Graph VM 中执行${zh}。`, `Executes ${toEnglish(op)} in the Ludots Graph VM.`];
};

export function getLudotsNodeText(op, locale = 'zh-CN') {
  const en = toEnglish(op);
  const zh = toChinese(op);
  const [descriptionZh, descriptionEn] = describe(op, zh);
  return locale === 'en-US'
    ? { label: en, secondary: zh, description: descriptionEn }
    : { label: zh, secondary: en, description: descriptionZh };
}

export function getLudotsFieldText(key, locale = 'zh-CN') {
  const en = toEnglish(key.charAt(0).toUpperCase() + key.slice(1));
  const zh = toChinese(key.charAt(0).toUpperCase() + key.slice(1));
  return locale === 'en-US' ? `${en} · ${zh}` : `${zh} · ${key}`;
}