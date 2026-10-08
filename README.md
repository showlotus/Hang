# 从夯到拉 · 排行榜

一个 Tier List 风格的等级排行榜单页应用：把条目分进 5 个等级（夯 / 顶级 / 人上人 / NPC / 拉完了），支持拖拽换级排序、图片上传、整榜导出图片与数据备份。

基于 React + Vite + Tailwind CSS 构建，液态玻璃拟态界面，数据保存在浏览器本地。

## 功能特性

- **等级面板**：5 档等级行，卡片式条目展示（无图时以名称首字兜底）
- **添加条目**：图片（点击 / 拖拽上传，自动压缩）、名称、备注、等级
- **拖拽**：卡片跨等级换级、行内排序（插入位置指示、拖到屏幕边缘自动滚动）；直接把图片文件拖到等级行可批量添加
- **编辑**：双击卡片打开编辑弹窗（换图 / 改名 / 改备注 / 换级 / 删除）
- **图片预览**：点击卡片图片以 FLIP 动画放大预览，Esc 或点击关闭
- **导出**：Canvas 绘制整榜，支持复制到剪贴板（不可用时自动降级为下载）、下载 PNG；JSON 导出 / 导入（含格式校验与覆盖确认）
- **持久化**：localStorage 自动保存（250ms 防抖），图片总量超出存储上限时提示
- **视觉**：玻璃拟态多层渐变皮肤、背景色斑漂移 + 鼠标视差、`prefers-reduced-motion / transparency` 动效降级、640px 响应式断点

## 技术栈

| 依赖 | 说明 |
|---|---|
| React 19 | UI 框架 |
| Vite 8 | 构建工具（`base: './'` 相对路径） |
| Tailwind CSS 4 | 布局用原子类（`@tailwindcss/vite` 插件），皮肤样式保留在 `index.css` |
| oxlint | 代码检查 |

## 快速开始

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建产物
npm run lint     # 代码检查
```

## 项目结构

```
src/
├── main.jsx              # 入口，挂载 App + ToastProvider
├── App.jsx               # 状态管理、localStorage 持久化、导入导出
├── index.css             # Tailwind 入口 + 玻璃拟态皮肤样式
├── constants.js          # 等级配置 / 字体 / 存储键
├── storage.js            # IndexedDB 封装 + localStorage 一次性迁移
├── utils.js              # 图片压缩、Canvas 绘制辅助、FLIP 动画
├── exportCanvas.js       # 整榜 Canvas 绘制、PNG / JSON 导出
└── components/
    ├── Blobs.jsx         # 背景色斑 + 鼠标视差
    ├── TopBar.jsx        # 可编辑标题 + 操作按钮
    ├── Adder.jsx         # 添加条目表单
    ├── PicDrop.jsx       # 图片上传区（添加区 / 弹窗复用）
    ├── TierPicker.jsx    # 等级选择器（添加区 / 弹窗复用）
    ├── Board.jsx         # 等级面板 + 拖拽逻辑
    ├── EditModal.jsx     # 编辑弹窗
    ├── Lightbox.jsx      # 图片 FLIP 预览
    ├── Toast.jsx         # 全局提示
    └── ToastContext.jsx  # Toast 上下文
```

## 数据说明

- 数据保存在 IndexedDB（库名 `hang-rank`，异步写入不阻塞界面，容量远大于 localStorage）；首次打开会自动把旧版 localStorage 数据（key：`rank-list:v1`）迁移进来并清除旧键
- 图片上传自动压缩：最长边 900px，优先输出 WebP（质量 0.85），环境不支持时回退 JPEG
- 本地存储写入异常时会在界面给出提示

## GitHub Pages 部署

仓库内置 `.github/workflows/deploy.yml`：每次 push（`gh-pages` 分支除外）自动安装依赖、构建，并把 `dist` 推送到 `gh-pages` 分支。

首次使用需要：

1. 将项目推送到 GitHub
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **Deploy from a branch**，分支选 **gh-pages** / **(root)**

配置完成后，每次 push 都会自动构建并发布到 GitHub Pages。
