---
sidebar_position: 1
---

# Entity Designer · ER 图设计器

**Entity Designer 是基于 ice-render 内核构建的 ER（实体-关系）建模设计器**——它不重复实现底层图元，只在 `ICEGroup`、连线族与事件总线之上，收敛出数据库建模最常用的交互：实体表、字段、主外键约束、关系连线、对齐参考线、自动布局、TypeORM Schema 实时序列化。

MIT License · 作者：大漠穷秋（damoqiongqiu@126.com）

## 一个完整的实时例子（就是仓库里的 `tests/entity-editor.html`）

下面这个 iframe 直接嵌入了 `ice-entity-designer` 仓库 `tests/entity-editor.html` 的**完整代码**：工具栏（新增 / 删除 / 撤销 / 重做 / 校验 / 保存 / 加载 / 输出 Schema / 重置视图）、四种自动布局（水平 / 垂直 / 径向 / 力导向）、连接关系、滚轮缩放 + 拖拽平移，右侧 antd 面板可编辑实体字段与关系属性，并实时切换到「序列化 JSON / TypeORM Schema」标签页。初始已加载一套 30 张表的电商域模型，你可以直接改、直接连、直接看 Schema 落地：

<iframe
  src="/ied/entity-editor.html"
  title="Entity Designer 实时编辑器"
  loading="lazy"
  style={{ width: '100%', height: '780px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}
/>

> 这就是 Entity Designer 的完整能力：**所见即所得地画 ER 图，画完直接拿到可落库的 TypeORM Schema。** 首次加载会拉取 ~1.8MB 的 React / antd 运行时（已随文档静态托管，无需联网）。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 实体表（Entity） | 表头 + 字段列表，PK / FK / UQ / AI / NN / GEN / IDX 标记一目了然 |
| 字段编辑 | 名称、类型、长度、约束（主键、自增、唯一、非空、默认、外键、索引、注释） |
| 关系连线 | one-to-many / many-to-one / one-to-one / many-to-many，Visio 折线或贝塞尔曲线 |
| 自动布局 | 水平 / 垂直流程布局、径向树布局、力导向布局，一键排布 |
| 对齐参考线 | `alignmentGuide` 自动吸附，拖拽排版像 IDE 一样顺手 |
| 撤销 / 重做 | 完整历史栈，`Ctrl/Cmd+Z` 撤销、`Ctrl/Cmd+Y` 重做 |
| 实时序列化 | `toSchemaObject()` / `toSchemaString()` 直接产出符合 `new EntitySchema(obj)` 的对象 |
| 项目快照 | `serializeProject()` / `loadProject()` 输出并还原可自动保存的项目 JSON |
| TypeORM 校验 | `validate()` 列出重复实体、悬空关系、缺外键等问题 |

## 快速开始

### 安装

```bash
# 引擎内核 + 设计器（二者都要装）
npm install ice-render ice-entity-designer
```

### 在浏览器里（无构建，UMD 全局 `IED`）

把 `ice-entity-designer/dist/index.umd.js` 放到页面里（内核已 inline 进该 UMD，无需单独引 ice-render），用全局 `IED` 命名空间：

```html
<canvas id="canvas-1" width="1200" height="800"></canvas>
<script src="./ice-entity-designer.umd.js"></script>
<script>
  const ice = new IED.ICE().init('canvas-1');
  const designer = new IED.EntityDesigner(ice);
  ice.alignmentGuide.enable({ threshold: 6 });

  const user = designer.createEntity({ entityName: 'User' });
  const role = designer.createEntity({ entityName: 'Role' });
  designer.createRelation({
    relationType: 'many-to-many',
    sourceId: user.state.id,
    targetId: role.state.id,
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
  relationType: 'many-to-many',
  sourceId: user.state.id,
  targetId: role.state.id,
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
