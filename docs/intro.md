---
sidebar_position: 0
sidebar_label: 介绍
---

# ICE Render · 雪花渲染器

**ICERender** 是一个用纯 TypeScript 编写的 Canvas 2D 交互图形渲染引擎，面向 ER 图、流程图、拓扑图等图编辑场景。它借鉴了 React 的组件模型与 W3C 的事件模型，提供嵌套坐标系、序列化、动画与 Visio 风格连接线，运行时零依赖（gl-matrix 在构建期内联）。

## 为什么选择 ICERender

### 1. 极端规模下的内存与构建效率

通过原型继承共享默认 props/state（默认配置不复制）、WeakSet 让挂载 O(1)：

- 实测 100 万个最小矩形的堆增量约 **0.87GB**（朴素实现约 2.0GB）
- 构建约 6 秒

### 2. 局部重绘是「可证明的像素契约」

- 默认脏矩形局部重绘；不满足条件时自动回退全量重绘（`ICE.init(ctx, { renderMode: 'full' })` 可强制全量）
- golden image 像素一致性回归保障两种渲染路径逐像素一致
- 组件级离屏缓存、渲染队列缓存、矩阵零分配
- 2026-09-11 实测约 2.2ms/帧（5000 图元场景）

### 3. 小程序是一等公民

- `cross-platform/root` 适配层收敛全局对象
- 无 `Path2D` 的运行时自动降级（`PolyfillPath2D`），渲染结果逐像素一致
- 字体 / 图片 / 离屏画布 / dpr 全适配
- `ICE.init(ctx)` 可直接传入上下文，绕开 DOM

## 核心特性一览

- **架构与组件模型**：声明式可序列化渐变、`display: false` 整树隐藏、Shift 修饰键约束变换手柄
- **坐标系与变换**：完整仿射变换、任意嵌套坐标系、HiDPI 支持
- **交互与连接线**：统一 Pointer 输入层、变换控制面板、`linkShape: 'visio' | 'bezier'` 连线、箭头样式、视口缩放平移
- **扩展与无障碍**：插件三层注册点（组件 / 渲染钩子 / 工具）、无障碍原语（`getAccessibilityTree`）
- **序列化与动画**：稳定 typeId、keyframes 关键帧动画、弹簧缓动（spring 三档）
- **工程化**：80 个测试文件 / 654 个用例、Playwright 视觉回归、publint + attw 发布门禁

## 生态

| 项目 | 说明 |
|---|---|
| [ice-render](https://www.npmjs.com/package/ice-render) | 核心引擎（本站文档） |
| [ice-render-dsl](https://www.npmjs.com/package/ice-render-dsl) | JSON-first DSL 层，让 AI Agent 无需学习命令式 API 即可驱动引擎 |
| [ice-entity-designer](https://www.npmjs.com/package/ice-entity-designer) | 基于引擎的可视化 ER 建模工具，可导出 TypeORM EntitySchema |
| ice-web-components | 仿 Swing 风格的 Canvas 原生 UI 组件库 |

## 下一步

- [安装](getting-started/installation.md)
- [你的第一个场景](getting-started/your-first-scene.md)
- [API 参考](api/ice.md)
- [架构设计](architecture/01-runtime.md)
