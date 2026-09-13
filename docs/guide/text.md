---
sidebar_position: 4
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

配合键盘事件可实现画布内文本编辑，参考 `examples/text/text-edit.html`。

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
