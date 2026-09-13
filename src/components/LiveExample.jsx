import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef } from 'react';

/**
 * LiveExample —— 在文档页里**直接利用打包好的产物（UMD 运行时）把例子画出来**，
 * 而不是用 <iframe> 去加载一份独立的 example HTML。
 *
 * 做法（与仓库里 IceCanvas / DSLCanvas / ERNodePlayground 同一套内联渲染哲学）：
 *   1. 按顺序加载 examples 依赖的 UMD / vendor 脚本（ice-render、ice-web-components、
 *      ice-chart、ice-chart-dsl、ice-entity-designer 等），它们把全局名挂到 window；
 *   2. fetch 示例 HTML，把它的 <body> DOM（画布 / 面板）与 <style> 注入到文档里的容器；
 *   3. 把示例自带的 <style> 作用域隔离到 `.ice-example` 容器，避免污染整页样式；
 *   4. 移除已加载的 bundle <script src>，再执行示例的内联初始化脚本（它用 window.ICE / ICEWEB … 驱动绘制）。
 *
 * 这样例子仍由打包产物驱动、交互完全可用，但不再有 iframe 隔离、重复拉 UMD、与文档样式打架的问题。
 * 文档站纯前端，无服务端依赖；用 BrowserOnly 包裹确保只在浏览器端渲染（规避 SSR 访问 DOM）。
 */

const SCOPE = 'ice-example';

// 已知示例在 window 上挂的句柄，用于卸载时 best-effort 销毁 ICE 实例，避免 rAF 泄漏
const EXAMPLE_HANDLES = [
  '__pixel', '__arcade', '__xp', '__dos', '__algo', '__gallery',
  '__dashboard', '__dsl', '__ied', '__chart', '__charts', '__link',
];

// 每个 src 只加载一次；关键：**缓存的是加载完成的 Promise**，而非只看标签是否存在。
// 否则同一页多个 <LiveExample>（如 ice-web-components 的 6 个示例）会并发调用 loadScript——
// 第 2~N 个实例看到标签已创建就立刻 resolve、不等 onload，于是其内联脚本在 UMD 还没
// 设好 window.ICE / window.ICEWEB 时就执行，抛出 “ICEWEB is not defined”。
const scriptPromises = {};
function loadScript(src) {
  if (typeof window === 'undefined') return Promise.resolve();
  if (scriptPromises[src]) return scriptPromises[src];
  scriptPromises[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-le-src', src);
    s.onload = () => resolve();
    s.onerror = () => {
      delete scriptPromises[src];
      reject(new Error(`${src} 加载失败`));
    };
    document.head.appendChild(s);
  });
  return scriptPromises[src];
}

/** 把一段 CSS 的选择器全部前缀到 scope（容器类），隔离示例样式、不污染整页。 */
function scopeCss(css, scope) {
  let result = '';
  let i = 0;
  const n = css.length;
  while (i < n) {
    const open = css.indexOf('{', i);
    if (open === -1) {
      result += css.slice(i);
      break;
    }
    const pre = css.slice(i, open).trim();
    // 找匹配的 }
    let depth = 0;
    let close = -1;
    for (let j = open; j < n; j += 1) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') {
        depth -= 1;
        if (depth === 0) {
          close = j;
          break;
        }
      }
    }
    if (close === -1) {
      result += css.slice(i);
      break;
    }
    const block = css.slice(open + 1, close);
    if (pre.startsWith('@')) {
      // at-rule：@media / @supports 等递归作用域化内部选择器；@keyframes 等保持原样
      if (/^@(media|supports|container)/.test(pre)) {
        result += `${pre} {\n${scopeCss(block, scope)}\n}\n`;
      } else {
        result += `${pre} {\n${block}\n}\n`;
      }
    } else {
      const scopedSel = pre
        .split(',')
        .map((s) => {
          const t = s.trim();
          if (!t) return '';
          if (t === 'body' || t === 'html' || t === ':root' || t === '*') return scope;
          return `${scope} ${t}`;
        })
        .filter(Boolean)
        .join(', ');
      result += `${scopedSel} {\n${block}\n}\n`;
    }
    i = close + 1;
  }
  return result;
}

function LiveExampleInner({ html, bundles = [], height = 600, background = 'transparent', note }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const b of bundles) {
          if (cancelled) return;
          // eslint-disable-next-line no-await-in-loop
          await loadScript(b);
        }
        if (cancelled) return;
        const res = await fetch(html, { cache: 'no-cache' });
        const text = await res.text();
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const container = ref.current;
        if (!container) return;

        container.innerHTML = '';
        container.classList.add(SCOPE);

        // 1) 作用域隔离的 <style>
        doc.querySelectorAll('style').forEach((st) => {
          const scoped = scopeCss(st.textContent || '', `.${SCOPE}`);
          if (scoped.trim()) {
            const el = document.createElement('style');
            el.setAttribute('data-le-style', '');
            el.textContent = scoped;
            container.appendChild(el);
          }
          st.remove();
        });

        // 2) 移除已加载的 bundle <script src>（避免重复执行 / 404）
        doc.querySelectorAll('script[src]').forEach((s) => s.remove());

        // 3) 收集内联初始化脚本（按文档顺序），随后从 body 移除，避免 importNode 时自执行
        const inlineScripts = [];
        doc.querySelectorAll('script:not([src])').forEach((s) => {
          inlineScripts.push(s.textContent || '');
          s.remove();
        });

        // 4) 注入 body 其余节点（markup：画布 / 面板）
        const body = doc.body;
        while (body.firstChild) {
          container.appendChild(document.importNode(body.firstChild, true));
          body.removeChild(body.firstChild);
        }

        // 5) 执行示例初始化脚本。
        //    关键点：示例的 <script> 大多是顶层脚本（const ice/W/theme 挂在全局），
        //    若直接以 <script> 注入，同一页多个示例会因「共享页面全局作用域」而 const 重声明冲突；
        //    且 importNode 进来的 script 在 append 时会自执行、再用脚本重挂会二次执行。
        //    因此用 new Function 把全部内联脚本拼成一个函数调用，作用域彼此隔离、只执行一次，
        //    仍可通过 window.ICE / ICEWEB / ICEChart 等全局名驱动绘制。
        const allCode = inlineScripts.join('\n;\n');
        if (allCode.trim()) {
          try {
            // eslint-disable-next-line no-new-func
            new Function(allCode)();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[LiveExample] 示例初始化出错:', e);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[LiveExample]', e);
      }
    })();

    return () => {
      cancelled = true;
      // best-effort 销毁示例内的 ICE 实例，避免卸载后 rAF 仍在跑
      EXAMPLE_HANDLES.forEach((k) => {
        try {
          const h = window[k];
          if (!h) return;
          const ice =
            h.ice ||
            (h.charts && h.charts[0] && h.charts[0].ice) ||
            (Array.isArray(h) && h[0] && h[0].ice);
          if (ice && typeof ice.destroy === 'function') ice.destroy();
        } catch (_) {
          /* noop */
        }
      });
    };
    // 静态示例，挂载一次即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ margin: '1rem 0' }}>
      <div
        ref={ref}
        data-live-example={html}
        style={{
          height,
          overflow: 'auto',
          background,
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: 12,
          padding: 0,
        }}
      />
      {note && (
        <p style={{ fontSize: 13, opacity: 0.75, marginTop: 8 }}>{note}</p>
      )}
    </div>
  );
}

export default function LiveExample(props) {
  return <BrowserOnly>{() => <LiveExampleInner {...props} />}</BrowserOnly>;
}
