import BrowserOnly from '@docusaurus/BrowserOnly';
import React from 'react';
import useAssetResolver from '../utils/assetUrl';

/**
 * LiveExample —— 在文档页里把 `static/` 下那份**完整的示例页**画出来。
 *
 * ## 为什么改成 <iframe>（2026-09-13）
 *
 * 此前是"注入式"：按顺序加载 UMD → fetch 示例 HTML → 把它的 body 与 style 注入本页，
 * 再执行示例的内联脚本，好处是不用 iframe、不重复拉包。
 *
 * 但它有一个**硬伤**：一个文档页里放多个示例时，注入进来的 DOM 共处同一个文档，
 * 而示例页（gallery / windows-xp / arcade / pixel-editor / algorithm-sandbox / dos-terminal）
 * **全部用 `id="canvas"`**。于是第二个及之后的示例执行 `new ICE.ICE().init('canvas')`
 * 时拿到的是**第一个**示例的画布 —— 自己的画布永远是空白（线上实测：6 个里 5 个 0 像素）。
 *
 * 换成 iframe 后每个示例拥有独立 document：id / 全局变量 / 样式天然隔离，
 * 示例页也回到"自己加载自己目录下 UMD"的正常路径（`./ice-render.umd.js`，相对路径，
 * 不依赖 baseUrl），与用户直接打开示例页看到的完全一致。
 * 代价是每个示例多一次 UMD 下载（浏览器缓存命中）与一份独立 JS 上下文 —— 文档页可以接受。
 *
 * 部署在子路径（`baseUrl = '/ice-render-doc/'`）下时，iframe 的 src 必须带上 baseUrl，
 * 否则会 404（这也是线上"示例一片空白"的另一半原因，见 `src/utils/assetUrl.js`）。
 */
function LiveExampleInner({ html, height = 600, background = 'transparent', note }) {
  const resolveAsset = useAssetResolver();
  if (!html) return null;

  return (
    <div style={{ margin: '1rem 0' }}>
      <iframe
        src={resolveAsset(html)}
        title={html}
        loading="lazy"
        data-live-example={html}
        style={{
          width: '100%',
          height,
          background,
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: 12,
          display: 'block',
        }}
      />
      {note && <p style={{ fontSize: 13, opacity: 0.75, marginTop: 8 }}>{note}</p>}
    </div>
  );
}

// BrowserOnly：iframe 只在浏览器端渲染，避免 SSR 阶段产出无意义的标记差异
export default function LiveExample(props) {
  return <BrowserOnly>{() => <LiveExampleInner {...props} />}</BrowserOnly>;
}
