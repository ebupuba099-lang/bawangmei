# 项目上下文 - 霸王梅

### 版本技术栈
# 霸王梅 · 排列五头尾参考

一个以中国传统美学"霸王梅"为主题的排列五头尾参考工具。
随机生成 43 组"头尾"组合（形如 `4xx6`），结合中彩网公开的开奖数据，
自动匹配排列五第 1 位与第 4 位是否命中。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **部署**: GitHub Pages（静态导出，basePath: `/bawangmei`）

## 项目说明

「霸王梅」是体彩时时彩「头尾」玩法查询工具。每天根据日期种子生成 43 组不重复头尾组合（首位+第四位），与历史开奖号码比对判定命中。支持连爆检测、历史记录（最多20期）、图片分享（html2canvas）、一键复制。
- **UI 组件**: shadcn/ui
- **Styling**: Tailwind CSS 4
- **数据源**: 中彩网（zhcw.com）公开 JSONP 接口

## 目录结构

```
├── public/
│   └── data/
│       └── lottery_data.json    # 静态开奖数据（GitHub Actions 定时更新）
├── scripts/
│   ├── build.sh                 # 构建脚本（静态导出）
│   ├── dev.sh                   # 开发环境启动（自定义 server）
│   ├── fetch_lottery.py         # Python 数据采集脚本
│   ├── prepare.sh               # 预处理
│   └── start.sh                 # 生产环境启动
├── src/
│   ├── app/
│   │   ├── api/lottery/route.ts # 开奖数据代理 API（仅开发环境）
│   │   ├── globals.css          # 全局样式（国风霸王梅色系）
│   │   ├── layout.tsx           # 根布局
│   │   └── page.tsx             # 主页面（'use client'，完整业务逻辑）
│   ├── components/
│   │   ├── ComboGrid.tsx        # 5×9 头尾组合网格（无边框无高亮，全部一次性显示）
│   │   ├── HistoryTable.tsx     # 往期命中记录表格（最多20期，交替背景色）
│   │   ├── LotteryCard.tsx      # 主卡片（国风Header + 核心内容 + 历史区域）
│   │   └── Sidebar.tsx          # 左侧边栏（复制 / 保存图片）
│   ├── hooks/
│   │   └── use-mobile.ts        # 移动端检测
│   └── lib/
│       ├── data.ts              # 数据获取（三保险：静态JSON→Sporttery→灰鸟API）
│       ├── lottery.ts           # 核心逻辑（mulberry32种子、组合生成、命中判定）
│       ├── types.ts             # 类型定义
│       └── utils.ts             # 通用工具函数
├── .github/workflows/
│   ├── deploy.yml               # GitHub Pages 自动部署
│   └── lottery.yml              # 定时获取开奖数据（每天21:40北京）
├── next.config.ts               # Next.js 配置（生产静态导出 + basePath）
├── DESIGN.md                    # 水墨国风设计规范文档
└── package.json                 # 项目依赖
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器。

- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`

## 开发规范

### 核心逻辑说明

1. **种子生成**：`mulberry32` 算法，基于日期（北京时区）生成固定种子，同天内不变
2. **43 组组合**：从 00-99 的 100 种头尾组合中伪随机选取 43 组不重复组合
3. **显示**：5列×9行，格式 `A xx B`（空格分隔），无边框无高亮，全部一次性显示
4. **命中判定**：首位（第1位）== head **且** 第4位 == tail → "中"，否则 "无"
5. **连爆检测**：连续命中≥3期 → "🔥连爆N期"；连续未中≥5期 → "数据不稳"
6. **历史独立判定**：每期用该期开奖日期的独立种子生成 43 组组合，加载时一次性计算并固定

### 数据获取优先级（三保险）

1. `./data/lottery_data.json`（GitHub Pages 静态文件，GitHub Actions 定时更新）
2. `https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=350133&provinceId=0&pageSize=20&is11=0`（体彩官方 API）
3. `http://api.huiniao.top/interface/home/lotteryHistory?type=plw&page=1&limit=20`（灰鸟 API 备选）

### 持久化

数据全部来自云端，无 localStorage 依赖（保留向后兼容的存储键名但不再使用）。

### 关键配置

- **next.config.ts**: 生产环境自动启用 `output: 'export'` + `basePath: '/bawangmei'`；开发环境正常模式（API Routes 可用）
- **build.sh**: 静态导出模式（仅 `next build`，输出到 `out/`）
- **deploy.yml**: 构建后添加 `.nojekyll`，上传 `out/` 到 GitHub Pages

## 测试

- 构建测试：`pnpm next build`
- TypeScript 检查：`pnpm ts-check`
src/
├── app/
│   ├── api/lottery/route.ts        # 排列5 开奖数据代理接口
│   ├── layout.tsx                  # 根布局（中文 lang + 元信息）
│   ├── page.tsx                    # 主页（霸王梅卡片）
│   └── globals.css                 # 全局样式
├── components/
│   ├── Flowers.tsx                 # 四季花卉 + 边框装饰 SVG
│   └── ui/                         # shadcn/ui 组件库
└── lib/
    ├── lottery.ts                  # 客户端：组合生成、匹配逻辑、类型
    └── lottery-server.ts           # 服务端：zhcw 接口封装 + 60s 缓存
```

## 核心模块说明

### `src/lib/lottery-server.ts`
- 封装中彩网 `https://jc.zhcw.com/port/client_json.php` 接口
- `transactionType=10001001` 拉取历史，`10001002` 查询指定期号
- `lotteryId=284` 即"排列五"
- 60s 内存缓存避免触发反爬

### `src/lib/lottery.ts`
- `generatePicks(43)`：从 100 种 `(first, fourth)` 组合中随机取 43 种
- `matchPick(pick, issue)`：判断 `pick.first == issue.digits[0]` 且 `pick.fourth == issue.digits[3]`
- `NormalizedIssue` / `HeadTailPick` 类型定义

### `src/app/api/lottery/route.ts`
- GET `/api/lottery?count=10` → 最近 N 期
- GET `/api/lottery?issue=26154` → 指定期号详情

### `src/app/page.tsx`
- SSR 安全的客户端组件
- 翻牌动画：每 380ms 显示下一组
- 历史记录通过 `localStorage` 持久化
- 分享/下载：
  - iOS（含 standalone 模式）→ `navigator.share` 弹出系统分享面板
  - 其他平台 → 走 `<a download>` 下载 PNG
- 拼图生成：纯 SVG → `<img>` → `canvas.toBlob('image/png')`，不依赖 html2canvas

## 开发与启动

```bash
pnpm install
pnpm dev
```

服务端口由 `DEPLOY_RUN_PORT` 环境变量注入（主仓固定 5000）。

## 验证

```bash
pnpm ts-check              # 类型检查
pnpm lint --quiet          # 风格检查
curl localhost:5000/api/lottery?count=5
curl localhost:5000/api/lottery?issue=26154
```

## 注意事项

- 数据源依赖中彩网可访问性；若上游失败应提示用户稍后重试。
- 浏览器侧必须使用 `'use client'`，并避免在渲染中直接读 `localStorage` /
  `window.navigator.userAgent`，统一在 `useEffect` 中初始化。
- iOS Safari 的 `navigator.share` 必须先 `canShare` 探测再调用，否则可能抛错。
- 跨域图片下载不要直接 `<a download>`，本项目通过 `canvas.toBlob` 走同源 blob。
