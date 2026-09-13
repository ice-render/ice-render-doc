# AGENTS.md — ice-render-doc

## 项目定位

ICE 家族的文档站（Docusaurus，部署在 GitHub Pages：`https://ice-render.github.io/ice-render-doc/`）。
除文字文档外，它还用**预打包 UMD** 在页面里实时渲染各仓的示例（`src/components/LiveExample.jsx` 等）。

## 分支与发版约定（家族铁律，2026-09-13 确立）

- **开发**：一律在 `dev`（或从它切出来的临时分支）上做；`master` 只做集成与部署。
- **发布**：先把 `dev` 合并进 `master`（`git fetch . dev:master` 或 `git merge --no-ff dev`），
  **再从 `master` 推送部署** —— 本仓的 GitHub Actions（`.github/workflows/deploy.yml`）**只在 `master` 上触发**。
- **禁止**：直接在 `master` 上写实现；也禁止只推 `dev` 而让线上停在旧版本。
- 本仓主线名：`dev`（开发）+ `master`（部署/默认分支）；远端 `origin`（Gitee）+ `github-origin`（GitHub）。

## 两个容易踩的坑（都踩过，2026-09-13 修掉）

1. **子路径部署**：`baseUrl = '/ice-render-doc/'`，而 Docusaurus 只给它自己管理的静态资源套 baseUrl。
   组件里运行时 `fetch()` 的路径、动态插入的 `<script src>` 必须走 `src/utils/assetUrl.js`
   （`withBaseUrl` / `useAssetResolver`），否则线上 404、示例一片空白。
2. **一个页面嵌多个示例**：示例页全都用 `id="canvas"`，注入同一文档会互相抢占（后面的示例全空白）。
   `LiveExample` 因此改为 `<iframe>` 隔离，别改回注入式。

## 发布时记得刷新的东西

- `static/` 下的预打包产物：`ice-render.js`、`ice-render-dsl.js`、`ice-web-components/*.umd.js`、
  `ice-chart/vendor/*.umd.js`、`ied/index.umd.js`（与各仓 `dist/index.umd.js` 同源）。
- `site-versions.js`（顶部导航 / 左侧菜单 / 产品页版本号的**单一来源**），
  以及四个落地页 H1 与 info 块里硬编码的版本号（`docs/intro.md`、`docs/{ice-chart,ice-web-components,entity-designer}/index.mdx`）。
- 改完用真实浏览器按 **baseUrl 路径**验一遍（`http-server` 起一个带 `/ice-render-doc/` 前缀的根目录），
  别只在根路径下自测 —— 那正是当初漏掉 404 的原因。
