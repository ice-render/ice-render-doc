---
sidebar_position: 8
---

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

> 注意：`measureText` 只覆盖「用户没显式传」的 `width` / `height`（默认 `10` 作哨兵值）。若传了 `width`，居中逻辑依赖它计算 `localOrigin`，不会被 div 量测值覆盖。

### 阴影简写

`shadow: 'sm' | 'md' | 'lg'` 一行展开成 4 个 canvas 属性：

```js
new ICERect({ style: { fillStyle: '#fff', shadow: 'md' } });
// → shadowColor: rgba(0,0,0,0.18), shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 3
```

### 虚线 / 蚂蚁线 / 水管壁

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

### 渐变

```js
const g = ice.createLinearGradient(0, 0, 100, 0);
g.addColorStop(0, '#e24b4a');
g.addColorStop(1, '#7f77dd');
new ICERect({ style: { fillStyle: g } });
```

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
| **semantic（语义）** | 用途：primary / danger / text / border / palette / motion | `primary: blue[600]`、`palette: [blue600, green600, ...]` |
| **component（组件）** | 变体：card / button / title … | `STYLE_PRESETS.card` |

```js
import { baseTokens, DEFAULT_THEME, DARK_THEME } from 'ice-render';

baseTokens.color.blue[600];          // '#185FA5'
DEFAULT_THEME.semantic.primary;      // '#185FA5'（引用 base）
DEFAULT_THEME.semantic.palette;      // 8 色数据系列配色
DEFAULT_THEME.semantic.motion;       // { duration, easing }
```

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

热切换：`setTheme` 后，已渲染的、用了 `preset` 的组件会**重新 resolve**（用户显式传的样式优先）。内置 `DEFAULT_THEME`（亮色）与 `DARK_THEME`（暗色，彩色用 400 level 更亮、文字/边/背景反转）。

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
