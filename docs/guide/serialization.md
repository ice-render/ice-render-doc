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

每个组件类型有稳定的 typeId。**自定义组件必须先注册才能被序列化还原**：

```js
class Relation extends ICE.ICEVisioLink {
  static className = 'Relation';
  toEntityObject() { /* ... */ }
}
ice.registerType('Relation', Relation);

const id = ice.getTypeId(Relation);   // 取稳定 typeId
const Clazz = ice.getType('Relation'); // 按 className 反查构造器
```

还原时遇到未注册的类型不会让整份失败——未识别类型会记录在 `Deserializer.unknownTypes` 中，方便上层提示。

## 版本迁移

`SERIALIZATION_MIGRATIONS` 是一张升序执行的迁移表，每条迁移 `{ to, run }` 描述「升级到版本 to 时执行的数据变换」。旧版本数据会自动依次应用迁移到达当前版本。

## 哪些内容参与序列化

- 场景树结构与组件 props（含声明式渐变 `fillGradient` / `strokeGradient`）
- `id`——建议为需要业务定位的组件显式设置 `id`，配合 `ice.findComponent(id)` 递归查找
- 工具层（`ice.addTool` 添加的辅助 UI）**不参与**序列化

## 实践建议

1. 自定义组件统一在一个模块里 `registerType`，在应用启动时完成注册
2. 存档时同时保存业务元数据（如 schema 版本号）与 `ice.toJSONString()`
3. 还原前 `clearAll()` 清空现有场景，避免残留
