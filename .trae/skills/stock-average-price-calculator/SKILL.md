---
name: 'stock-average-price-calculator'
description: '股票/ETF/积存金均价计算器项目的开发规范和约定。在修改、新增代码或分析项目架构时使用此 Skill，每次改动完成后运行 `npm run lint` 确保代码格式化，运行 `npm run type-check` 确保类型检查通过，确保代码质量和可维护性。'
---

# 股票/ETF/积存金均价计算器

## 一、项目概览

| 项目     | 说明                                                    |
| -------- | ------------------------------------------------------- |
| **名称** | 股票/ETF/积存金均价计算器                               |
| **用途** | 管理股票/ETF/积存金交易记录，计算持仓均价、盈亏、手续费 |
| **语言** | 中文（zh-CN）                                           |

## 二、技术栈

| 类别      | 技术                                                         |
| --------- | ------------------------------------------------------------ |
| 框架      | Vue 3（Composition API + `<script setup lang="ts">`）        |
| 构建工具  | Vite 8                                                       |
| 类型系统  | TypeScript 5+（strict 模式）                                 |
| 路由      | Vue Router 4（Hash 模式 `createWebHashHistory`）             |
| UI 组件库 | shadcn-vue（基于 reka-ui，New York 风格）                    |
| CSS 方案  | Tailwind CSS v4 + `tw-animate-css`                           |
| 图标库    | lucide-vue-next                                              |
| 表单验证  | vee-validate 5 + zod 4                                       |
| 表格      | @tanstack/vue-table                                          |
| 通知      | vue-sonner                                                   |
| 工具函数  | @vueuse/core, clsx, tailwind-merge, class-variance-authority |
| 后端/存储 | Firebase Auth + Firestore（游客模式降级为 localStorage）     |
| 截图分享  | html2canvas-pro                                              |
| 表格导出  | xlsx（SheetJS）                                              |

## 三、核心约定

### 3.1 路径别名

- `@/` → `src/`（在 `vite.config.js` 和 `tsconfig.json` 中统一配置）

### 3.2 UI 组件模式（shadcn-vue）

- shadcn-vue 组件通过 CLI 安装：
  ```bash
  npx shadcn-vue@latest add <component-name>
  ```

### 3.3 Vue 组件写法

- **始终使用** `<script setup lang="ts">`
- Props 使用 TypeScript `interface` + `defineProps`
- 组合式 API，逻辑抽离到 `composables/`

### 3.4 数据持久化

- **登录用户** → Firestore 存储
- **游客模式** → `localStorage` 存储

### 3.5 错误处理

- 中文错误提示（`vue-sonner` toast）

### 3.6 TypeScript

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `erasableSyntaxOnly: true`
- 使用 `type` 导入语法

### 3.7 组件归类

- 页面对应的功能提取为组件时，必须归类到 `src/components/` 下的具体子文件夹中：
- **禁止**将业务组件直接散落在 `src/components/` 根目录下

### 3.8 移动端适配

- 所有页面和组件需考虑移动端适配，使用 Tailwind 响应式前缀（`sm:`、`md:`、`lg:` 等）
- 表格等宽内容在移动端使用横向滚动容器包裹：`<div class="overflow-x-auto">`
- 对话框在移动端避免固定大宽度，优先使用百分比宽度或 `max-w-[calc(100vw-2rem)]`
- 按钮组在移动端允许换行排列，避免溢出

## 四、常用命令

| 命令                 | 说明                        |
| -------------------- | --------------------------- |
| `npm run dev`        | 启动开发服务器（端口 3000） |
| `npm run build`      | 类型检查 + 构建             |
| `npm run preview`    | 预览构建产物                |
| `npm run type-check` | 类型检查                    |
