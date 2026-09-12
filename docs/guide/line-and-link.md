---
sidebar_position: 6
---

# 连线

ICERender 提供工程图级别的连接线能力：Visio 风格正交连线、贝塞尔曲线、折线、端点插槽吸附、箭头与蚂蚁线动画。

## ICEVisioLink（Visio 风格连线）

```js
const link = new ICE.ICEVisioLink({
  startPoint: [100, 100],
  endPoint: [300, 200],
  linkShape: 'visio',       // 'visio' | 'bezier'
  arrowStyle: 'filled',     // 'filled' | 'hollow'
  arrow: 'end',             // 箭头端点选择（如 'both'）
  escapeDistance: 30,       // 端点疏散距离
});
ice.addChild(link);
```

| prop | 默认值 | 说明 |
|---|---|---|
| `startPoint` / `endPoint` | `[0,0]` / `[10,10]` | 端点坐标 |
| `linkShape` | `'visio'` | 连线形状：Visio 正交 / 贝塞尔 |
| `arrowStyle` | `'filled'` | 箭头填充 / 空心 |
| `arrow` | — | 箭头出现在哪些端点（如 `'both'`） |
| `escapeDistance` | `30` | 从端点出发的疏散段长度 |

## ICEBezier / ICEPolyLine

- `ICEBezier`：贝塞尔曲线，`curveType` 支持 `cubic` / `quadratic`
- `ICEPolyLine`：折线；`__localBox()` 会把连线标签矩形并入包围盒

## 插槽吸附（LinkSlot / LinkHook）

`ICELinkSlot` 提供上/右/下/左/中心五个方向的吸附端点，`ICELinkHook` 是组件上的挂钩。把连线两端挂到 Hook 上后，拖动实体时连线自动跟随：

```js
const slot = new ICE.ICELinkSlot({ /* 五向吸附 */ });
```

由 `ice.linkSlotManager` 统一管理插槽的复用与碰撞检测。完整示例见 `examples/line-and-link/`（basic / curve / visio / link-label / link-set-links / marching-ants）。

## 连线标签

连线可以携带 label 文本，标签矩形会计入连线包围盒（拖拽命中、脏区计算都正确）。

## 蚂蚁线（marching ants）

所有连线（以及普通图元）支持虚线流动动画：

```js
new ICE.ICEVisioLink({
  lineDash: [6, 4],
  lineDashFlow: true,        // 开启流动
  lineDashFlowSpeed: 60,     // 速度（px/s）
});
```

## 水管壁效果

`lineBorder / lineBorderWidth / lineBorderColor` 可以为连线加一层外描边，形成「水管壁」效果：

```js
new ICE.ICEPolyLine({
  lineBorder: true,
  lineBorderWidth: 8,
  lineBorderColor: '#b0bec5',
});
```

## 扩展自定义连线

继承 `ICEVisioLink` 并实现 `toEntityObject()` 即可得到可序列化的业务连线（如 ER 关系线），完整示例见引擎 README「二次开发」一节。
