import { useCallback } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * 运行时资源路径的 baseUrl 归一。
 *
 * 为什么需要：本站部署在**子路径**下（`ice-render-doc/site-versions.js` 同级的
 * `docusaurus.config.js` 里 `baseUrl = '/ice-render-doc/'`），而 Docusaurus **只对
 * 它自己管理的静态资源**套用 baseUrl —— 组件里运行时 `fetch()` 的路径、动态插入的
 * `<script src>` 一律原样使用。于是写 `/ice-render.js`（根绝对路径）在子路径部署下会 404，
 * 页面表现就是"内嵌示例一片空白"（线上实测：/docs/ice-web-components/ 等三个产品页 0 画布）。
 *
 * 规则：`http(s)://`、`//cdn...` 原样返回；已经以 baseUrl 开头的原样返回（幂等）；
 * 其余相对/根绝对路径统一补上 baseUrl。
 */
export function withBaseUrl(baseUrl, path) {
  if (!path) return path;
  if (/^https?:|^\/\//.test(path)) return path;
  const base = baseUrl && baseUrl.endsWith('/') ? baseUrl : `${baseUrl || '/'}/`;
  if (path.startsWith(base)) return path;
  return base + path.replace(/^\//, '');
}

/** React 版本：返回一个把路径解析成可访问 URL 的函数。 */
export default function useAssetResolver() {
  const { siteConfig } = useDocusaurusContext();
  const baseUrl = (siteConfig && siteConfig.baseUrl) || '/';
  return useCallback((path) => withBaseUrl(baseUrl, path), [baseUrl]);
}
