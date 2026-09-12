// @ts-check

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ICE Render',
  tagline: '雪花渲染器 · 高性能 Canvas 2D 交互图形引擎',
  url: 'https://ice-render.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'ice-render',
  projectName: 'ice-render',
  // 全局加载 ice-render 内核，供 `jsx live` 代码块直接使用 window.ICE（defer：HTML 解析后、水合前执行）
  scripts: [{ src: '/ice-render.js', defer: true }],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid', '@docusaurus/theme-live-codeblock'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/ice-render/ice-render-doc/tree/master',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'ICE Render',
        logo: {
          alt: 'ICE Render Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: '文档',
          },
          {
            type: 'doc',
            docId: 'api/ice',
            position: 'left',
            label: 'API 参考',
          },
          {
            type: 'doc',
            docId: 'architecture/runtime',
            position: 'left',
            label: '架构设计',
          },
          {
            type: 'doc',
            docId: 'entity-designer/index',
            position: 'left',
            label: 'Entity Designer',
          },
          {
            href: 'https://github.com/ice-render/ice-render',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文档',
            items: [
              {
                label: '快速上手',
                to: '/docs/getting-started/installation',
              },
              {
                label: 'API 参考',
                to: '/docs/api/ice',
              },
              {
                label: '架构设计',
                to: '/docs/architecture/runtime',
              },
            ],
          },
          {
            title: '生态',
            items: [
              {
                label: 'ice-render（引擎）',
                href: 'https://github.com/ice-render/ice-render',
              },
              {
                label: 'ice-render-dsl（AI Agent DSL）',
                href: 'https://www.npmjs.com/package/ice-render-dsl',
              },
              {
                label: 'ice-entity-designer（ER 设计器）',
                href: 'https://www.npmjs.com/package/ice-entity-designer',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ICE Render · MIT © 大漠穷秋 · Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
