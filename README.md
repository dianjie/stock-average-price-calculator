# 股票/ETF/积存金均价计算器

记录 A 股、ETF、积存金的买卖交易，自动计算持仓均价、盈亏与手续费。支持云端同步与离线游客模式。

---

## 功能特点

### 📊 多品种管理

- 支持 **A 股**、**ETF** 和 **积存金** 三种类型
- 标签页切换，同时管理多只标的
- 支持封存/解冻已完成交易的标的，保持界面整洁

### 📝 交易记录

- 添加、编辑、删除买入/卖出交易记录
- 支持自定义标签，方便分类筛选

### 💰 费用计算

- **A 股**：佣金（最低 5 元起）、印花税（卖出 0.05%）、过户费（沪市双向 0.001%）
- **ETF**：佣金（无最低收费、无印花税、无过户费）
- **积存金**：卖出手续费（费率可自定义）
- 支持**全局费率配置**，也支持**单只标的自定义费率**
- 每日费用明细汇总

### 📈 持仓分析

- 实时计算：当前持仓量、持仓均价、总投入、浮动盈亏、盈亏百分比
- **回本价格**：考虑历史已实现盈亏后，精确计算实际回本价
- **建议卖出价计算**：可任选多笔买入记录，计算综合保本卖出价

### 🔄 数据持久化与导入导出

- **Firebase 账号登录**：数据云端存储，多设备同步
- **游客模式**：数据存储在浏览器本地，无需注册即可使用
- 支持 **JSON / CSV / Excel** 三种格式的导入导出
- 提供导入模板下载，支持批量导入交易数据

### 📷 截图分享

- 可将当前持仓概览一键导出为 PNG 图片，方便分享

### 📉 交易复盘

- **持仓走势图（ECharts）**：可视化展示持仓均价和当前价格走势
- **交易日历**：按日历视图展示每日买卖统计（买入/卖出数量、金额、笔数、当日持仓均价）
- **逐笔阶梯图**：每一笔交易后持仓量和均价的变化轨迹

### 🎨 用户体验

- **深色/浅色主题切换**
- **移动端适配**：响应式布局，手机端良好体验
- **积存金价格换算器**：人民币/克快速换算

---

## 技术栈

| 类别       | 技术                                                              |
| ---------- | ----------------------------------------------------------------- |
| 框架       | Vue 3（Composition API + `<script setup lang="ts">`）             |
| 构建工具   | Vite 8                                                            |
| 类型系统   | TypeScript 5（strict 模式）                                       |
| 路由       | Vue Router 4（Hash 模式）                                         |
| UI 组件    | shadcn-vue（New York 风格，基于 reka-ui）                         |
| CSS 框架   | Tailwind CSS v4 + `tw-animate-css`                                |
| 图标库     | lucide-vue-next                                                   |
| 表单验证   | vee-validate 5 + zod 4                                            |
| 表格       | @tanstack/vue-table                                               |
| 图表       | ECharts + vue-echarts                                             |
| 通知提示   | vue-sonner                                                        |
| 工具函数   | @vueuse/core, clsx, tailwind-merge, class-variance-authority      |
| 认证与存储 | Firebase Auth + Firestore（登录模式）<br>localStorage（游客模式） |
| 截图导出   | html2canvas-pro                                                   |
| 表格导出   | xlsx（SheetJS）                                                   |

---

## 安装与运行

```bash
# 克隆项目
git clone <repo-url>
cd stock-average-price-calculator

# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览构建产物
npm run preview

# 代码格式化
npm run format

# 代码检查
npm run lint

# 打包且生成分析报告
npm run analyze
```

### Firebase 配置

项目使用 Firebase 进行用户认证和数据存储。同时支持**游客模式**，无需配置 Firebase 即可本地使用。

如需启用云端功能，复制 `.env.example` 为 `.env`，填入你的 Firebase 项目配置：

```bash
cp .env.example .env
```

```ini
# .env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
```

#### Firestore 安全规则

在 Firebase 控制台设置以下 Firestore 规则，确保用户只能读写自己的数据：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userStocks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /userFeeSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 使用说明

### 1. 添加标的

点击「添加」按钮，输入标的代码、名称，选择类型（A 股 / ETF / 积存金）。

### 2. 添加交易记录

选择目标标的后，点击「添加交易」按钮，填写：

- **交易日期**：默认为当天，可手动修改
- **交易方向**：买入 / 卖出
- **交易价格**：每股（份/克）价格
- **交易数量**：股数 / 份数 / 克数
- **标签**（可选）：自定义标签，用于分类筛选

系统会自动计算手续费和总金额。

### 3. 查看持仓统计

在「持仓概览」卡片中可查看：

| 指标       | 说明                                   |
| ---------- | -------------------------------------- |
| 当前持仓   | 买入总量 - 卖出总量                    |
| 持仓均价   | 加权平均买入成本（考虑卖出后成本摊薄） |
| 总投入     | 净投入金额（买入总额 - 卖出回款）      |
| 浮动盈亏   | 基于当前价计算的浮动盈亏               |
| 盈亏百分比 | 浮动盈亏占净投入的百分比               |
| 回本价格   | 考虑历史已实现盈亏后的实际回本价       |

### 4. 建议卖出价计算

勾选交易记录后点击「计算卖出价」，系统计算综合保本卖出价。适用于多次买入后一次性卖出的场景。

### 5. 每日费用

点击「每日费用」，查看按日汇总的手续费、卖出量和卖出均价。

### 6. 交易复盘

点击「交易复盘」标签页：

- **持仓图表**：可视化展示持仓均价变化和当前价对比
- **交易日历**：日历视图，展示每日买卖统计和持仓状态
- **逐笔阶梯**：每笔交易后持仓量和均价的变化轨迹

### 7. 导入导出

点击「导入导出」按钮：

- **导出**：支持 JSON、CSV、Excel 三种格式
- **模板下载**：下载 CSV/Excel 导入模板
- **导入**：导入已导出的数据文件（支持 JSON/CSV/Excel），可选择「合并」或「替换」

### 8. 费率设置

点击「费用设置」按钮，可自定义全局费率：

| 费率项         | 说明             | 默认值 |
| -------------- | ---------------- | ------ |
| A股佣金费率    | 成交金额比例     | 0.025% |
| 最低佣金       | 单笔最低收取金额 | 5 元   |
| 印花税率       | 卖出时收取       | 0.05%  |
| 过户费率       | 沪市双向收取     | 0.001% |
| ETF佣金费率    | 成交金额比例     | 0.025% |
| 积存金卖出费率 | 卖出金额比例     | 0.4%   |

也可为单只标的设置独立费率，优先级高于全局设置。

### 9. 积存金价格换算器

在积存金类型标的下方提供「价格换算」工具，输入人民币/克价格和克数，快速换算总金额。

---

## 费用计算说明

### A 股

| 费用项目 | 收取方   | 计算方式                         | 备注     |
| -------- | -------- | -------------------------------- | -------- |
| 佣金     | 券商     | `max(成交金额 × 费率, 最低佣金)` | 买卖双向 |
| 印花税   | 国家税务 | `成交金额 × 0.05%`               | 仅卖出   |
| 过户费   | 交易所   | `成交金额 × 0.001%`              | 沪市双向 |

### ETF

| 费用项目 | 收取方 | 计算方式          | 备注       |
| -------- | ------ | ----------------- | ---------- |
| 佣金     | 券商   | `成交金额 × 费率` | 无最低收费 |

### 积存金

| 费用项目   | 收取方 | 计算方式          | 备注   |
| ---------- | ------ | ----------------- | ------ |
| 卖出手续费 | 银行   | `卖出金额 × 费率` | 仅卖出 |

---

## 项目结构

```
src/
├── components/
│   ├── auth/              # 认证相关组件（登录/注册/游客按钮）
│   ├── review/            # 交易复盘组件（图表/日历/阶梯图）
│   ├── stock/             # 核心业务组件
│   │   ├── dialogs/       # 各类对话框（交易/卖出价/费用/导入等）
│   │   ├── StockCalculator.vue     # 主计算器
│   │   ├── TransactionTable.vue    # 交易记录表格
│   │   └── ...
│   ├── theme/             # 主题切换
│   ├── ui/                # shadcn-vue UI 组件
│   └── user/              # 用户信息组件
├── composables/           # 组合式 API 逻辑
│   ├── review/            # 交易复盘逻辑
│   ├── stock/             # 核心计算逻辑
│   ├── useFeeSettings.ts  # 费率配置
│   └── useStockData.ts    # 数据持久化
├── config/                # 配置文件（费率默认值/标签/认证错误）
├── firebase/              # Firebase 配置（认证/数据库）
├── lib/                   # 工具函数（cn 等）
├── pages/                 # 页面组件
├── plugins/               # 插件（ECharts）
├── router/                # 路由配置
├── style/                 # 全局样式（Tailwind）
└── utils/                 # 工具函数
    ├── dataIO.ts          # 导入导出
    ├── feeCalculator.ts   # 费用计算
    ├── shareImage.ts      # 截图分享
    └── stockStats.ts      # 持仓统计计算
```

---

## 许可

MIT License
