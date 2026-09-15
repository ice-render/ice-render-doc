import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef, useState } from 'react';
import useAssetResolver from '../utils/assetUrl';

/**
 * ERNodePlayground —— 「Entity 领域图元 · 可复制 ER 节点骨架」实时演示。
 *
 * 内联一个忠实复刻 ice-entity-designer/src/er-component/Entity.ts 的自定义图元
 * `EREntityNode extends ICE.ICEGroup`：表头 + 字段列表（PK/FK/UQ/AI/NN 标记），
 * 自带 toEntityObject() 与 clone()；序列化逻辑移植自 ice-entity-designer/src/utils/serialization_util.ts
 * 的 TYPE_MAP / normalizeColumn / toSchemaObject，输出符合 `new EntitySchema(obj)` 的普通对象。
 *
 * 本组件只在浏览器端渲染（BrowserOnly 包裹），不依赖任何服务端。
 */

// ---- 与 ice-entity-designer 保持一致的 TypeORM 列类型映射 ----
const TYPE_MAP = {
  number: 'int', int: 'int', integer: 'int', smallint: 'smallint', bigint: 'bigint',
  float: 'float', double: 'double', real: 'real', decimal: 'decimal', numeric: 'numeric',
  string: 'varchar', varchar: 'varchar', char: 'char', text: 'text',
  boolean: 'boolean', bool: 'boolean', date: 'date', datetime: 'datetime',
  timestamp: 'timestamp', time: 'time', json: 'json', jsonb: 'jsonb',
  uuid: 'uuid', enum: 'enum', blob: 'blob', binary: 'blob',
  'simple-array': 'simple-array', 'simple-json': 'simple-json',
};
const LENGTH_TYPES = ['varchar', 'char', 'nvarchar', 'nchar', 'text', 'uuid'];

function mapColumnType(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const key = String(raw).toLowerCase();
  return TYPE_MAP[key] || String(raw);
}

function normalizeColumn(field) {
  const column = {};
  const type = mapColumnType(field.type);
  if (type !== undefined) column.type = type;
  if (field.length !== undefined && field.length !== null && field.length !== '') {
    const raw = String(field.length).trim();
    if (type === 'decimal' || type === 'numeric') {
      const [precision, scale] = raw.split(',').map((p) => p.trim());
      if (precision) column.precision = Number(precision);
      if (scale) column.scale = Number(scale);
    } else if (type && LENGTH_TYPES.indexOf(type) >= 0) {
      column.length = field.length;
    }
  }
  if (field.primary) column.primary = true;
  if (field.generated) column.generated = true;
  if (field.autoIncrement) { column.generated = true; column.strategy = 'increment'; }
  if (field.strategy !== undefined) column.strategy = field.strategy;
  if (field.nullable === false) column.nullable = false;
  if (field.unique) column.unique = true;
  if (field.default !== undefined) column.default = field.default;
  if (field.comment !== undefined) column.comment = field.comment;
  if (field.index) column.index = true;
  return column;
}

function toSchemaObject(nodes) {
  return nodes
    .filter((n) => n && typeof n.toEntityObject === 'function')
    .map((n) => {
      const obj = n.toEntityObject();
      const cols = {};
      Object.keys(obj.columns || {}).forEach((name) => {
        cols[name] = normalizeColumn(obj.columns[name]);
      });
      return { name: obj.name, columns: cols };
    });
}

function isNil(v) { return v === null || v === undefined; }

function mergeDeep(target, ...sources) {
  for (const s of sources) {
    if (!s) continue;
    for (const k of Object.keys(s)) {
      const sv = s[k];
      if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
        if (isNil(target[k]) || typeof target[k] !== 'object' || Array.isArray(target[k])) target[k] = {};
        mergeDeep(target[k], sv);
      } else {
        target[k] = sv;
      }
    }
  }
  return target;
}

function ensureIce(src) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.ICE) return Promise.resolve(window.ICE);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(window.ICE);
    s.onerror = () => reject(new Error(`${src} 加载失败`));
    document.head.appendChild(s);
  });
}

function ERNodePlaygroundInner() {
  const canvasRef = useRef(null);
  const iceRef = useRef(null);
  const resolveAsset = useAssetResolver();
  const nodesRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(0);
  const [schema, setSchema] = useState('[]');
  const [nodeNames, setNodeNames] = useState([]);
  const [status, setStatus] = useState('');

  // 计算并刷新 TypeORM Schema 面板
  const refreshSchema = () => {
    try {
      const obj = toSchemaObject(nodesRef.current);
      setSchema(JSON.stringify(obj, null, 2));
      setNodeNames(obj.map((e) => e.name));
      setStatus('');
    } catch (e) {
      setStatus('序列化出错：' + e.message);
    }
  };

  const markDirty = () => {
    const ice = iceRef.current;
    if (ice && ice.dirty !== undefined) ice.dirty = true;
  };

  useEffect(() => {
    let cancelled = false;
    let ice = null;

    ensureIce(resolveAsset('/ice-render.js'))
      .then((ICE) => {
        if (cancelled || !canvasRef.current || !ICE) return;

        // ---- 复刻 ice-entity-designer 的 Entity 领域图元 ----
        class EREntityNode extends ICE.ICEGroup {
          constructor(props) {
            const param = mergeDeep(
              {
                entityName: 'Entity Name',
                fields: [],
                width: 250,
                style: { strokeStyle: '#334155', fillStyle: '#ffffff', radius: 8, lineWidth: 1.5 },
                headerStyle: {
                  textColor: '#0f172a', backgroundColor: '#f1f5f9', fontSize: 18,
                  fontWeight: 'bold', paddingTop: 12, paddingLeft: 14, paddingRight: 14, paddingBottom: 12,
                },
                fieldStyle: {
                  textColor: '#334155', fontSize: 16, fontWeight: 'normal',
                  paddingTop: 9, paddingLeft: 14, paddingRight: 14,
                },
                dividerStyle: { strokeStyle: '#cbd5e1', fillStyle: '#cbd5e1', lineWidth: 1 },
              },
              props,
              { transformable: false }
            );
            super(param);
            // 子组件引用必须在 super() 之后、syncEntityNameAndFields() 之前初始化（JS 类规则：super 前不能访问 this）
            this.entityFieldsComponent = [];
            this.entityNameComponent = null;
            this.headerBackgroundComponent = null;
            this.deviderLine = null;
            this.syncEntityNameAndFields();
          }

          syncEntityNameAndFields() {
            const S = this.state;
            // 防御：entityFieldsComponent 未初始化时先置空数组（否则下方 .push 会崩）
            if (!Array.isArray(this.entityFieldsComponent)) this.entityFieldsComponent = [];
            if (this.entityNameComponent) { this.removeChild(this.entityNameComponent); this.entityNameComponent = null; }
            if (this.headerBackgroundComponent) { this.removeChild(this.headerBackgroundComponent); this.headerBackgroundComponent = null; }
            if (this.deviderLine) { this.removeChild(this.deviderLine); this.deviderLine = null; }
            if (this.entityFieldsComponent && this.entityFieldsComponent.length) {
              this.removeChildren(this.entityFieldsComponent);
              this.entityFieldsComponent.length = 0;
            }

            if (S.entityName) {
              this.entityNameComponent = new ICE.ICEText({
                left: 0, top: 0, text: S.entityName,
                style: {
                  strokeStyle: S.headerStyle.textColor, fillStyle: S.headerStyle.textColor,
                  fontSize: S.headerStyle.fontSize, fontWeight: S.headerStyle.fontWeight,
                  paddingTop: S.headerStyle.paddingTop, paddingLeft: S.headerStyle.paddingLeft,
                  paddingRight: S.headerStyle.paddingRight, paddingBottom: S.headerStyle.paddingBottom,
                },
                interactive: false, stroke: false, showMinBoundingBox: false, showMaxBoundingBox: false,
              });
              if (S.headerStyle.backgroundColor && S.headerStyle.backgroundColor !== 'none') {
                const lineWidth = S.style.lineWidth || 1.5;
                const inset = lineWidth / 2;
                this.headerBackgroundComponent = new ICE.ICERect({
                  left: inset, top: inset,
                  width: Math.max(S.width - lineWidth, 0),
                  height: Math.max(this.entityNameComponent.state.height - inset, 0),
                  zIndex: this.entityNameComponent.state.zIndex - 1, origin: 'top-left',
                  style: { fillStyle: S.headerStyle.backgroundColor, radius: Math.max((S.style.radius || 0) - inset, 0), lineWidth: 0 },
                  interactive: false, stroke: false, showMinBoundingBox: false, showMaxBoundingBox: false,
                });
                this.addChild(this.headerBackgroundComponent);
              }
              this.addChild(this.entityNameComponent);

              this.deviderLine = new ICE.ICEPolyLine({
                left: 0, top: 0, points: [[0, 0], [S.width, 0]],
                style: { strokeStyle: S.dividerStyle.strokeStyle, fillStyle: S.dividerStyle.fillStyle, lineWidth: S.dividerStyle.lineWidth },
                interactive: false,
              });
              this.addChild(this.deviderLine);
            }

            if (!isNil(S.fields)) {
              const len = S.fields.length;
              for (let i = 0; i < len; i++) {
                const field = S.fields[i];
                const display = this.fieldDisplay(field);
                const text = new ICE.ICEText({
                  left: 0, top: 0, text: display.text,
                  style: {
                    strokeStyle: S.fieldStyle.textColor, fillStyle: S.fieldStyle.textColor,
                    fontSize: S.fieldStyle.fontSize, fontWeight: S.fieldStyle.fontWeight,
                    paddingTop: S.fieldStyle.paddingTop, paddingLeft: S.fieldStyle.paddingLeft,
                    paddingRight: S.fieldStyle.paddingRight, paddingBottom: i === len - 1 ? 12 : 0,
                  },
                  interactive: false, stroke: false, showMinBoundingBox: false, showMaxBoundingBox: false,
                });
                this.entityFieldsComponent.push(text);
              }
              this.addChildren(this.entityFieldsComponent);
            }
          }

          fieldDisplay(field) {
            const keyTags = [];
            if (field.primary) keyTags.push('PK');
            if (field.foreignKey) keyTags.push('FK');
            const constraintTags = [];
            if (field.unique) constraintTags.push('UQ');
            if (field.autoIncrement) constraintTags.push('AI');
            if (field.nullable === false) constraintTags.push('NN');
            const keyText = keyTags.length ? `${keyTags.join(' ')} ` : '';
            const typeText = field.type ? `${field.type}${field.length ? `(${field.length})` : ''}` : '';
            const constraintText = constraintTags.length ? `  ${constraintTags.join(' ')}` : '';
            const defaultText = field.default !== undefined ? `  = ${field.default}` : '';
            const commentText = field.comment ? `  // ${field.comment}` : '';
            return { text: `${keyText}${field.name}${typeText ? `  ${typeText}` : ''}${constraintText}${defaultText}${commentText}` };
          }

          calcComponentParams() {
            let maxWidth = this.state.width;
            let lastY = 0;
            let deviderLineY = 0;
            let headerHeight = 0;
            if (this.entityNameComponent) {
              headerHeight = this.entityNameComponent.state.height;
              lastY = headerHeight;
              maxWidth = Math.max(maxWidth, this.entityNameComponent.state.width);
              lastY += this.deviderLine.state.height;
              deviderLineY = lastY;
            }
            for (let i = 0; i < this.entityFieldsComponent.length; i++) {
              const fc = this.entityFieldsComponent[i];
              fc.state.left = 0;
              fc.state.top = lastY;
              lastY += fc.state.height;
              maxWidth = Math.max(maxWidth, fc.state.width);
            }
            if (this.deviderLine) {
              this.deviderLine.state.points = [[0, deviderLineY], [maxWidth, deviderLineY]];
            }
            if (this.headerBackgroundComponent) {
              const lineWidth = this.state.style.lineWidth || 1.5;
              const inset = lineWidth / 2;
              this.headerBackgroundComponent.state.left = inset;
              this.headerBackgroundComponent.state.top = inset;
              this.headerBackgroundComponent.state.width = Math.max(maxWidth - lineWidth, 0);
              this.headerBackgroundComponent.state.height = Math.max(headerHeight - inset, 0);
            }
            const width = maxWidth;
            const height = Math.max(lastY, this.state.height);
            this.state.width = width;
            this.state.height = height;
            return { width, height };
          }

          toEntityObject() {
            const result = { name: this.state.entityName, columns: {} };
            (this.state.fields || []).forEach((field) => {
              const column = {};
              if (field.type !== undefined) column.type = field.type;
              if (field.length !== undefined) column.length = field.length;
              if (field.primary) column.primary = true;
              if (field.generated) column.generated = true;
              if (field.autoIncrement) { column.generated = true; column.strategy = 'increment'; }
              if (field.nullable === false) column.nullable = false;
              if (field.unique) column.unique = true;
              if (field.default !== undefined) column.default = field.default;
              if (field.comment !== undefined) column.comment = field.comment;
              if (field.index) column.index = true;
              result.columns[field.name] = column;
            });
            return result;
          }

          setState(newState) {
            const needSync = !isNil(newState.fields) || !isNil(newState.entityName);
            super.setState(newState);
            if (needSync) this.syncEntityNameAndFields();
          }

          addField(field) { this.setFields([...(this.state.fields || []), field]); return this; }
          removeField(name) { this.setFields((this.state.fields || []).filter((f) => f.name !== name)); return this; }
          setFields(fields) { this.setState({ fields }); return this; }

          clone(opts) {
            const dx = (opts && opts.dx) || 0;
            const dy = (opts && opts.dy) || 0;
            const fields = (this.state.fields || []).map((f) => ({ ...f }));
            return new EREntityNode({
              left: (this.state.left || 0) + dx,
              top: (this.state.top || 0) + dy,
              entityName: (this.state.entityName || 'Entity') + '_copy',
              fields,
            });
          }
        }

        ice = new ICE.ICE();
        ice.init(canvasRef.current);
        iceRef.current = ice;

        const sampleUser = new EREntityNode({
          left: 40, top: 30,
          entityName: 'User',
          fields: [
            { name: 'id', type: 'number', primary: true, generated: true, autoIncrement: true },
            { name: 'username', type: 'string', length: 64, nullable: false, unique: true, comment: '登录名' },
            { name: 'email', type: 'string', length: 128, nullable: false, unique: true },
            { name: 'age', type: 'number', nullable: true },
            { name: 'createdAt', type: 'datetime', nullable: false },
          ],
        });
        ice.addChild(sampleUser);
        nodesRef.current = [sampleUser];
        setSelected(0);
        markDirty();
        setReady(true);
        refreshSchema();
      })
      .catch((e) => { console.error('[ERNodePlayground]', e); setStatus('加载内核失败：' + (e && e.message)); });

    return () => {
      cancelled = true;
      if (ice && typeof ice.destroy === 'function') {
        try { ice.destroy(); } catch (e) { /* noop */ }
      }
      iceRef.current = null;
      nodesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClone = () => {
    const ice = iceRef.current;
    const list = nodesRef.current;
    if (!ice || !list.length) return;
    const idx = Math.min(selected, list.length - 1);
    const count = list.length;
    const dx = 40 + (count % 2) * 290;
    const dy = 30 + Math.floor(count / 2) * 250;
    const copy = list[idx].clone({ dx, dy });
    ice.addChild(copy);
    list.push(copy);
    setSelected(list.length - 1);
    markDirty();
    refreshSchema();
    setStatus(`已复制「${list[idx].state.entityName}」→「${copy.state.entityName}」`);
  };

  const handleAddField = () => {
    const list = nodesRef.current;
    if (!list.length) return;
    const idx = Math.min(selected, list.length - 1);
    const node = list[idx];
    const n = (node.state.fields || []).length + 1;
    node.addField({ name: `field_${n}`, type: 'string', length: 64, nullable: true, comment: '新增字段' });
    markDirty();
    refreshSchema();
    setStatus(`已向「${node.state.entityName}」追加字段 field_${n}`);
  };

  const handleRemoveField = () => {
    const list = nodesRef.current;
    if (!list.length) return;
    const idx = Math.min(selected, list.length - 1);
    const node = list[idx];
    const fields = node.state.fields || [];
    if (!fields.length) { setStatus('没有可删除的字段'); return; }
    const last = fields[fields.length - 1];
    node.removeField(last.name);
    markDirty();
    refreshSchema();
    setStatus(`已从「${node.state.entityName}」删除字段 ${last.name}`);
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, opacity: 0.8 }}>操作对象：</span>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          disabled={!ready || nodeNames.length === 0}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--ifm-color-emphasis-300)' }}
        >
          {nodeNames.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <button className="button button--secondary button--sm" onClick={handleClone} disabled={!ready}>复制节点</button>
        <button className="button button--secondary button--sm" onClick={handleAddField} disabled={!ready}>＋ 字段</button>
        <button className="button button--secondary button--sm" onClick={handleRemoveField} disabled={!ready}>－ 字段</button>
      </div>

      <canvas
        ref={canvasRef}
        width={760}
        height={480}
        style={{
          width: '100%', height: 'auto', maxWidth: 760, background: '#ffffff',
          border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, display: 'block',
        }}
      />

      <p style={{ fontSize: 13, opacity: 0.75, margin: '8px 0 0' }}>
        {status || (ready ? '提示：点「复制节点」会按字段列表深拷贝出一个 _copy 骨架；左侧选择框切换操作对象。' : '正在加载内核…')}
      </p>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>TypeORM Schema（实时序列化）</div>
        <pre
          style={{
            background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: 8, padding: '12px 14px', fontSize: 12.5, lineHeight: 1.5, overflowX: 'auto', margin: 0,
          }}
        >
          <code>{schema}</code>
        </pre>
      </div>
    </div>
  );
}

export default function ERNodePlayground(props) {
  return <BrowserOnly>{() => <ERNodePlaygroundInner {...props} />}</BrowserOnly>;
}
