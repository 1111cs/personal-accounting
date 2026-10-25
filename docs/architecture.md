# 个人记账系统 - 设计实现方案

> Technical Design Document
>
> **平台形态**：Web 网页版（响应式适配桌面 + 移动端）
>
> **版本**：V1.1 | **日期**：2026-06-13 | **状态**：已修订

---

## 目录

- [1. 技术架构总览](#1-技术架构总览)
- [2. 技术选型](#2-技术选型)
- [3. 系统架构设计](#3-系统架构设计)
- [4. 数据库设计](#4-数据库设计)
- [5. 核心功能模块设计](#5-核心功能模块设计)
- [6. 前端页面设计](#6-前端页面设计)
- [7. 路由设计](#7-路由设计)
- [8. 核心算法与公式](#8-核心算法与公式)
- [9. 安全与性能](#9-安全与性能)
- [10. 部署方案](#10-部署方案)

---

## 1. 技术架构总览

```
┌─────────────────────────────────────────────────────────┐
│                  前端（Web 响应式 SPA）                     │
│     React 18 + TypeScript + Ant Design 5 + ECharts      │
│        Zustand（状态管理） + React Router（路由）           │
│         桌面端（主场景） + 移动端响应式适配                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST API
┌────────────────────────┴────────────────────────────────┐
│                    后端（Node.js）                         │
│              Express.js + TypeScript                     │
│            JWT 认证 + 数据校验（Zod）                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                    数据存储层                              │
│              MySQL 8.0（主存储）                           │
│              Redis（可选，缓存/会话）                       │
└─────────────────────────────────────────────────────────┘
```

**架构说明**：

- 采用 **B/S 架构**，前端 SPA + 后端 RESTful API
- **Web 网页版**，桌面浏览器为主使用场景，移动端浏览器响应式适配
- 后端负责业务逻辑、数据持久化、定时任务
- 数据库使用 MySQL

---

## 2. 技术选型

### 2.1 前端

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 18.x | UI 框架 | 生态成熟，组件化开发效率高 |
| TypeScript | 5.x | 类型安全 | 减少运行时错误，提升可维护性 |
| Vite | 5.x | 构建工具 | 极快的 HMR，开发体验好 |
| Ant Design | 5.x | UI 组件库 | Web 版首选，表格/表单/布局/弹窗丰富，响应式栅格适配 |
| ECharts | 5.x | 图表库 | 饼图/柱状图/折线图，满足全部图表需求 |
| Zustand | 4.x | 状态管理 | 轻量无 boilerplate，适合中小型应用 |
| React Router | 6.x | 路由 | 标准 SPA 路由方案 |
| Axios | 1.x | HTTP 客户端 | 拦截器/请求取消/错误处理完善 |
| Day.js | 1.x | 日期处理 | 轻量（2KB），API 与 Moment.js 兼容 |

### 2.2 后端

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| Node.js | 20 LTS | 运行时 | 前后端统一语言，降低上下文切换 |
| Express.js | 4.x | Web 框架 | 最成熟的 Node.js 框架，生态丰富 |
| TypeScript | 5.x | 类型安全 | 与前端一致 |
| MySQL2 | 3.x | 数据库驱动 | 支持 Promise/async，性能好 |
| Sequelize | 6.x | ORM | 成熟的 MySQL ORM，迁移/关联查询方便 |
| Zod | 3.x | 数据校验 | TypeScript-first，类型推导完美 |
| node-cron | 3.x | 定时任务 | 每日凌晨预算重算、成就检查 |
| jsonwebtoken | 9.x | JWT 认证 | 轻量无状态认证 |
| csv-writer | 1.x | CSV 导出 | 简单易用 |
| pdfkit | 0.13.x | PDF 导出 | Node.js 端 PDF 生成 |

### 2.3 开发工具

| 工具 | 用途 |
|------|------|
| ESLint + Prettier | 代码规范与格式化 |
| Git | 版本控制 |
| nodemon / tsx | 后端热重载 |

---

## 3. 系统架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────┐
│           表现层（Presentation）       │
│   React Pages → Components → Hooks  │
├─────────────────────────────────────┤
│           业务逻辑层（Service）        │
│   预算引擎 / 成就引擎 / 物价匹配       │
├─────────────────────────────────────┤
│           数据访问层（Repository）     │
│   Sequelize Models → MySQL Queries  │
└─────────────────────────────────────┘
```

### 3.2 后端项目结构

```
server/
├── src/
│   ├── config/                 # 配置文件
│   │   └── database.ts         # 数据库连接配置
│   ├── models/                 # Sequelize 数据模型
│   │   ├── Bill.ts             # 账单模型
│   │   ├── Budget.ts           # 预算模型
│   │   ├── Achievement.ts      # 成就模型
│   │   ├── UserAchievement.ts  # 用户成就关联
│   │   └── PriceRecord.ts      # 物价记录模型
│   ├── routes/                 # 路由/控制器
│   │   ├── bill.routes.ts      # 账单 CRUD
│   │   ├── budget.routes.ts    # 预算管理
│   │   ├── dashboard.routes.ts # 首页数据聚合
│   │   ├── achievement.routes.ts
│   │   ├── price.routes.ts     # 物价雷达
│   │   └── export.routes.ts    # 数据导出
│   ├── services/               # 业务逻辑
│   │   ├── budget.service.ts   # 预算计算引擎
│   │   ├── achievement.service.ts # 成就检查引擎
│   │   ├── price.service.ts    # 物价匹配与提示
│   │   └── stats.service.ts    # 统计汇总
│   ├── middleware/              # 中间件
│   │   ├── auth.ts             # JWT 认证
│   │   ├── validate.ts         # Zod 校验
│   │   └── errorHandler.ts     # 全局错误处理
│   ├── jobs/                   # 定时任务
│   │   ├── dailyBudget.ts      # 每日额度重算
│   │   └── achievementCheck.ts # 成就条件检测
│   ├── utils/                  # 工具函数
│   │   └── date.ts             # 日期工具
│   └── app.ts                  # 应用入口
├── package.json
└── tsconfig.json
```

### 3.3 前端项目结构

```
client/
├── src/
│   ├── api/                    # API 请求层
│   │   ├── request.ts          # Axios 实例 + 拦截器
│   │   ├── bill.api.ts         # 账单 API
│   │   ├── budget.api.ts       # 预算 API
│   │   ├── dashboard.api.ts    # 首页 API
│   │   ├── achievement.api.ts
│   │   ├── price.api.ts        # 物价雷达 API
│   │   └── export.api.ts
│   ├── stores/                 # Zustand 状态
│   │   ├── useBillStore.ts     # 账单状态
│   │   ├── useBudgetStore.ts   # 预算状态
│   │   └── useAppStore.ts      # 全局应用状态
│   ├── pages/                  # 页面组件
│   │   ├── Home/               # 首页（卡片按钮式 Dashboard）
│   │   ├── Record/             # 记账录入
│   │   ├── BillList/           # 账单列表
│   │   ├── BillDetail/         # 账单详情
│   │   ├── Budget/             # 预算设置
│   │   ├── BudgetDetail/       # 预算详情（进度条详情）
│   │   ├── ReserveDetail/      # 备用金详情
│   │   ├── StreakDetail/       # 连续不透支详情
│   │   ├── Stats/              # 宏观资产看板
│   │   ├── Achievement/        # 成就墙
│   │   ├── PriceRadar/         # 物价雷达看板
│   │   ├── PriceRecord/        # 物价雷达独立录入页
│   │   ├── Settings/           # 设置（导出等）
│   │   └── Login/              # 登录页
│   ├── components/             # 通用组件
│   │   ├── DashboardCard/      # 首页通用卡片组件（标题+摘要+详情按钮）
│   │   ├── ProgressBar/        # 进度条组件
│   │   ├── BillCard/           # 账单卡片
│   │   ├── TagBadge/           # 标签徽章
│   │   ├── WaterDrop/          # 水滴指示器
│   │   ├── SocialSwitch/       # 社交模式开关
│   │   ├── AchievementBadge/   # 成就徽章
│   │   └── Charts/             # 图表组件封装
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useDailyBudget.ts   # 每日额度计算（含社交模式备用金扣除逻辑）
│   │   ├── useProgress.ts      # 进度条逻辑
│   │   └── useAchievement.ts   # 成就逻辑
│   ├── utils/                  # 工具函数
│   │   ├── format.ts           # 金额/日期格式化
│   │   └── budget.ts           # 预算计算（客户端，含社交模式逻辑）
│   ├── types/                  # TypeScript 类型
│   │   └── index.ts
│   ├── router.tsx              # 路由配置
│   ├── App.tsx                 # 根组件
│   └── main.tsx                # 入口
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 4. 数据库设计

### 4.1 ER 图（核心实体关系）

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│   User   │       │   Bill   │       │  Budget  │
├──────────┤ 1   N ├──────────┤ 1   1 ├──────────┤
│ id (PK)  │───────│ id (PK)  │───────│ id (PK)  │
│ username │       │ user_id   │       │ user_id   │
│ password │       │ amount    │       │ month     │
│ ...      │       │ category  │       │ total     │
└──────────┘       │ date      │       │ reserve   │
       │           │ tags      │       │ spent_base│
       │           │ note      │       │ created_at│
       │           │ is_overeat│       │ updated_at│
       │           │ created_at│       └──────────┘
       │           └──────────┘
       │
       │  1   N  ┌──────────────┐
       ├─────────│ PriceRecord  │
       │         ├──────────────┤
       │  1   N  │ id (PK)      │
       ├─────────│ user_id      │
       │         │ item_name    │
       │         │ unit_price   │
       │         │ purchase_date│
       │         │ location     │
       │         └──────────────┘
       │
       │  N   N  ┌──────────────┐     ┌─────────────────┐
       └─────────│Achievement   │─────│ UserAchievement │
                 ├──────────────┤     ├─────────────────┤
                 │ id (PK)      │     │ id (PK)         │
                 │ name         │     │ user_id         │
                 │ description  │     │ achievement_id  │
                 │ condition    │     │ unlocked_at     │
                 │ rarity       │     └─────────────────┘
                 └──────────────┘
```

### 4.2 建表 DDL

#### 4.2.1 用户表

```sql
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,             -- bcrypt 加密
  avatar      VARCHAR(255) DEFAULT NULL,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.2 账单表

```sql
CREATE TABLE bills (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,             -- 金额，支持两位小数
  category    ENUM('food', 'other') NOT NULL,      -- 消费板块
  bill_date   DATE          NOT NULL,              -- 消费日期
  note        VARCHAR(100)  DEFAULT NULL,          -- 备注，限100字
  tags        JSON          DEFAULT NULL,          -- 标签：["big_spend","impulse"]
  is_overeat  TINYINT(1)    DEFAULT 0,             -- 热量超标标记
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, bill_date),        -- 按用户+日期查询
  INDEX idx_user_category (user_id, category),     -- 按板块统计
  INDEX idx_user_month (user_id, bill_date)        -- 月度查询
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.3 预算表

```sql
CREATE TABLE budgets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  budget_month  CHAR(7)       NOT NULL,            -- 格式：'2026-06'
  total_budget  DECIMAL(10,2) NOT NULL DEFAULT 0,  -- 月度总预算
  reserve_fund  DECIMAL(10,2) NOT NULL DEFAULT 0,  -- 大额备用金
  spent_base    DECIMAL(10,2) NOT NULL DEFAULT 0,  -- 初始已花金额
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_month (user_id, budget_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.4 物价记录表

```sql
CREATE TABLE price_records (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  item_name     VARCHAR(50)   NOT NULL,            -- 物品名称
  unit_price    DECIMAL(10,2) NOT NULL,             -- 单价
  unit          VARCHAR(20)   DEFAULT '斤',         -- 单位：斤/个/瓶/杯
  purchase_date DATE          NOT NULL,             -- 购买日期
  location      VARCHAR(100)  DEFAULT NULL,         -- 购买地点
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_item (user_id, item_name),
  INDEX idx_user_item_date (user_id, item_name, purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.5 社交模式记录表

```sql
CREATE TABLE social_modes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT           NOT NULL,
  mode_date        DATE          NOT NULL,               -- 生效日期
  multiplier       DECIMAL(3,2)  NOT NULL DEFAULT 1.00,  -- 倍率：1.0/1.3/1.5
  reserve_deducted DECIMAL(10,2) NOT NULL DEFAULT 0,     -- 当日从备用金扣除的金额
  created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_date (user_id, mode_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.6 成就表

```sql
CREATE TABLE achievements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(50)   NOT NULL UNIQUE,       -- 成就编码
  name         VARCHAR(50)   NOT NULL,              -- 成就名称
  description  VARCHAR(200)  NOT NULL,              -- 描述
  rarity       TINYINT       NOT NULL DEFAULT 1,    -- 稀有度：1-4星
  icon         VARCHAR(50)   DEFAULT NULL,           -- 图标名称
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.7 用户成就关联表

```sql
CREATE TABLE user_achievements (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT       NOT NULL,
  achievement_id INT       NOT NULL,
  unlocked_at    DATETIME  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_achv (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4.2.8 不透支连续天数记录表

```sql
CREATE TABLE streak_records (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT       NOT NULL,
  current_streak INT     NOT NULL DEFAULT 0,       -- 当前连续天数
  best_streak   INT       NOT NULL DEFAULT 0,       -- 历史最佳
  last_updated  DATE      NOT NULL,                 -- 最后更新日期
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. 核心功能模块设计

### 5.1 预算计算引擎

**文件**：`server/src/services/budget.service.ts`

```typescript
// 核心接口
interface BudgetCalculation {
  dailyAllowance: number;       // 每日可用额度（日常）
  socialAllowance: number;      // 社交模式当日额度
  progress: number;             // 消耗进度（0-1），不受社交模式影响
  isOverdrawn: boolean;         // 是否透支
  overdraftAmount: number;      // 透支金额
  remainingDays: number;        // 本月剩余天数
  totalSpent: number;           // 本月累计已花费（日常部分）
  effectiveBudget: number;      // 有效预算（总预算 - 备用金）
  reserveRemaining: number;     // 备用金剩余
  reserveDeductedToday: number; // 今日从备用金扣除的社交超额
  isSocialMode: boolean;        // 今日是否开启社交模式
  socialMultiplier: number;     // 社交倍率
}

// 计算逻辑
function calculateBudget(userId: number, date: Date): BudgetCalculation {
  // 1. 获取当月预算
  const budget = await getBudget(userId, date);
  // 2. 获取当月账单：日常消费部分（不含社交超额）
  const dailyTotal = await getMonthlyTotal(userId, date, { excludeSocial: true });
  // 3. 获取社交模式信息
  const socialMode = await getSocialMode(userId, date);
  const isSocialMode = socialMode !== null;
  const multiplier = socialMode?.multiplier || 1.0;
  // 4. 获取当日从备用金已扣除的社交超额
  const reserveDeductedToday = socialMode?.reserveDeducted || 0;
  // 5. 计算基础额度
  const effectiveBudget = budget.totalBudget - budget.reserveFund;
  const remainingDays = getMonthEnd(date) - date.getDate() + 1;
  const baseDaily = Math.max((effectiveBudget - dailyTotal) / remainingDays, 0);
  // 6. 社交模式：额度上浮，但日常进度条不受影响
  const dailyAllowance = baseDaily;                              // 日常额度
  const socialAllowance = isSocialMode ? baseDaily * multiplier : baseDaily; // 展示额度
  const progress = effectiveBudget > 0 ? dailyTotal / effectiveBudget : 1;
  // 7. 备用金剩余计算（扣除社交超额 + 可能的日常超支动用）
  const reserveRemaining = dailyTotal > effectiveBudget
    ? budget.reserveFund - (dailyTotal - effectiveBudget) - reserveDeductedToday
    : budget.reserveFund - reserveDeductedToday;

  return {
    dailyAllowance,
    socialAllowance,
    progress: Math.min(progress, 1),
    isOverdrawn: (dailyTotal + reserveDeductedToday) > budget.totalBudget,
    overdraftAmount: Math.max(dailyTotal + reserveDeductedToday - budget.totalBudget, 0),
    remainingDays,
    totalSpent: dailyTotal,
    effectiveBudget,
    reserveRemaining: Math.max(reserveRemaining, 0),
    reserveDeductedToday,
    isSocialMode,
    socialMultiplier: multiplier,
  };
}
```

### 5.2 成就检查引擎

**文件**：`server/src/services/achievement.service.ts`

```typescript
// 成就检查器注册表
const achievementCheckers: Record<string, AchievementChecker> = {
  'calm_week': {
    // 冷静一周：连续7天无冲动消费
    check: async (userId) => {
      const last7Days = await getBills(userId, { days: 7 });
      const hasImpulse = last7Days.some(b => b.tags?.includes('impulse'));
      return !hasImpulse && last7Days.length > 0;
    }
  },
  'savings_master': {
    // 储蓄达人：当月支出 ≤ 预算的80%
    check: async (userId) => {
      const budget = await getBudget(userId, new Date());
      const totalSpent = await getMonthlyTotal(userId, new Date());
      return totalSpent <= budget.totalBudget * 0.8;
    }
  },
  'iron_discipline': {
    // 铁打的自律：连续30天不透支
    check: async (userId) => {
      const streak = await getStreak(userId);
      return streak.currentStreak >= 30;
    }
  },
  'three_month_no_overdraft': {
    // 三个月无透支
    check: async (userId) => {
      const last3Months = await getMonthlyOverdraftStatus(userId, 3);
      return last3Months.every(m => !m.isOverdrawn);
    }
  },
  'reserve_guardian': {
    // 备用金守护者：连续2个月未动用备用金
    check: async (userId) => {
      const last2Months = await getReserveUsage(userId, 2);
      return last2Months.every(m => m.reserveRemaining === m.reserveFund);
    }
  },
  'bookkeeping_star': {
    // 记账标兵：连续30天每天都有记账记录
    check: async (userId) => {
      const last30Days = await getDistinctBillDays(userId, 30);
      return last30Days >= 30;
    }
  },
  'price_detective': {
    // 物价侦探：累计录入20条物价记录
    check: async (userId) => {
      const count = await getPriceRecordCount(userId);
      return count >= 20;
    }
  },
};
```

### 5.3 物价匹配引擎

**文件**：`server/src/services/price.service.ts`

```typescript
interface PriceHint {
  itemName: string;
  currentPrice: number;
  avgPrice: number;
  diffPercent: number;    // 差异百分比，正数表示涨价
  trend: 'up' | 'down' | 'stable';
}

async function matchPrice(
  userId: number,
  billNote: string,
  billCategory: string
): Promise<PriceHint | null> {
  // 1. 从备注中提取物品关键词
  const keywords = extractItemKeywords(billNote);
  if (keywords.length === 0) return null;

  // 2. 查找匹配的物价记录
  for (const keyword of keywords) {
    const records = await getPriceRecords(userId, keyword);
    if (records.length < 2) continue; // 至少需要2条记录才能计算均价

    const avgPrice = records.reduce((s, r) => s + r.unitPrice, 0) / records.length;
    const currentPrice = billNote中提取的单价; // 简单正则匹配

    if (currentPrice > 0) {
      const diffPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
      return {
        itemName: keyword,
        currentPrice,
        avgPrice: Math.round(avgPrice * 100) / 100,
        diffPercent: Math.round(diffPercent),
        trend: diffPercent > 5 ? 'up' : diffPercent < -5 ? 'down' : 'stable',
      };
    }
  }
  return null;
}
```

### 5.4 定时任务

**文件**：`server/src/jobs/`

```typescript
// 每日凌晨 00:05 执行
import cron from 'node-cron';

// 任务1：连续不透支天数更新
cron.schedule('5 0 * * *', async () => {
  const users = await getAllUsers();
  for (const user of users) {
    const calc = await calculateBudget(user.id, new Date());
    const streak = await getStreak(user.id);

    if (calc.isOverdrawn) {
      // 透支：归零
      streak.currentStreak = 0;
    } else {
      // 未透支：+1，更新最佳记录
      streak.currentStreak += 1;
      streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
    }
    streak.lastUpdated = new Date();
    await saveStreak(streak);
  }
});

// 任务2：月初预算重置提醒（每月1号）
cron.schedule('0 9 1 * *', async () => {
  // 发送提醒：上个月预算已结束，请设置本月预算
});
```

---

## 6. 前端页面设计

### 6.1 首页（Dashboard）—— 卡片按钮模式

**设计理念**：首页克制精简，每张卡片展示摘要 + 「详情▸」按钮，点击进入对应详情页。桌面端使用 2-3 列栅格布局，移动端自动折叠为单列。

```
桌面端（≥ 1024px）：
┌──────────────────────────────────────────────────────────┐
│  🏠 个人记账                    👤 小明  [本月预算 ▸]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ 🔥 连续不透支 ────┐  ┌─ 📊 日常消耗进度 ────┐       │
│  │  已坚持 17/30 天   │  │  已花 ¥1,430/¥2,200  │       │
│  │  ████████░░░░ 57% │  │  ████████░░░░ 65%    │       │
│  │       [详情▸]      │  │  今日可用 ¥25.8      │       │
│  └────────────────────┘  │       [详情▸]         │       │
│                          └──────────────────────┘       │
│  ┌─ 💧 备用金 ──────────┐  ┌─ 🎯 社交模式 ───────┐      │
│  │  ¥450 / ¥500        │  │  当前：关闭          │      │
│  │  已用 ¥50           │  │  [开启社交模式]      │      │
│  │       [详情▸]        │  │  多花部分从备用金扣  │      │
│  └──────────────────────┘  └──────────────────────┘      │
│                                                          │
│  ┌─ ⚠️ 警示看板 ──────────┐  ┌─ 🔍 物价雷达 ───────┐     │
│  │  🔴 06-12 外卖 ¥89    │  │  📈 苹果 ↑24%       │     │
│  │     冲动消费          │  │  📉 猪肉 ↓8%        │     │
│  │  🟡 06-10 聚餐 ¥156   │  │  📊 牛奶 → 持平     │     │
│  │     大宗消费          │  │       [详情▸]         │     │
│  │       [详情▸]          │  └──────────────────────┘     │
│  └────────────────────────┘                              │
│                                                          │
│  ┌─ 🏆 成就概览 ──────────────────────────────────┐     │
│  │  ⭐ 冷静一周  ⭐ 储蓄达人  🔒 铁打的自律 ...   │     │
│  │  已解锁 3/7 枚                        [详情▸]  │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│                                        [+ 记一笔]        │
└──────────────────────────────────────────────────────────┘
│  🏠首页  📋账单  📊看板  🏆成就  🔍物价  ⚙️设置        │
└──────────────────────────────────────────────────────────┘

移动端（< 768px）：卡片自动折叠为单列，每张卡片占满宽度
```

**DashboardCard 通用组件设计**：

```typescript
interface DashboardCardProps {
  title: string;
  icon: string;
  summary: React.ReactNode;    // 摘要内容（进度条/数字/文字）
  detailPath: string;          // 点击跳转的详情页路由
  badge?: string;              // 可选角标（如"新"、"⚠️"）
}
```

### 6.2 记账录入页（Record）

```
桌面端居中弹窗（Modal）形式，不跳页：
┌──────────────────────────────────────────┐
│  ← 返回          记一笔                  │
├──────────────────────────────────────────┤
│                                          │
│  ┌─ 消费板块 ──────────────────────┐    │
│  │  [🍚 日常饮食]  [🛒 其他消费]    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 金额 ──────────────────────────┐    │
│  │         ¥ ______.__             │    │
│  │  [¥15] [¥25] [¥50] [¥100]      │    │
│  └──────────────────────────────────┘    │
│                                          │
│  日期：2026-06-13  📅                    │
│                                          │
│  备注（可选）：__________________        │
│                                          │
│  标签：☐ 大宗消费  ☐ 冲动消费           │
│  ☐ 热量超标（仅饮食板块显示）           │
│                                          │
│  💡 上次苹果 ¥5.8/斤，这次 ↑24%         │
│                                          │
│  [ 确认记账 ]                            │
└──────────────────────────────────────────┘
```

### 6.3 预算详情页（BudgetDetail）

从首页「日常消耗进度」卡片点击进入：

```
┌──────────────────────────────────────────┐
│  ← 返回        预算详情                  │
├──────────────────────────────────────────┤
│                                          │
│  ┌─ 日常消耗进度 ──────────────────┐    │
│  │  ██████████████████░░░░  72%     │    │
│  │  已花 ¥1,584 / 可用 ¥2,200       │    │
│  │  剩余 ¥616，日均可用 ¥36.2       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 每日额度变化（近7天）──────────┐    │
│  │  ∧  ┌─┬─┬─┬─┬─┬─┬─┐          │    │
│  │  │  │ │ │█│ │ │█│ │          │    │
│  │  │  └─┴─┴─┴─┴─┴─┴─┘          │    │
│  │  └─────────────────────       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 各板块花费明细 ───────────────┐    │
│  │  🍚 日常饮食    ¥1,024  64.6%  │    │
│  │  🛒 其他消费    ¥560    35.4%  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [修改预算]                              │
└──────────────────────────────────────────┘
```

### 6.4 备用金详情页（ReserveDetail）

从首页「备用金」卡片点击进入：

```
┌──────────────────────────────────────────┐
│  ← 返回        备用金详情                │
├──────────────────────────────────────────┤
│                                          │
│  💧 备用金剩余：¥450 / ¥500              │
│  ██████████████████░░  10% 已使用        │
│                                          │
│  ┌─ 使用明细 ──────────────────────┐    │
│  │  06-12  社交超额    -¥30        │    │
│  │  06-08  社交超额    -¥20        │    │
│  │  本月合计已用      ¥50          │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 历史备用金使用趋势 ───────────┐    │
│  │  近6月：█ █ ▁ ▃ ▁ ▂           │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### 6.5 物价雷达页面（PriceRadar）

从底部导航「物价」进入，包含独立录入功能：

```
┌──────────────────────────────────────────┐
│  ← 返回      物价雷达    [+ 录入物价]    │
├──────────────────────────────────────────┤
│                                          │
│  ┌─ 本月涨幅 Top 5 ───────────────┐    │
│  │  1. 🍎 苹果   ¥7.2  ↑24%      │    │
│  │  2. 🥛 牛奶   ¥4.5  ↑12%      │    │
│  │  3. 🍌 香蕉   ¥3.8  ↑8%       │    │
│  │  4. 🥩 猪肉   ¥15.2 ↓5%       │    │
│  │  5. ☕ 咖啡   ¥9.9  ↓3%       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 苹果 价格走势 ────────────────┐    │
│  │  ∧                             │    │
│  │  │  ●──●──●──●──●             │    │
│  │  │ /                   均价¥6.2│    │
│  │  └─────────────────────       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 我的物品列表 ────────────────┐    │
│  │  🍎 苹果  最新¥7.2  均价¥6.2  │    │
│  │  🥛 牛奶  最新¥4.5  均价¥4.0  │    │
│  │  ...                          │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### 6.6 物价录入页（PriceRecord）

从物价雷达页面顶部「+ 录入物价」进入，独立于记账流程：

```
┌──────────────────────────────────────────┐
│  ← 返回        录入物价                  │
├──────────────────────────────────────────┤
│                                          │
│  物品名称：[___________]  [快速选择 ▾]   │
│  单    价：[______] 元 / [斤 ▾]          │
│  购买日期：[2026-06-13 📅]               │
│  购买地点：[___________]（可选）          │
│                                          │
│  [保存]                                  │
└──────────────────────────────────────────┘
```

---

## 7. 路由设计

### 7.1 前端路由

```typescript
// client/src/router.tsx
const routes = [
  // 底部导航栏页面
  { path: '/',              element: <Home />,            meta: { title: '首页', tab: true, icon: '🏠' } },
  { path: '/bills',         element: <BillList />,        meta: { title: '账单', tab: true, icon: '📋' } },
  { path: '/stats',         element: <Stats />,           meta: { title: '看板', tab: true, icon: '📊' } },
  { path: '/achievements',  element: <Achievement />,     meta: { title: '成就', tab: true, icon: '🏆' } },
  { path: '/price',         element: <PriceRadar />,      meta: { title: '物价', tab: true, icon: '🔍' } },
  { path: '/settings',      element: <Settings />,        meta: { title: '设置', tab: true, icon: '⚙️' } },
  // 功能页面（非底部导航）
  { path: '/record',        element: <Record />,          meta: { title: '记一笔' } },
  { path: '/record/:id',    element: <Record />,          meta: { title: '编辑账单' } },
  { path: '/bills/:id',     element: <BillDetail />,      meta: { title: '账单详情' } },
  { path: '/budget',        element: <Budget />,          meta: { title: '预算设置' } },
  { path: '/budget/detail', element: <BudgetDetail />,    meta: { title: '预算详情' } },
  { path: '/reserve/detail',element: <ReserveDetail />,   meta: { title: '备用金详情' } },
  { path: '/streak/detail', element: <StreakDetail />,    meta: { title: '不透支记录' } },
  { path: '/price/record',  element: <PriceRecord />,     meta: { title: '录入物价' } },
  // 认证
  { path: '/login',         element: <Login />,           meta: { title: '登录' } },
];
```

### 7.2 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| **认证** | | |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| **账单** | | |
| GET | `/api/bills` | 账单列表（支持筛选） |
| POST | `/api/bills` | 创建账单 |
| PUT | `/api/bills/:id` | 更新账单 |
| DELETE | `/api/bills/:id` | 删除账单 |
| DELETE | `/api/bills/batch` | 批量删除 |
| **预算** | | |
| GET | `/api/budgets/current` | 获取当月预算 |
| PUT | `/api/budgets/current` | 设置/更新预算 |
| GET | `/api/budgets/calculate` | 计算每日额度 |
| **社交模式** | | |
| GET | `/api/social/today` | 获取今日社交模式 |
| POST | `/api/social/toggle` | 开启/关闭社交模式 |
| **首页聚合** | | |
| GET | `/api/dashboard` | 首页全部数据（进度条/警示/备用金） |
| **统计** | | |
| GET | `/api/stats/overview` | 收支概览 |
| GET | `/api/stats/trend` | 消费趋势 |
| GET | `/api/stats/tags` | 标签统计 |
| **成就** | | |
| GET | `/api/achievements` | 成就列表（含解锁状态） |
| **物价** | | |
| GET | `/api/prices` | 物价记录列表 |
| POST | `/api/prices` | 新增物价记录 |
| GET | `/api/prices/hint` | 物价匹配提示（记账时调用） |
| GET | `/api/prices/trend/:item` | 单物品价格趋势 |
| GET | `/api/prices/ranking` | 本月涨幅排行榜 |
| **备用金** | | |
| GET | `/api/reserve/detail` | 备用金使用明细 |
| GET | `/api/reserve/history` | 备用金历史趋势 |
| **不透支** | | |
| GET | `/api/streak/detail` | 连续不透支详情（含热力图） |
| **导出** | | |
| GET | `/api/export/csv` | 导出 CSV |
| GET | `/api/export/pdf` | 导出 PDF 月报 |

---

## 8. 核心算法与公式

### 8.1 每日可用额度

```
基础日常额度 = (totalBudget - reserveFund - dailyTotalSpent) / remainingDays
```

其中：
- `totalBudget`：月度总预算
- `reserveFund`：大额备用金（从日常盘子剔除）
- `dailyTotalSpent`：本月日常累计已花费（不含社交超额部分）
- `remainingDays`：当月总天数 - 当前日期 + 1

### 8.2 社交模式额度（V1.1 修订）

```
社交展示额度 = 基础日常额度 × multiplier（1.3 或 1.5）
社交超额 = max(当日实际花费 - 基础日常额度, 0)
```

**核心规则**：
- 社交模式当天，额度展示上浮，但日常消耗进度条**不受影响**
- 当日实际花费超出基础日常额度的部分，**从备用金中扣除**
- 即：多花的钱走备用金通道，不动日常预算盘子
- 备用金扣除记录到 `social_modes.reserve_deducted` 字段

### 8.3 日常消耗进度

```
progress = dailyTotalSpent / (totalBudget - reserveFund)
```

- 不受社交模式影响，始终保持"真实生存刻度"
- 0-50%：绿色（安全区）
- 50-80%：橙色（警示区）
- 80-100%：红色（危险区）
- >100%：深红色（透支区）

### 8.4 备用金剩余计算（V1.1 修订）

```
reserveRemaining = reserveFund
  - max(dailyTotalSpent - effectiveBudget, 0)    // 日常超支动用
  - socialModeReserveDeducted                     // 社交模式超额扣除
```

其中 `effectiveBudget = totalBudget - reserveFund`。

### 8.5 不透支判定

```
某天透支 = 当日累计日常花费 > effectiveBudget × (已过天数 / 当月总天数)
```

即：按时间进度比例，日常花费超过了预算分配的速度（不包含社交超额，因为那是备用金出的）。

### 8.6 社交模式倍率

- 用户手动选择倍率（1.3 或 1.5）
- 记录到 `social_modes` 表
- 仅当日有效，次日 00:00 自动清除
- 当日社交超额自动从备用金扣除，记录到 `reserve_deducted`

---

## 9. 安全与性能

### 9.1 安全措施

| 措施 | 实现方式 |
|------|----------|
| 密码加密 | bcrypt（salt rounds=10） |
| JWT Token | 7天有效期，httpOnly cookie |
| SQL 注入防护 | Sequelize ORM 参数化查询 |
| XSS 防护 | 前端默认 React JSX 转义 + Helmet 安全头 |
| 输入校验 | Zod schema，前后端双重校验 |
| 请求限流 | express-rate-limit（API 60次/分钟） |
| CORS | 白名单配置 |

### 9.2 性能优化

| 优化项 | 方案 |
|--------|------|
| 数据库索引 | user_id + bill_date 联合索引 |
| 首页聚合 | `/api/dashboard` 单接口返回全部数据，减少请求数 |
| 图表渲染 | ECharts 按需加载，数据量 >100 条时采样 |
| 列表分页 | 游标分页（cursor-based），避免 OFFSET 性能问题 |
| 静态资源 | Vite 构建产物 gzip 压缩 |
| 月度汇总缓存 | 每日定时任务预计算，首页直接读取 |

---

## 10. 部署方案

### 10.1 环境要求

| 组件 | 要求 |
|------|------|
| 操作系统 | Windows / Linux / macOS |
| Node.js | ≥ 20 LTS |
| MySQL | ≥ 8.0 |
| 内存 | ≥ 2GB（开发）/ ≥ 4GB（生产） |

### 10.2 本地开发启动

```bash
# 1. 克隆项目
git clone <repo-url>
cd personal-accounting

# 2. 在项目根目录安装前后端依赖
npm ci

# 3. 配置数据库
# 修改 server/.env 中的数据库连接信息
cp server/.env.example server/.env

# 4. 初始化数据库（数据库本身需提前创建）
npm run db:migrate --workspace accounting-server
npm run db:seed --workspace accounting-server

# 5. 启动开发服务器
# 终端1：后端
npm run dev:server               # http://localhost:3001

# 终端2：前端
npm run dev:client               # http://localhost:5173
```

### 10.3 环境变量

```bash
# server/.env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=accounting_app
DB_PASSWORD=replace_with_a_strong_database_password
DB_NAME=accounting
JWT_SECRET=replace_with_a_random_secret_of_at_least_32_chars
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
PORT=3001
```

### 10.4 生产部署

```bash
# 构建前端
cd client && npm run build    # 输出到 client/dist/

# 后端生产启动
cd server && npm run build && npm start

# 使用 PM2 守护进程
pm2 start dist/app.js --name accounting-api

# Nginx 反向代理配置
# /api/* → localhost:3001
# /*     → client/dist/
```

---

> *— 方案结束 —*
