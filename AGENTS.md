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

## 开发节奏：**push 完不要等 CI**（2026-09-14 确立）

本仓的构建与部署由 **GitHub Actions 自动完成**（`.github/workflows/deploy.yml`，只在 `master` 上触发），
整个过程可能要**几分钟到十几分钟**。所以：

- 推完 `master` **就可以继续做下一件事**，不要在终端里 `sleep`、轮询 Actions 或盯着构建日志等它跑完；
- 需要确认"上线了没有"时，**看产物而不是看流水线状态**：拉线上页面里的版本号（导航由 `site-versions.js` 驱动）
  或某个预打包 js 里的特征字符串；带 `?cb=<时间戳>` 绕过 CDN 缓存；
- 线上没更新（尤其是刚推完的那几分钟）**不等于**推失败：先确认 `git ls-remote` 上的 ref 已经是新提交，
  再判断是不是构建/缓存还没走完。**不要**因为"页面还没变"就重新推一次。

> 同一套口径也适用于：不要为了等构建而在会话里空转 —— 构建失败时 GitHub 会发通知，
> 真出问题再回来修，比等着它便宜得多。

## 两个容易踩的坑（都踩过，2026-09-13 修掉）

1. **子路径部署**：`baseUrl = '/ice-render-doc/'`，而 Docusaurus 只给它自己管理的静态资源套 baseUrl。
   组件里运行时 `fetch()` 的路径、动态插入的 `<script src>` 必须走 `src/utils/assetUrl.js`
   （`withBaseUrl` / `useAssetResolver`），否则线上 404、示例一片空白。
2. **一个页面嵌多个示例**：示例页全都用 `id="canvas"`，注入同一文档会互相抢占（后面的示例全空白）。
   `LiveExample` 因此改为 `<iframe>` 隔离，别改回注入式。

## 发布时记得刷新的东西

### 镜像来的页面：改了源头要过来同步（2026-09-17 立）

站上有一部分页面是**从别的仓镜像过来的副本**（单一来源在那边，站点只是给人读的一份）：

| 站点页面 | 源头 | 同步方式 |
|---|---|---|
| `docs/ice-web-components/guides/*.md`（9 篇） | `ice-web-components/docs/guides/*.md` | 手改：把相对 `.md` 链接改成无扩展名（`./x.md` → `./x`），示例路径按站点根重写 |
| `docs/conventions/app-pages.md` | `ice-web-components/docs/guides/app-pages.md` | 同上，另加 front matter（description / keywords） |
| `docs/conventions/member-ordering.md` | 各仓 `AGENTS.md` 里的成员顺序契约 | 归纳成一篇，跟着契约改 |
| `docs/ice-agent-console/upstream-gaps.md`、`docs/ice-chart/annotation-design`、`docs/entity-designer/notation-*` | 对应仓的 `docs/` | 整篇搬过来 |

⚠️ **镜像会漂**：2026-09-17 体检时，`guides/` 里已经有 5 篇与源头不一致（`examples.md` 差 44 行、
`custom-components.md` 差 10 行、`layout.md` / `forms.md` / `testing.md` 各差 2~4 行，多是链接与
个别措辞）。改了库仓的指南就顺手过来对一遍 —— 站上那份是用户唯一会读到的。

- `static/` 下的预打包产物：`ice-render.js`、`ice-render-dsl.js`、`ice-web-components/*.umd.js`、
  `ice-chart/vendor/*.umd.js`、`ied/index.umd.js`（与各仓 `dist/index.umd.js` 同源）。
- `site-versions.js`（顶部导航 / 左侧菜单 / 产品页版本号的**单一来源**），
  以及四个落地页 H1 与 info 块里硬编码的版本号（`docs/intro.md`、`docs/{ice-chart,ice-web-components,entity-designer}/index.mdx`）。
- **引擎语义变了，用户向那页要跟着改**：使用者读到的是**文档站的正文**，不是引擎仓的架构文档。
  目前最容易漂的是 `docs/guide/events.mdx`（事件系统）——2.18.0 起才有"沿组件树冒泡 /
  `ICEEvent` 的 W3C 方法真实现 / 两套 API 收口"，页内两个 LiveExample
  （`static/ice-render/examples/event-{bubbling,api}.html`）与「常见困惑」「升级清单」两节
  必须跟着 `ice-render/AGENTS.md` 的事件系统铁律改；架构页 `docs/architecture/*` 与
  `ice-render/docs/architecture/*` 是近镜像关系（多一段 LiveExample），引擎改了也要来回对一遍。
- 改完用真实浏览器按 **baseUrl 路径**验一遍（`http-server` 起一个带 `/ice-render-doc/` 前缀的根目录），
  别只在根路径下自测 —— 那正是当初漏掉 404 的原因。
