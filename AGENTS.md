# AGENTS.md

从夯到拉 · 排行榜：Tier List 单页应用。React 19 + Vite 8 + Tailwind CSS 4，纯 JavaScript/JSX——无 TypeScript，无任何测试框架，验证改动只用 lint + build。

## 命令

- 包管理器是 **pnpm**（`packageManager` 锁定 pnpm@11.25.0，CI 用 `pnpm install --frozen-lockfile`）。README 快速开始里写的 `npm install` 已过时，勿用 npm/yarn。
- `pnpm run dev` — 开发服务器（`server.host: true`，局域网可访问）
- `pnpm run lint` — oxlint（配置在 `.oxlintrc.json`）
- `pnpm run build` — 生产构建；无 typecheck、无 test 脚本

## 部署

- 每次 push（gh-pages 分支除外）CI 自动构建并把 `dist/` 发布到 GitHub Pages，见 `.github/workflows/deploy.yml`（Node 22），无需手动部署。
- `vite.config.js` 的 `base: './'` 是 Pages 相对路径所必需，勿改成绝对路径。

## 架构

- 状态全部在 `src/App.jsx`：groups / activeId，负责 IndexedDB 持久化（250ms 防抖，写入失败 toast）与 JSON 导入导出；挂载入口是 `src/main.jsx`。
- `src/storage.js` 是 IndexedDB 封装：`kv` store 里一条 `state` 记录（当前分组 + 分组顺序）+ 每分组一条 `group:<id>` 记录；库名/版本等常量在 `src/constants.js`。
- 等级配置（`TIERS`）、待选区标识（`POOL_TIER`）、触屏判断（`IS_TOUCH`）都在 `src/constants.js`，动等级逻辑先看这里。
- 拖拽换级 / 行内排序 / 触屏长按拖拽逻辑集中在 `src/components/Board.jsx`；整榜 Canvas 绘制与导出在 `src/exportCanvas.js`。
- 交互需同时兼容鼠标与触屏：桌面 HTML5 drag，触屏长按拖拽 + 单击编辑，`IS_TOUCH` 分流。

## 样式

- Tailwind 4 走 `@tailwindcss/vite` 插件，无 tailwind.config；入口是 `src/index.css` 的 `@import "tailwindcss"`。
- 玻璃拟态皮肤、设计 token（`:root` CSS 变量）、动效降级（`prefers-reduced-motion / transparency`）、640px 响应式断点都是 `src/index.css` 里的手写 CSS，改视觉先看这个文件。
- 界面文案为中文。

## 术语

`GLOSSARY.md` 定义了领域术语与禁用词（分组 / 项目 / 等级 / 等级行 / 待选区……），变量命名、组件命名和 UI 文案都要遵循，勿用「榜单」「条目」「档位」等 Avoid 词。
