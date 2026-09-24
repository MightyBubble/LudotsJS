# LudotsJS 编辑器路线图（2026-08-17 盘点）

> 盘点结论的固化。定位：多语言 Ludots 通用的 web 前端编辑器 + 自包含 JS 运行时；配置结构与预期行为以各语言引擎 loader 合同为唯一真相源。

## 现状一句话

47+ 实体编辑齐备、Effect/Graph 一条线已达"C# 契约保真"级导出；但**与 LudotsProd 无文件桥**（数据全在 base44 云，靠手动下载 JSON 搬运），JS 运行时是静态快照模拟（无 tick 级世界推演）。

## 11 项编辑器能力对齐

| 能力 | 状态 | 备注 |
|---|---|---|
| 实体模板组件表单 | ✅ 有 | EntityPrototypeEditor + 引用防呆 |
| 地图编辑器（棋盘/布阵） | ✅ 最完整 | three.js 放置 + 容量换算 |
| 配置表清单视图 | ◐ 半 | 无 config_catalog 视角 |
| tag 总账 | ◐ 半 | 有历史/统计，无注册台账 |
| 事实页（容量/上限） | ◐ 半 | 硬编码散落 validation.js |
| 项目管理（mod 清单/依赖/向导） | ✗ 无 | Project 是云记录，与 mod.json 无映射 |
| 分片保存 | ✗ 无 | |
| 合并预览 | ✗ 无 | |
| 启动组合预览 | ✗ 无 | |
| 触发器启用页 | ✗ 无 | |
| 扩展键浏览 | ✗ 无 | |

## 完善五步（顺序即依赖）

1. **LudotsProd 文件桥**（本地 dev 文件代理或 GitHub connector 双向同步）——一切价值兑现的瓶颈。
2. **mod.json + config_catalog 读取与表清单视图**——以引擎目录与合并策略为真相源建立数据模型。
3. **通用分片导出器**：47 实体 → `assets/` 分片 + ArrayById 合并预览——复用 Effect 线的严格契约模式。
4. **集中事实表**：容量/上限/策略单一来源，驱动校验与 UI（消除硬编码漂移）。
5. **测试 + 路由收敛**：graphRuntime/queryRuntime/validation 纯函数单测；pages.config.js 与 App.jsx 双轨路由合一。

## 工程健康

零测试；巨型文件 TagEditor 48K / ValidatorEditor 47K；Playground 单效果拉 13 个实体无分页；`fps_game/` 为无关独立小游戏。

> 配套手册：C:\001_AI\LudotsProd\gitbook\reference\mod-editor-prd\（六层，UXD/spec-editor 即本编辑器的需求与实现任务书）。
