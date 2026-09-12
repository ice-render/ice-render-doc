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
});
```

- `wrap`（默认 `false`）：开启后按 `width` 自动换行，按 **grapheme cluster** 断行（`Intl.Segmenter` 优先），对中文、emoji 友好
- `maxLines`（默认 `0`）：行数上限，超出部分截断
- `ellipsis`（默认 `'…'`）：截断时追加的省略号文本，传空串可关闭

## 编辑态

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
- 自定义字体用 `await ice.loadFont(family, source)` 预加载后再使用
