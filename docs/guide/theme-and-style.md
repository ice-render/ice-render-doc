---
sidebar_position: 8
---

import IceCanvas from '@site/src/components/IceCanvas';

# 主题与样式机制

ice-render 的样式机制是「**透传 + 增强**」，主题机制是「**三层 design token + 命名主题**」。本文说明两者的设计、用法与优先级链。

## 一、样式机制：透传底座

组件通过 `style` 对象声明外观，`applyStyleToCtx()` 会把 `style` 里的每个字段**原样透传**到 canvas 上下文（`ctx[key] = style[key]`）。因此任何 canvas 属性（`fillStyle` / `strokeStyle` / `lineWidth` / `font` / `fontSize` / `shadow*` …）都能直接写进 `style`，引擎不需要逐个实现。

渲染链路：

```
props.style / state.style
        ↓ applyStyleToCtx()（for...in 透传 + shadow 简写展开）
      ctx（canvas 上下文状态）
        ↓ doRender()
   fill(path2D) / stroke(path2D) / fillText()
```

`fill` / `stroke` 是顶层 props（不在 `style` 里），控制是否填充/描边：

```js
new ICERect({
  fill: false,                 // 不填充
  stroke: true,                // 描边
  style: { strokeStyle: '#185fa5', lineWidth: 2 },
});
```

## 二、样式能力清单

在透传底座之上，引擎提供了这些增强：

### 文字排版

`textAlign`（`start` / `center` / `right`）与 `textBaseline`（`alphabetic` / `middle`）真正生效，文字可精确居中：

```js
new ICEText({
  left: 0, top: 0, width: 200, height: 40, text: '居中文字',
  style: { fontSize: 16, fillStyle: '#333', textAlign: 'center', textBaseline: 'middle' },
});
```

> 注意：`ICEText` 的尺寸分两种语义 —— **显式传了 `width` / `height` 就按你给的尺寸**（量测只补 `textHeight`，不会覆盖它）；
> **没传才按量测自适应**（首帧拿不到量测时先停在默认 `10×10`，拿到真实量测后修正）。默认值 `10` **不再兼作「未设置」哨兵**，
> 所以 `new ICEText({ width: 10, height: 10 })` 就是一个真的 10×10 文本框。构造之后再 `setState({ width })`
> （含布局管理器分配的尺寸）同样按显式尺寸处理。`textAlign: 'center'` 等居中逻辑依赖 `state.width` 计算 `localOrigin`，
> 显式尺寸不会被量测值覆盖。

### 阴影简写

`shadow: 'sm' | 'md' | 'lg'` 一行展开成 4 个 canvas 属性：

```js
new ICERect({ style: { fillStyle: '#fff', shadow: 'md' } });
// → shadowColor: rgba(0,0,0,0.18), shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 3
```

### 虚线 / 蚂蚁线 / 水管壁

`ICEPolyLine` 等路径组件支持静态虚线、流动蚂蚁线（marching ants）与水管壁三种模式：

```js
// 静态虚线
new ICEPolyLine({ lineDash: [10, 6], style: { strokeStyle: '#888', lineWidth: 2 } });

// 蚂蚁线（虚线沿路径流动，marching ants）
new ICEPolyLine({
  lineDash: [4, 8],
  lineDashFlow: true,
  lineDashFlowSpeed: 60,       // 每秒流动像素数（px/s），越大越快
  style: { strokeStyle: '#0c8f09', lineWidth: 3 },
});

// 水管壁（蚂蚁线外层套细实线边界，像「管子里流水」）
new ICEPolyLine({
  lineDash: [4, 8], lineDashFlow: true,
  lineBorder: true,            // 开水管壁
  lineBorderWidth: 1,          // 边界厚度（lineWidth 两侧各加）
  lineBorderColor: '#444',
  style: { strokeStyle: '#0c8f09', lineWidth: 3 },
});
```

流动蚂蚁线只需 `lineDash` + `lineDashFlow: true`，引擎内部的动画管理器会自动每帧重绘——**无需手写 `setInterval` + `lineDashOffset`**。下面这条线段是真实流动效果（不是截图）：

<IceCanvas
  height={200}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    ice.addChild(new ICEPolyLine({
      points: [[20, 100], [700, 100]],
      lineWidth: 5, stroke: true,
      lineDash: [15, 5], lineDashFlow: true, lineDashFlowSpeed: 60,
      style: { strokeStyle: '#2563eb', lineWidth: 5 },
    }));
  }}
/>

```jsx title="流动蚂蚁线" {3-5}
// lineDash 定义虚线段，lineDashFlow 开启自动流动
lineDash: [15, 5],
lineDashFlow: true,
lineDashFlowSpeed: 60, // 像素/秒
```

### 渐变

ice-render 把渐变做成**可序列化**的声明式对象 `fillGradient`，坐标是**组件本地坐标**（左上角为 `(0,0)`）。下面这条矩形是真实渲染的线性渐变：

<IceCanvas
  height={160}
  setup={(ICE, ice) => {
    const { ICERect } = ICE;
    ice.addChild(new ICERect({
      left: 60, top: 40, width: 320, height: 60, fill: true,
      style: {
        fillGradient: {
          type: 'linear', from: [0, 0], to: [320, 0],
          stops: [[0, 'red'], [0.5, 'yellow'], [1, 'green']],
        },
      },
    }));
  }}
/>

```jsx title="声明式线性渐变" {3-9}
// type: 'linear' | 'radial' | 'conic'；from/to 为组件本地坐标
style: {
  fillGradient: {
    type: 'linear', from: [0, 0], to: [320, 0],
    stops: [[0, 'red'], [0.5, 'yellow'], [1, 'green']],
  },
}
```

也支持 `radial`（含 `center` / `radius`）与 `conic`（含 `startAngle`）——`strokeGradient` 同样适用，用于描边渐变。

复杂场景也可用命令式 `createLinearGradient` 拿到原生渐变对象再塞进 `style.fillStyle`：

```js
const g = ice.createLinearGradient(0, 0, 100, 0);
g.addColorStop(0, '#e24b4a');
g.addColorStop(1, '#7f77dd');
new ICERect({ style: { fillStyle: g } });
```

### 图片

ice-render 用 `ICEImage` 组件直接承载位图，`src` 接受普通 URL 或 data URL（下面用内联 SVG 作 demo）：

<IceCanvas
  height={220}
  setup={(ICE, ice) => {
    const { ICEImage } = ICE;
    const svg =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
        '<rect width="64" height="64" fill="#4f8cff"/>' +
        '<circle cx="32" cy="32" r="20" fill="#ffffff"/></svg>'
      );
    ice.addChild(new ICEImage({ left: 300, top: 30, width: 160, height: 160, src: svg }));
  }}
/>

```jsx title="图片组件" {1-7}
const { ICEImage } = ICE;
ice.addChild(new ICEImage({
  left: 300, top: 30, width: 160, height: 160,
  src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg ...>...</svg>'),
}));
```

图案平铺可在业务层用多个 `ICEImage` 平铺实现；`ICEImage` 还支持 `clipType:'circle'` 圆形裁剪与雪碧图裁剪（`sx/sy/sw/sh`）。

### 圆角

```js
new ICERect({ radius: 12, style: { fillStyle: '#fff' } });
```

## 三、主题机制：三层 token + 命名主题

主题机制对齐 **design tokens 三层标准**（base → semantic → component）与 **ECharts 命名主题**（`registerTheme` + 按名 `setTheme`）。

### 三层 token

| 层 | 含义 | 例子 |
|---|---|---|
| **base（基础）** | 原始值，无语义：色 ramp / spacing / radius / font | `baseTokens.color.blue[600]`、`baseTokens.radius.lg` |
| **semantic（语义）** | 用途：primary / danger / text / border / palette / motion | `primary: '#0D6EFD'`、`palette: [FAMILY_PALETTE...]` |
| **component（组件）** | 变体：card / button / title … | `STYLE_PRESETS.card` |

```js
import { baseTokens, DEFAULT_THEME, DARK_THEME } from 'ice-render';

baseTokens.color.blue[600];          // '#2563EB'（原始色料，global token）
DEFAULT_THEME.semantic.primary;      // '#0D6EFD'（家族品牌基线 Bootstrap 5，alias token）
DEFAULT_THEME.semantic.palette;      // 8 色数据系列配色（= FAMILY_PALETTE，与 ice-chart 共用）
DEFAULT_THEME.semantic.motion;       // { duration, easing }
```

> **base 与 semantic 的分工**：`base.color` 只放"原始色料"（Tailwind 风格 ramp），
> **品牌决策落在 semantic（alias token）上** —— 2026-09-14 起家族基线是 Bootstrap 5，
> 但 `base.color.blue[600]` 仍是它原来的 Tailwind 值，两者不是同一条引用链，
> 也不要靠"把两家 token 合并成一种词汇"来替代品牌决策。

### 组件预设（preset）

组件用 `preset` 引用语义层预设，避免手写样式：

```js
new ICERect({ preset: 'card' });     // 白底 + 细边框 + 圆角 12 + 阴影 md
new ICERect({ preset: 'button' });   // primary 色 + 圆角 8 + 阴影 sm
new ICEText({ preset: 'title' });    // fontSize 24 + bold + text 色

// 内置预设：card / panel / button / button-danger / title / subtitle / body / label
```

### 优先级链

样式合并优先级（用户值最高）：

```
用户 props > 组件 preset > 语义 theme > 基础 default
```

```js
new ICERect({ preset: 'button', style: { fillStyle: 'red' } }); // red 覆盖 preset 的 primary
```

### 命名主题 + 热切换

```js
// 注册命名主题（运行时注入，如多品牌 / 多租户）
ice.registerTheme('brand', {
  base: baseTokens,
  semantic: { ...DEFAULT_THEME.semantic, primary: '#ff6600' },
});

// 切换（string 按名 / object 浅合并 semantic）
ice.setTheme('dark');                 // 切换到内置暗色主题
ice.setTheme('brand');                // 切换到自定义主题
ice.setTheme({ primary: '#ff0000' }); // 浅合并（兼容旧用法）
ice.setTheme('default');              // 复位

// 读主题
ice.getTheme().semantic.primary;      // 当前主题主色
ice.getTheme().semantic.palette[0];   // 数据系列配色
```

热切换：`setTheme` 后，已渲染的、用了 `preset` 的组件会**重新 resolve**（用户显式传的样式优先；
带 `'$token'` 引用的样式在**绘制那一刻**解析，所以自定义组件也跟着变）。
内置 `DEFAULT_THEME`（亮色，语义色 = Bootstrap 5 基线）与 `DARK_THEME`
（Bootstrap 5.3 深色变体：`#212529` 底 + `#dee2e6` 正文，彩色用亮一档的变体，数据系列用 `FAMILY_PALETTE_DARK`）。

### motion token 与动画打通

动画配置支持 motion 语义名，`duration` / `easing` 走主题：

```js
card.props.animations = {
  left: { from: 0, to: 100, duration: 'normal', easing: 'out' },
};
```

| 字段 | 语义名 | 实际值（默认主题） |
|---|---|---|
| `duration` | `fast` / `normal` / `slow` / `slower` | 100 / 200 / 300 / 500 ms |
| `easing` | `linear` / `out` / `inOut` / `outQuart` | `linear` / `easeOutCubic` / `easeInOutCubic` / `easeOutQuart` |

数字 `duration` 或已存在的 Easing 方法名原样保留（向后兼容）。

## 四、完整示例

```js
const ice = new ICE.ICE().init('canvas-1');

// 用 palette 给数据系列配色
const palette = ice.getTheme().semantic.palette;
palette.forEach((color, i) => {
  ice.addChild(new ICE.ICERect({
    left: 40 + i * 100, top: 50, width: 72, height: 60 + i * 18,
    style: { fillStyle: color },
  }));
});

// 卡片 + 标题（preset，主题切换自动跟随）
const card = new ICE.ICEGroup({ left: 40, top: 250, width: 320, height: 130 });
card.addChild(new ICE.ICERect({ preset: 'card', left: 0, top: 0, width: 320, height: 130 }));
card.addChild(new ICE.ICEText({
  left: 0, top: 20, width: 320, height: 40, text: '主题卡片', preset: 'title',
  style: { textAlign: 'center', textBaseline: 'middle' },
}));
ice.addChild(card);

// 切换主题
ice.setTheme('dark');   // 卡片背景/文字/按钮颜色跟着变
```

完整可运行示例见 `examples/theme/theme.html`。
