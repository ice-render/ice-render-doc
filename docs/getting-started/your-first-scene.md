---
description: "用 ICE Render 画出你的第一个场景：从创建场景树、添加图形到挂载 Canvas 的完整上手示例，快速建立对组件模型与场景树的直观认识。"
keywords:
  - "第一个场景"
  - "ICE Render 上手"
  - "场景树"
  - "Canvas 示例"
  - "快速开始"
---

# 你的第一个场景

本篇从零开始：创建画布 → 画矩形 → 加文本 → 支持拖拽 → 响应事件 → 序列化。完整可运行代码基于 UMD 格式，npm/ESM 用法完全相同（仅导入方式不同）。

## 准备画布并初始化引擎

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
  <canvas id="canvas-1" width="800" height="600" style="border: 1px solid #ccc;"></canvas>
  <script src="https://unpkg.com/ice-render/dist/index.umd.js"></script>
  <script>
    const ice = new ICE.ICE();
    ice.init('canvas-1', { renderMode: 'dirty-rect' });
  </script>
</body>
</html>
```

## 添加一个矩形

```js
const rect = new ICE.ICERect({
  id: 'rect-1',
  left: 100,
  top: 100,
  width: 160,
  height: 90,
  style: { fillStyle: '#4dd0e1', strokeStyle: '#006064', lineWidth: 2 },
});
ice.addChild(rect);
```

`ICERect` 默认 `draggable: true`——刷新页面后你已经可以直接用鼠标拖动它。

## 添加文本

```js
const label = new ICE.ICEText({
  text: 'Hello, ICERender!',
  left: 100,
  top: 210,
  style: { fontSize: 20, fillStyle: '#37474f' },
  transformable: false,
});
ice.addChild(label);
```

## 分组与嵌套

`ICEGroup` 是容器组件，子组件使用**相对于分组**的坐标：

```js
const group = new ICE.ICEGroup({ left: 300, top: 100 });
group.addChild(new ICE.ICERect({ left: 0, top: 0, width: 120, height: 60, style: { fillStyle: '#fff59d' } }));
group.addChild(new ICE.ICEText({ text: '分组', left: 10, top: 10, style: { fontSize: 16 } }));
ice.addChild(group);
```

拖动分组时两个子组件一起移动——这就是[嵌套坐标系](../guide/coordinate-system.md)的直观效果。

## 响应事件

组件上的事件 API 遵循 W3C 模型：

```js
rect.on('click', (evt) => {
  console.log('矩形被点击了', evt.param);
});
```

引擎还内置了大量生命周期事件（`BEFORE_MOVE` / `AFTER_RESIZE` / `AFTER_ROTATE` 等），详见[事件系统](../guide/events)。

## 序列化与还原

```js
// 导出
const json = ice.toJSONString();

// 还原
ice.clearAll();
ice.fromJSONString(json);
```

## 开启主题（可选）

```js
ice.setTheme('dark'); // 内置 light/dark 语义主题，可热切换
```

## 写一个「页面」（这一步别跳）

上面这些例子都是**引擎原语**：`ice.addChild(new ICERect(...))` 画单块图形、写单文件 demo 很顺手。
但一个应用里真正要交付的是**页面**：若干控件、数据由宿主推给你、切换 / 刷新时只改值不重建结构。
那种情况下别继续往 `ice.addChild(...)` 上堆，家族统一的写法是**一页一个类**——
继承组件库的 `ICEContainer`，构造期把树建好，`onUpdate()` 是**唯一**的改值入口：

```ts
import { ICEContainer, ICELabel, ICETable } from 'ice-web-components';

class DataPage extends ICEContainer {
  private readonly table: ICETable;                 // ① 构造期建树，树只建一次

  constructor(ctx: { width: number; height: number }) {
    super({ left: 0, top: 0, width: ctx.width, height: ctx.height });
    this.addChild(new ICELabel({ left: 16, top: 12, text: '运行数据' }));
    this.table = new ICETable({ left: 16, top: 48, width: ctx.width - 32 });
    this.addChild(this.table);
  }

  /** ② 唯一改值入口：宿主在"数据换成新的"之后调它 */
  onUpdate(snapshot: { rows: any[] }): void {
    this.table.setData(snapshot.rows);
  }
}
```

三条判据说明"什么时候该从脚本升级成页面"：**有第二个页面**、**数据由宿主推给你**、
**同一块结构要反复改值**。升级之后不要再堆 `ice.addChild`（`DataPage` 挂一次就够）。

完整的契约在 [应用层：一个页面怎么写](../conventions/app-pages)：
宿主在什么时机调 `onUpdate()`、四个入口怎么选（叶子控件 / 页面 / 设计器 / DSL）、
稳定结构与可变内容的边界、验收清单（棘轮 + 真机 e2e）以及我们踩过的坑。

## 接下来

- [核心概念](../guide/core-concepts.md)：组件模型、props/state、场景树
- [应用层：一个页面怎么写](../conventions/app-pages)：一页一个类、`onUpdate()` 的时机、入口决策表
- [图元手册](../guide/shapes.md)：全部内置图形
- [API 参考](../api/ice.md)
