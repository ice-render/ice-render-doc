---
sidebar_position: 4
description: "ICE Render 文本：文本测量、自动换行、对齐与富文本，在 Canvas 上渲染可控的高质量文字。"
keywords:
  - "文本渲染"
  - "自动换行"
  - "文本测量"
  - "富文本"
  - "Canvas 文字"
---
# 文本

`ICEText` 负责文本渲染，支持自动换行、省略号、行数限制与编辑态。

## 基础

```js
const text = new ICE.ICEText({
  text: 'Hello, ICERender!',
  left: 100,
  top: 100,
  width: 300,          // wrap 生效时的换行宽度
  style: {
    fontSize: 20,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fillStyle: '#37474f',
    textBaseline: 'top',
    paddingTop: 4,
    paddingRight: 4,
  },
});
```

## 自动换行

```js
new ICE.ICEText({
  text: '一段较长的文本……',
  width: 200,
  wrap: true,     // 按 width 自动换行
  maxLines: 3,    // 最多 3 行，0 表示不限
  ellipsis: '…',  // 超出 maxLines 时追加省略号
  wordBreak: 'normal', // 断行策略：normal（默认，词边界 + CJK 逐字断 + 禁则）/ break-all（逐字硬断）
  direction: 'auto',   // 文字方向：'ltr' | 'rtl' | 'auto'（按首个强方向字符判定）
});
```

- `wrap`（默认 `false`）：开启后按 `width` 自动换行（按 **grapheme cluster** 切分，`Intl.Segmenter` 优先，对 emoji 友好）
- `wordBreak`（默认 `'normal'`）：`'normal'` 优先在**词边界**断行 —— 拉丁词不会被硬拆、CJK 逐字断并做**禁则**
  （行首不放 `、。」` 这类闭标点、行尾不放 `（「` 这类开标点），单个词整行放不下时才硬拆；
  `'break-all'` 回到逐字贪心（代码、艺术字这类需要等宽硬断的场景）
- `maxLines`（默认 `0`）：行数上限，超出部分截断
- `ellipsis`（默认 `'…'`）：截断时追加的省略号文本，传空串可关闭

## 行高 / 字间距 / 装饰线

三项都是**正式排版属性**：量测（盒子宽高）、换行、渲染、SVG 导出共用同一口径。

```js
new ICE.ICEText({
  text: '第一行\n第二行',
  style: {
    fontSize: 20,
    lineHeight: 32,              // 数字 = px；'2' = 倍数、'1.5em' / '150%' 也行；0 / 'normal' = 引擎默认
    letterSpacing: 2,            // 数字 = px；'0.2em' / '20%' 相对字号；盒子宽度会含这个间距
    textDecoration: 'underline', // 'none' | 'underline' | 'line-through' | 'overline'（可空格组合）
    textDecorationColor: '',     // 留空跟随 fillStyle
    textDecorationWidth: 0,      // 0 = 自动（字号 / 14）
  },
});
```

- `lineHeight`：不配时行高 = `max(字形墨迹高, 字号 × 1.35)`（保持既有观感）；**显式配置后单行也按它算盒高**，
  盒子高度因此可预测。
- `letterSpacing`：引擎在量测前把它写进 `ctx.letterSpacing`（canvas 的 `measureText` 会把间距算进宽度，
  含最后一个字符之后的间距），所以**盒子宽度 = 浏览器实际排版宽度**，换行与省略号也按含间距的宽度断；
  SVG 导出输出 `letter-spacing`。
- `textDecoration`：canvas 没有原生装饰线，由引擎按行自绘（下划线在基线下 `0.12em`，会略微溢出几何盒，
  脏矩形 / 离屏缓存的落墨盒已把它算进去）。SVG 导出输出 `text-decoration`。

## 文字方向（RTL / BiDi）

```js
new ICE.ICEText({
  text: 'שלום עולם',
  direction: 'auto',                 // 缺省即 auto：按首个强方向字符判定 ltr / rtl
  style: { textAlign: 'start' },     // start/end 是「阅读起点/终点」，rtl 下 start 在右
});
```

- `direction`：`'ltr' | 'rtl' | 'auto'`（默认 `'auto'`）。渲染时写入 canvas 的 `ctx.direction`
  （运行时没有该成员时自动跳过，退化为 LTR），并在渲染结束后归位；
- `textAlign`：除 `left / center / right` 外支持 `'start' | 'end'`，按方向映射成物理左右；
- SVG 导出同口径：输出 `direction="rtl"`，并按方向映射 `text-anchor`。

> **i18n 边界**：`text` 里的词条归应用层（用任意 i18n 库），引擎只负责断行、方向与输入法。
> 完整契约见 [17 · i18n 边界](../architecture/17-i18n-boundary.md)。

## 编辑态

> 尺寸与量测语义（自适应 / 显式尺寸 / 字体加载后重测）见下文「[尺寸与量测](#尺寸与量测)」。

`ICEText` 内置编辑能力：

```js
text.setState({ editing: true, caretIndex: 5 });
```

| prop | 说明 |
|---|---|
| `editing` | 是否处于编辑态 |
| `caretIndex` | 光标位置 |
| `multiline` | `true` 时编辑态改用 `<textarea>`：回车插入 `\n`，`Esc` / `Ctrl(⌘)+Enter` 提交 |
| `selectionStart` / `selectionEnd` | 选区（-1 = 没有选区）；无 DOM 运行时由引擎自绘（`style.selectionColor`） |

配合键盘事件可实现画布内文本编辑，参考 `examples/text/text-edit.html`；行高 / 字间距 / 装饰线 / 多行编辑 /
选区的完整演示见 `examples/text/text-advanced.html`。

### 选区与按字形命中

```js
text.selectAll();                 // 全选
text.setSelection(2, 5);          // [2,5)
console.log(text.getSelection()); // { start: 2, end: 5 }
text.clearSelection();

// 鼠标点击 → 光标下标：行带（按 textBaseline 与真实字形度量推导）+ grapheme 边界中点，RTL 反向量
const local = text.globalToLocal(globalX, globalY);
text.setSelection(text.getCaretIndexAt(local[0], local[1]));
```

- **多行编辑**（`multiline: true`，或文本里已经有 `\n`）：回车换行而不是提交，输入法（IME）由浏览器接管；
- **选区**：DOM 编辑态由浏览器的 input / textarea 自己画；无 DOM 运行时（小程序 / Node）由引擎自绘；
- **命中**：编辑态下 `containsLocalPoint` 按**文本行**判定（点在 padding、盒子空白处不算命中），
  非编辑态仍是整个盒子 —— 拖动、框选、双击进入编辑这些交互不受影响。

## 其他

- `ICEText` 默认 `transformable: false`（不显示变换手柄）
- 文本可以放进 `ICEGroup` 参与嵌套变换（见 `examples/text/text-in-group.html`）
- `paddingTop/Right` 等内边距影响排版盒
- 自定义字体用 `await ice.loadFont(family, source)` 预加载后再使用（加载完成会自动重测，见下节）

## 尺寸与量测

`ICEText` 的盒子尺寸按「**调用方是否显式给尺寸**」判定，不拿默认值当哨兵：

```js
new ICE.ICEText({ text: '自适应' });                    // 没给尺寸 → 量测后写回 state.width/height
new ICE.ICEText({ text: '固定', width: 200, height: 40 }); // 显式尺寸 → 量测不会覆盖它

const t = new ICE.ICEText({ text: '改尺寸' });
t.setState({ width: 200 });   // setState 给尺寸同样算「显式」，此后宽度不再被量测覆盖
```

- 量测优先用 **canvas 真实字形边界**，无 ctx 时退化到隐藏 `div`（`textContent`，不做 HTML 注入）；
  两者都不可用时（Node / 小程序首帧）先停在默认 `10×10`，首帧渲染时由 `calcComponentParams` 重算。
- **自定义字体加载完成后要重测**：`await ice.loadFont(family, source)` 的 promise resolve 时，引擎会自动
  重新量测已挂载的文本（`ice.remeasureTexts()`）；也可以手动调 `text.remeasureText()`（只标脏，
  真正的重算发生在下一帧渲染）。
