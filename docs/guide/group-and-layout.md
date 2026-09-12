---
sidebar_position: 5
---

# 分组与布局

`ICEGroup` 是容器组件，配合 **Swing 风格的布局管理器**（策略模式）可以像写 Java Swing 一样组织图元。

## ICEGroup

```js
const group = new ICE.ICEGroup({ left: 100, top: 100 });
group.addChild(new ICE.ICERect({ left: 0, top: 0, width: 120, height: 60 }));
ice.addChild(group);
```

- 可任意深度嵌套，子组件使用父级局部坐标
- 未显式设定布局的子 Group 会自动继承父 Group 的布局
- 设定布局后，**子组件的位置由布局接管**（自动 `transformable: false`）

## 布局管理器

通过 `ICEGroup.setLayout(manager)` 设定：

```js
import { ICEGroup, ICEGridLayout } from 'ice-render';

const group = new ICEGroup({ left: 50, top: 50, width: 600, height: 400 });
group.setLayout(new ICEGridLayout({ rows: 3, cols: 3, hGap: 10, vGap: 10 }));

for (let i = 0; i < 9; i++) {
  group.addChild(new ICE.ICERect({ width: 100, height: 60, style: { fillStyle: '#4dd0e1' } }));
}
```

内置 7 种布局，抽象基类为 `ICELayoutManager`：

| 布局 | 说明 |
|---|---|
| `ICEFlowLayout` | 流式布局，按方向依次排列、自动换行 |
| `ICEGridLayout` | 网格布局（rows/cols/hGap/vGap） |
| `ICEBorderLayout` | 东西南北中五区布局 |
| `ICEBoxLayout` | 盒式布局（水平/垂直单行） |
| `ICECardLayout` | 卡片布局，同一时刻只显示一个子组件 |
| `ICEOverlayLayout` | 叠加布局，子组件相互覆盖对齐 |
| `ICELayeredLayout` | 分层布局 |

各布局参数详见 `examples/layout/` 下的 13 个示例（border / box / card / dashboard / flow / grid / layered / overlay 等）。

## 布局反射（reflow）

子组件增删或尺寸变化后布局自动重排；`ICELayoutManager` 负责计算每个子组件的位置并写入，业务代码不需要手工摆放。参考示例 `examples/layout/layout-reflow.html`。

## 自定义布局

继承 `ICELayoutManager` 并实现排版逻辑即可挂入 `setLayout`——策略模式保证了布局算法与容器解耦。
