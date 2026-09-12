---
sidebar_position: 9
---

import DSLCanvas from '@site/src/components/DSLCanvas';

# DSL 与 AI Agent 接入

**ice-render 不只是「命令式图形引擎」，它还提供一层 JSON-first DSL——让 AI Agent（或任何代码生成器）用一份纯 JSON 文档就能驱动引擎渲染图形，无需学习 `ICE.ICERect` / `ICEPolyLine` 这类命令式 API。**

这对 AI Agent 接入尤其关键：

- Agent 只需要产出**结构化 JSON**（节点 / 边 / 选项），而不是拼装一长串引擎构造函数调用；
- 同一份 DSL 既能在浏览器里 `ICEDSL.renderDsl(canvas, dsl)` 直出画布，也能在 Node 里 `import { renderDsl }` 做服务端渲染 / 测试；
- DSL 有 `validateDsl()` 做 schema 校验（重复 id、未知节点类型、悬空边），Agent 产出可即时自检。

下面这条「用户意图 → AI Agent → JSON DSL → 引擎」的链路，就是一份真实可渲染的 DSL 文档（不是截图）：

<DSLCanvas
  height={240}
  dsl={{
    schemaVersion: 1,
    nodes: [
      { id: 'intent', type: 'rect', left: 40, top: 110, width: 180, height: 80, radius: 12,
        style: { fillStyle: '#f1f5f9', strokeStyle: '#475569', lineWidth: 2 } },
      { id: 't-intent', type: 'text', left: 70, top: 142, text: '用户意图 / 自然语言',
        style: { fillStyle: '#0f172a', fontSize: 15, fontWeight: 'bold' } },
      { id: 'agent', type: 'rect', left: 320, top: 110, width: 180, height: 80, radius: 12,
        style: { fillStyle: '#dbeafe', strokeStyle: '#2563eb', lineWidth: 2 } },
      { id: 't-agent', type: 'text', left: 360, top: 142, text: 'AI Agent',
        style: { fillStyle: '#1e3a8a', fontSize: 15, fontWeight: 'bold' } },
      { id: 'dsl', type: 'rect', left: 600, top: 110, width: 200, height: 80, radius: 12,
        style: { fillStyle: '#dcfce7', strokeStyle: '#16a34a', lineWidth: 2 } },
      { id: 't-dsl', type: 'text', left: 640, top: 142, text: 'ice-render DSL (JSON)',
        style: { fillStyle: '#14532d', fontSize: 15, fontWeight: 'bold' } },
      { id: 'engine', type: 'rect', left: 900, top: 110, width: 220, height: 80, radius: 12,
        style: { fillStyle: '#fef3c7', strokeStyle: '#d97706', lineWidth: 2 } },
      { id: 't-engine', type: 'text', left: 945, top: 142, text: 'ice-render 引擎',
        style: { fillStyle: '#78350f', fontSize: 15, fontWeight: 'bold' } }
    ],
    edges: [
      { id: 'e1', source: 'intent', target: 'agent', type: 'visio', sourcePort: 'R', targetPort: 'L', arrow: 'end',
        style: { strokeStyle: '#64748b', lineWidth: 2 } },
      { id: 'e2', source: 'agent', target: 'dsl', type: 'visio', sourcePort: 'R', targetPort: 'L', arrow: 'end',
        style: { strokeStyle: '#64748b', lineWidth: 2 } },
      { id: 'e3', source: 'dsl', target: 'engine', type: 'visio', sourcePort: 'R', targetPort: 'L', arrow: 'end',
        style: { strokeStyle: '#64748b', lineWidth: 2 } }
    ],
    options: { fitViewport: true, fitViewportPadding: 40 }
  }}
/>

上面的画布就是这样一份 JSON 渲染出来的（右侧没有一行命令式 `new ICERect(...)`）：

```json title="驱动上面画布的 DSL 文档"
{
  "schemaVersion": 1,
  "nodes": [
    { "id": "intent", "type": "rect", "left": 40, "top": 110, "width": 180, "height": 80, "radius": 12,
      "style": { "fillStyle": "#f1f5f9", "strokeStyle": "#475569", "lineWidth": 2 } },
    { "id": "agent",  "type": "rect", "left": 320, "top": 110, "width": 180, "height": 80, "radius": 12,
      "style": { "fillStyle": "#dbeafe", "strokeStyle": "#2563eb", "lineWidth": 2 } },
    { "id": "dsl",    "type": "rect", "left": 600, "top": 110, "width": 200, "height": 80, "radius": 12,
      "style": { "fillStyle": "#dcfce7", "strokeStyle": "#16a34a", "lineWidth": 2 } },
    { "id": "engine", "type": "rect", "left": 900, "top": 110, "width": 220, "height": 80, "radius": 12,
      "style": { "fillStyle": "#fef3c7", "strokeStyle": "#d97706", "lineWidth": 2 } }
  ],
  "edges": [
    { "id": "e1", "source": "intent", "target": "agent",  "type": "visio", "sourcePort": "R", "targetPort": "L", "arrow": "end" },
    { "id": "e2", "source": "agent",  "target": "dsl",    "type": "visio", "sourcePort": "R", "targetPort": "L", "arrow": "end" },
    { "id": "e3", "source": "dsl",    "target": "engine", "type": "visio", "sourcePort": "R", "targetPort": "L", "arrow": "end" }
  ],
  "options": { "fitViewport": true, "fitViewportPadding": 40 }
}
```

## 两层 DSL

ice-render 家族提供两套互补的 DSL，按场景选择：

| DSL | 适用场景 | Agent 产出 | 渲染入口 |
|---|---|---|---|
| **ice-render-dsl** | 通用节点 / 边图：流程图、拓扑图、依赖图、分组容器、图片、渐变、简单动画 | `nodes` / `edges` / `options` | `ICEDSL.renderDsl(canvas, dsl)` |
| **ice-entity-designer-dsl** | 领域建模，七种 `kind`：ER（实体 / 字段 / 约束 / 关系 / 外键 / join 表）、流程图、BPMN 2.0、UML 类图、状态机、甘特、电力一次系统图 | `kind` + `nodes` / `edges`（ER 用 `entities` / `relations`） | `ICEDSL.renderDsl(canvas, dsl)` |

两者都遵守同一套「JSON-first、零命令式 API」原则：Agent 只写数据，引擎负责渲染。

### 1. ice-render-dsl（通用图）

节点类型：`rect` / `circle` / `ellipse` / `text` / `polyline` / `image` / `isogon` / `star` / `rose` / `group`（可递归嵌套 `children`）。边类型：`polyline` / `bezier` / `visio`，支持端口（T/R/B/L/C）、箭头、路由。

```json title="一个最小流程图 DSL"
{
  "schemaVersion": 1,
  "nodes": [
    { "id": "a", "type": "rect", "left": 80, "top": 160, "width": 180, "height": 90, "radius": 12,
      "style": { "fillStyle": "#dbeafe", "strokeStyle": "#2563eb", "lineWidth": 2, "shadow": "md" } },
    { "id": "b", "type": "star", "left": 520, "top": 150, "outerRadius": 70, "innerRadius": 30, "spikes": 6,
      "style": { "fillStyle": "#fde68a", "strokeStyle": "#d97706", "lineWidth": 2 } }
  ],
  "edges": [
    { "id": "flow", "source": "a", "target": "b", "type": "visio", "sourcePort": "R", "targetPort": "L", "arrow": "end", "label": "render" }
  ],
  "options": { "fitViewport": true, "fitViewportPadding": 48 }
}
```

### 2. ice-entity-designer-dsl（领域建模：ER / 流程图 / BPMN / UML / 状态机 / 甘特 / 电力）

七种文档共用一个入口：`kind` 缺省时按 ER 处理，其余取值 `'flowchart'` / `'bpmn'` / `'uml'` /
`'statechart'` / `'gantt'` / `'power'`。坐标大多可省略，由编译器按记法自动布局。

ER 文档直接描述「实体 + 字段 + 关系」，引擎会渲染标准 ER 图并归一化成 TypeORM `EntitySchema`：

```json title="电商 ER 模型（节选）"
{
  "schemaVersion": 1,
  "layout": "layered",
  "entities": [
    { "id": "customer", "name": "Customer",
      "fields": [
        { "name": "id", "type": "number", "primary": true, "autoIncrement": true },
        { "name": "email", "type": "string", "unique": true, "nullable": false }
      ] },
    { "id": "order", "name": "Order",
      "fields": [
        { "name": "id", "type": "number", "primary": true, "autoIncrement": true },
        { "name": "customerId", "type": "number", "foreignKey": true, "nullable": false },
        { "name": "total", "type": "decimal", "length": "12,2" }
      ] }
  ],
  "relations": [
    { "source": "customer", "target": "order", "type": "one-to-many",
      "sourceField": "id", "targetField": "customerId", "label": "places", "onDelete": "CASCADE" }
  ]
}
```

## 怎么渲染（Agent 视角）

**浏览器**（本页所有 live 示例都走这条路径）：先加载 `ice-render.js` 与 `ice-render-dsl.js`，再一行渲染：

```html
<script src="/ice-render.js"></script>
<script src="/ice-render-dsl.js"></script>
<script>
  ICEDSL.renderDsl('canvas', dsl); // dsl 就是上面那份 JSON
</script>
```

**Node / 构建工具链**：

```ts
import { renderDsl } from 'ice-render-dsl';
const { ice, nodes, edges } = renderDsl(canvas, dsl);
```

**产出前自检**（强烈推荐 Agent 在返回 DSL 前调用）：

```ts
import { validateDsl } from 'ice-render-dsl';
const { valid, errors } = validateDsl(dsl); // 重复 id / 未知节点类型 / 悬空边
```

## 给 Agent 的接入建议

- **能写 DSL 就别写命令式 API**：Agent 产出 JSON 比手写 `ICE.*` 构造函数更稳、更可校验、更可复用。
- **通用图用 `ice-render-dsl`，领域建模用 `ice-entity-designer-dsl`**——不要混用两套字段（前者的 `nodes`/`edges` 是通用图元；后者的 ER 文档用 `entities`/`relations`，其余 `kind` 用 `nodes`/`edges`）。
- **先 `validateDsl` 再 `renderDsl`**：把 schema 校验当成 Agent 的「编译期」。
- **需要交互式编辑器**（拖拽 / 增删字段 / 导出 TypeORM）时，用 `ice-entity-designer` 的命令式或 React API，而非单纯渲染 DSL。

相关资源：

- npm：[ice-render-dsl](https://www.npmjs.com/package/ice-render-dsl) · [ice-entity-designer-dsl](https://www.npmjs.com/package/ice-entity-designer-dsl)
- 命令式引擎与组件模型：[核心概念](/docs/guide/core-concepts) · [图元](/docs/guide/shapes) · [基于内核二次开发](/docs/advanced/secondary-development)
