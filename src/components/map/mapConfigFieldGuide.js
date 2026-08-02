const f = (name, behavior, result) => ({ name, behavior, result });
const r = (title, setup, result) => ({ title, setup, result });

export const mapConfigFieldGuide = {
  title: 'Map Config',
  description: '字段直接对应 Ludots C# MapConfig、BoardConfig、EntitySpawnData、VisualHeightmapConfig 与 VirtualCameraConfig；参与者和队伍在 Players & Teams 中按 Map ID 关联。',
  fields: [
    f('map_id / Id', '地图配置的稳定唯一标识，其他配置通过它引用地图。', '用于运行时装载、继承与参与者拓扑绑定。'),
    f('parent_id / ParentId', '可选父地图 ID；当前地图在父配置基础上覆盖或追加内容。', '复用公共地图基线，减少重复配置。'),
    f('label', '仅供编辑器显示的可读名称，不参与运行时判断。', '方便策划识别地图。'),
    f('description', '地图用途、规则或维护说明。', '为配置维护者提供上下文。'),
    f('scope_type', '决定记录属于当前项目还是工作区共享资产。', '控制地图可在哪些项目中出现。'),
    f('workspace_id / project_id', '记录所属工作区和项目，由当前作用域自动写入。', '保证资产列表只显示当前作用域数据。'),
    f('dependencies', '字符串键值表；键是依赖槽名，值是目标配置或资源 ID。', '在装载地图前解析其外部依赖。'),
    f('tags', '地图自身的分类与查询标签。', '支持玩法、环境或关卡类型筛选。'),
    f('metadata', '不进入固定 C# 字段的扩展 JSON 元数据。', '保存工具链需要的附加信息。'),
    f('visual_heightmap_asset', '地图级视觉高度图资源路径。', '为未单独覆盖资源的空间系统提供默认高度图。'),
    f('structure_collision_asset', '地图级结构碰撞资源路径。', '提供建筑或静态结构碰撞数据。'),
    f('structure_aware_grounding', '让地面贴合计算考虑结构碰撞。', '单位可站立在结构表面而不只依赖地形。'),
    f('structure_aware_navigation', '让导航计算考虑结构碰撞。', '寻路可识别桥梁、建筑等结构空间。'),
    f('boards[].name', 'Board 在地图内的唯一名称，默认 default。', '实体和高度图可明确绑定到某个空间域。'),
    f('boards[].spatial_type', 'Grid 为方格空间，HexGrid 为六边形空间，NodeGraph 为节点图。', '决定 Board 的空间坐标与邻接模型。'),
    f('boards[].width_in_macro_tiles', 'Board 横向 Macro Tile 数量。', '决定 Grid/HexGrid 的世界宽度。'),
    f('boards[].height_in_macro_tiles', 'Board 纵向 Macro Tile 数量。', '决定 Grid/HexGrid 的世界高度。'),
    f('boards[].grid_cell_size_cm', '方格单元边长，单位厘米。', '把逻辑格坐标换算为世界距离。'),
    f('boards[].hex_edge_length_cm', '六边形边长，单位厘米。', '决定 HexGrid 单元的世界尺寸。'),
    f('boards[].chunk_size_cells', '每个分块包含的 Cell 数。', '控制空间数据分块粒度。'),
    f('boards[].loaded_chunk_capacity', '运行时可同时加载的 Chunk 容量；NodeGraph 必须大于 0。', '限制流式空间数据的内存规模。'),
    f('boards[].data_file', 'Board 的预构建空间数据文件。', '装载网格、节点或烘焙结果。'),
    f('boards[].visual_heightmap_asset', '当前 Board 专用的视觉高度图资源。', '覆盖地图级默认高度图。'),
    f('boards[].structure_collision_asset', '当前 Board 专用的结构碰撞资源。', '覆盖地图级默认碰撞资源。'),
    f('boards[].structure_aware_grounding', '仅为当前 Board 开启结构感知贴地。', '按空间域控制贴地行为。'),
    f('boards[].structure_aware_navigation', '仅为当前 Board 开启结构感知导航。', '按空间域控制结构寻路。'),
    f('boards[].navigation_enabled', '是否为当前 Board 初始化导航能力。', '关闭时该 Board 不参与寻路。'),
    f('trigger_types[] / TriggerTypes', '地图作用域内要创建的 C# Trigger 类型名。', '装载地图时实例化对应 Trigger；触发条件和动作由类型自身定义。'),
    f('entities[].instance_id', '地图内实体实例的稳定唯一标识。', 'Players & Teams 可将玩家或队伍化身绑定到该实例。'),
    f('entities[].template', '用于生成实体的模板或 Entity Prototype ID。', '决定实体初始组件、属性与能力。'),
    f('entities[].position.x / y', '实体生成位置的整数 X/Y 坐标。', '决定实体进入地图时的初始位置。'),
    f('entities[].overrides', '覆盖实体模板默认值的 JSON 对象。', '同一模板可生成参数不同的实例。'),
    f('entities[].performer_param_overrides', '按 ParamKey 覆盖 Performer 参数；可指定 Lane 及浮点、整数或向量值。', '为当前地图实例定制行为参数。'),
    f('visual_heightmap.asset', 'VisualHeightmapConfig 使用的资源 ID。', '声明用于视觉高度采样的数据源。'),
    f('visual_heightmap.board_name', '高度图关联的 Board 名称。', '把高度采样映射到正确空间域。'),
    f('visual_heightmap.default_layer_index', '未指定图层时采用的默认高度层索引。', '为多层高度数据提供默认层。'),
    f('default_camera.virtual_camera_id', '地图进入时采用的虚拟相机配置 ID。', '可复用预定义相机。'),
    f('default_camera.target_x_cm / target_y_cm', '相机默认观察目标的世界坐标，单位厘米。', '决定初始镜头中心。'),
    f('default_camera.yaw / pitch', '相机水平旋转角与俯仰角。', '决定初始观察方向。'),
    f('default_camera.distance_cm', '相机到观察目标的距离，单位厘米。', '决定初始镜头远近。'),
    f('default_camera.fov_y_deg', '垂直视野角，单位度。', '决定镜头透视范围。')
  ],
  recipes: [
    r('标准方格地图', '创建 default Grid Board，设置宽高、100cm Cell、64 Cell Chunk，并按需启用 Navigation。', '获得与 Ludots 默认空间尺度一致的地图。'),
    r('地图挂接参与者', '先保存 Map，再到 Players & Teams 选择该 Map，并将 Team/Player 化身绑定到 Map Entities 的 Instance ID。', '参与者拓扑只引用地图已经声明的实体实例。')
  ]
};