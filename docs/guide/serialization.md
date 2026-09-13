---
sidebar_position: 10
---

# 序列化

场景树可以完整导出为 JSON 并还原，序列化格式带版本号与迁移机制。

## 导出与还原

```js
const str = ice.toJSONString();   // 导出 JSON 字符串
const obj = ice.toJSONObject();   // 导出 JSON 对象

ice.fromJSONString(str);          // 从字符串还原
ice.fromJSONObject(obj);          // 从对象还原
```

序列化格式带 `version` 字段（当前 `SERIALIZATION_VERSION = 1`）。

## 稳定 typeId 与自定义组件

每个组件类型有稳定的 typeId，格式是 **`namespace:Type`**：namespace 用你自己的小写包名
（引擎内置是 `ice-render`，ICE 家族其它包用 `ice-entity-designer`、`ice-chart`…），
Type 用类名式的标识。**自定义组件必须先注册才能被序列化还原**：

```js
class Relation extends ICE.ICEVisioLink {
  static typeId = 'my-app:Relation';   // canonical typeId：namespace:Type
  toEntityObject() { /* ... */ }
}

ice.registerType('my-app:Relation', Relation);   // 必须在反序列化之前调用

const id = ice.getTypeId(Relation);      // 'my-app:Relation'（写出时用的就是它）
const Clazz = ice.getType('my-app:Relation'); // 按 typeId 反查构造函数
```

注册表的冲突规则是**明确抛错**，不会静默覆盖：

| 情况 | 结果 |
|---|---|
| 同一个 typeId + 同一个构造函数 | 幂等，不抛错 |
| 同一个 typeId + 不同构造函数 | **抛错** |
| 同一个构造函数 + 第二个 typeId | **抛错**（否则 `getTypeId()` 反查会歧义） |

内置类型的 typeId 形如 `ice-render:Rect`、`ice-render:Group`，已经注册好。类型名**只有 canonical
一种形式**：`ICERect` 之类无 namespace 的旧类名**不再被识别** —— 家族仍在发布初期（引用者少），
引擎不为旧名保留兼容路径。

还原时遇到未注册的类型不会让整份失败——未识别类型会记录在 `Deserializer.unknownTypes` 中，
方便上层提示。反向的坑也要防：**序列化**时若写了未注册的类型，引擎会回退写类名并记录到
`Serializer.unregisteredTypes`（类名可能在打包时被 mangle，写出去的数据下次未必读得回来），
所以自定义组件一定要先注册。

## 版本迁移

`SERIALIZATION_MIGRATIONS` 是一张升序执行的迁移表，每条迁移 `{ to, run }` 描述「升级到版本 to 时执行的数据变换」。旧版本数据会自动依次应用迁移到达当前版本。

## 哪些内容参与序列化

- 场景树结构与组件 props（含声明式渐变 `fillGradient` / `strokeGradient`）
- `id`——建议为需要业务定位的组件显式设置 `id`，配合 `ice.findComponent(id)` 递归查找
- 工具层（`ice.addTool` 添加的辅助 UI）**不参与**序列化

## 实践建议

1. 自定义组件统一在一个模块里 `registerType`，在应用启动时完成注册（typeId 用你自己的 namespace）
2. 存档时同时保存业务元数据（如 schema 版本号）与 `ice.toJSONString()`
3. 还原前 `clearAll()` 清空现有场景，避免残留
