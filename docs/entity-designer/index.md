---
sidebar_position: 1
---

import ERNodePlayground from '@site/src/components/ERNodePlayground';

# Entity Designer · ER 图设计器

**Entity Designer 是基于 ice-render 内核构建的 ER（实体-关系）建模设计器**——它不重复实现底层图元，只在 `ICEGroup`、连线族与事件总线之上，收敛出数据库建模最常用的交互：实体表、字段、主外键约束、关系连线、对齐参考线、TypeORM Schema 实时序列化。

MIT License · 作者：大漠穷秋（damoqiongqiu@126.com）

## 一个酷炫的实时例子

下面这个 playground 是 `ice-entity-designer` 内部 `Entity.ts` 与 `serialization_util.ts` 的**忠实复刻**，跑在和官网同一套 UMD 内核（`window.ICE`）上。点「复制节点」会按字段列表深拷贝出一个骨架；「＋ / － 字段」对选中实体命令式增删字段；右侧面板即 `toSchemaObject()` **实时输出**的 TypeORM Schema，可直接 `new EntitySchema(obj)`：

<ERNodePlayground />

> 这就是 Entity Designer 的核心体验：**所见即所得地画 ER 图，画完直接拿到可落库的 TypeORM Schema。**

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 实体表（Entity） | 表头 + 字段列表，PK / FK / UQ / AI / NN 标记一目了然 |
| 字段编辑 | 名称、类型、长度、约束（主键、自增、唯一、非空、默认、外键） |
| 关系连线 | one-to-many / many-to-one / one-to-one / many-to-many，Visio 折线或贝塞尔曲线 |
| 对齐参考线 | `alignmentGuide` 自动吸附，拖拽排版像 IDE 一样顺手 |
| 实时序列化 | `toSchemaObject()` 直接产出符合 `new EntitySchema(obj)` 的普通对象 |
| 项目快照 | `serializeProject()` 输出可自动保存的项目 JSON，反序列化即可还原画布 |
| TypeORM 校验 | `validate()` 列出重复实体、悬空关系、缺外键等问题 |

## 快速开始

### 安装

```bash
# 引擎内核 + 设计器（二者都要装）
npm install ice-render ice-entity-designer
```

### 在浏览器里（无构建，UMD 全局 `IED`）

把 `ice-entity-designer/dist/index.umd.js` 与 `ice-render` 的 UMD 放到页面里，用全局 `IED` 命名空间：

```html
<canvas id="canvas-1" width="900" height="600"></canvas>
<script src="./ice-render.umd.js"></script>
<script src="./ice-entity-designer.umd.js"></script>
<script>
  const ice = new IED.ICE().init('canvas-1');
  const designer = new IED.EntityDesigner(ice);
  ice.alignmentGuide.enable({ threshold: 6 });

  const user = designer.createEntity({ entityName: 'User' });
  const role = designer.createEntity({ entityName: 'Role' });
  designer.createRelation({
    sourceId: user.state.id,
    targetId: role.state.id,
    relationType: 'many-to-many',
    joinTableName: 'user_roles',
  });

  const schema = designer.toSchemaObject(); // TypeORM Schema（对象），可直接 new EntitySchema(obj)
  const issues = designer.validate();        // 校验问题列表
  designer.serializeProject();               // 项目快照（字符串，可自动保存）
</script>
```

### 在打包工程里（ES Module）

```js
import { ICE, EntityDesigner } from 'ice-entity-designer';

const ice = new ICE().init('canvas-1');
const designer = new EntityDesigner(ice);

const user = designer.createEntity({ entityName: 'User' });
const role = designer.createEntity({ entityName: 'Role' });
designer.createRelation({
  sourceId: user.state.id,
  targetId: role.state.id,
  relationType: 'many-to-many',
  joinTableName: 'user_roles',
});

const schema = designer.toSchemaObject();
```

### 在 React 里

`ice-entity-designer` 提供 `ice-entity-designer/react` 子路径导出，含 `<EntityDesignerCanvas>`（挂载即创建、卸载即销毁）、`useEntityDesigner()`、`EntityDesignerProvider`：

```jsx
import { EntityDesignerCanvas } from 'ice-entity-designer/react';

function App() {
  return (
    <EntityDesignerCanvas
      style={{ width: '100%', height: 600 }}
      defaultValue={{ entities: [], relations: [] }}
      onChange={({ snapshot, schema }) => {
        // snapshot: 项目快照字符串；schema: TypeORM Schema 对象
        console.log(schema);
      }}
    />
  );
}
```

> `react` / `react-dom` 是**可选 peerDependencies**（`^18 || ^19`），不强制安装。

## AI Agent 接入：JSON-first DSL ⭐

:::tip
和 ice-render 本身一样，**Entity Designer 也提供一层 JSON-first DSL（`ice-entity-designer-dsl`），让 AI Agent 用一份纯 JSON 文档就能驱动 ER 建模——无需拼装一长串 `new EntityDesigner(...)` 命令式调用。**
:::

Agent 只需要产出结构化 JSON（实体 / 字段 / 关系 / 布局），同一份 DSL 既能直出 ER 图，也能在服务端做 Schema 生成与校验。下面这份「电商模型」就是一份真实可渲染、可序列化的 DSL 文档（不是截图）：

```json title="ice-entity-designer-dsl 文档（AI Agent 可直接产出）"
{
  "schemaVersion": 1,
  "layout": "layered",
  "entities": [
    {
      "id": "customer",
      "name": "Customer",
      "fields": [
        { "name": "id", "type": "number", "primary": true, "autoIncrement": true },
        { "name": "email", "type": "string", "unique": true, "nullable": false },
        { "name": "name", "type": "string", "nullable": false }
      ]
    },
    {
      "id": "order",
      "name": "Order",
      "fields": [
        { "name": "id", "type": "number", "primary": true, "autoIncrement": true },
        { "name": "customerId", "type": "number", "foreignKey": true, "nullable": false },
        { "name": "status", "type": "string", "default": "pending" },
        { "name": "total", "type": "decimal", "length": "12,2" }
      ]
    },
    {
      "id": "product",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "number", "primary": true, "autoIncrement": true },
        { "name": "sku", "type": "string", "unique": true, "nullable": false },
        { "name": "price", "type": "decimal", "length": "10,2" }
      ]
    }
  ],
  "relations": [
    { "source": "customer", "target": "order", "type": "one-to-many",
      "sourceField": "id", "targetField": "customerId",
      "sourceCardinality": "1", "targetCardinality": "0..N",
      "label": "places", "onDelete": "CASCADE" }
  ],
  "options": { "fitViewport": true, "fitViewportPadding": 48, "routeType": "orthogonal", "gapX": 120, "gapY": 60 }
}
```

DSL 契约（根节点只含这五个字段）：

| 字段 | 说明 |
| --- | --- |
| `schemaVersion` | DSL 版本号（当前 `1`） |
| `entities` | 实体数组，每项含 `id` / `name` / `fields[]`；字段含 `type`、约束（`primary`/`foreignKey`/`unique`/`nullable`/`autoIncrement`/`default`/`length`） |
| `relations` | 关系数组，`type` 取 one-to-many / many-to-one / one-to-one / many-to-many；many-to-many 必须带 `joinTableName` |
| `layout` | 自动布局：`layered` / `grid` / `horizontal`；不填则用 `options.gapX/gapY` |
| `options` | `fitViewport`、`fitViewportPadding`、`routeType`、`gapX`、`gapY` 等 |

渲染与自检：

```js
import { renderDsl, validateDsl } from 'ice-entity-designer-dsl';

const issues = validateDsl(dsl);   // Agent 产出可即时自检：重复 id / 悬空关系 / 缺外键
if (issues.length === 0) {
  const { ice, designer } = renderDsl('canvas', dsl); // 直出 ER 图
}
```

- 浏览器：先加载 `ice-entity-designer`，再加载 `ice-entity-designer-dsl`，全局 `ICEDSL.renderDsl('canvas', dsl)` 即可。
- Node：`import { renderDsl } from 'ice-entity-designer-dsl'`（安装即自动带 `ice-entity-designer`）。

:::info
这套「用户意图 → AI Agent → JSON DSL → 引擎」的接入思路，和 [DSL 与 AI Agent 接入](/docs/guide/dsl) 里 ice-render 通用 DSL 是同一套哲学——**Agent 只产出数据，引擎负责渲染与序列化**。ER 建模用 `ice-entity-designer-dsl`，通用图形用 `ice-render-dsl`，二者互不混用。
:::

## 相关链接

- GitHub：[ice-entity-designer](https://github.com/ice-render/ice-entity-designer)
- npm：[ice-entity-designer](https://www.npmjs.com/package/ice-entity-designer) · [ice-entity-designer-dsl](https://www.npmjs.com/package/ice-entity-designer-dsl)
- 二次开发实战：[Entity 领域图元与 TypeORM 序列化](/docs/advanced/secondary-development)
- 通用 DSL 与 AI Agent 接入：[DSL 与 AI Agent 接入](/docs/guide/dsl)
