---
description: "ICE Render 安装指南：通过 npm 安装 ice-render 包，提供 ESM / CJS / UMD 三种产物格式，支持现代浏览器与微信小程序，运行时零依赖。"
keywords:
  - "ICE Render 安装"
  - "npm ice-render"
  - "UMD"
  - "ESM"
  - "Canvas 引擎集成"
---

# 安装

ICERender 发布为 npm 包 `ice-render`，提供 **ESM / CJS / UMD** 三种格式产物，运行时零依赖。

## 环境要求

- 现代浏览器（Chrome / Firefox / Safari / Edge），或任何提供 Canvas 2D 上下文的环境（如微信小程序）
- 若通过 npm 集成，建议 Node.js ≥ 16

## npm 安装

```bash
npm install ice-render
```

```js
import { ICE, ICERect } from 'ice-render';

const ice = new ICE();
ice.init('canvas-1');
ice.addChild(new ICERect({ left: 100, top: 100, width: 160, height: 90 }));
```

## UMD（script 标签）

不使用构建工具时，可直接引入 UMD 产物，全局变量为 `ICE`：

```html
<canvas id="canvas-1" width="800" height="600"></canvas>
<script src="https://unpkg.com/ice-render/dist/index.umd.js"></script>
<script>
  const ice = new ICE.ICE();
  ice.init('canvas-1');
  ice.addChild(new ICE.ICERect({ left: 100, top: 100, width: 160, height: 90 }));
</script>
```

## 初始化选项

`ice.init(ctx, options)` 的第一个参数非常灵活，可以是：

- canvas 元素的 **id 字符串**
- canvas **元素** 本身
- Canvas 2D **上下文**（`CanvasRenderingContext2D`）——小程序等非 DOM 环境用这种方式绕开 DOM

第二个参数 `options`：

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `renderMode` | `'dirty-rect' \| 'full'` | `'dirty-rect'` | 渲染模式：脏矩形局部重绘（默认）或全量重绘 |
| `dpr` | `number` | 自动探测 | 设备像素比，HiDPI 屏幕下显式指定可获得清晰渲染 |

:::tip 局部重绘契约
默认的 `dirty-rect` 模式在条件不满足时会自动回退全量重绘，两种渲染路径有 golden image 像素一致性回归保障，结果逐像素一致。调试时可切换 `renderMode: 'full'` 对比。
:::

## TypeScript

引擎为纯 TypeScript 编写，包内自带 `.d.ts` 类型声明，无需额外安装 `@types`。

## 验证安装

```js
import { ICE } from 'ice-render';

const ice = new ICE();
ice.init('canvas-1');
console.log(ice.canvasWidth, ice.canvasHeight); // 输出画布尺寸即安装成功
```

下一步：[你的第一个场景](your-first-scene.md)。
