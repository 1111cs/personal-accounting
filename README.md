# 个人记账系统

一个使用 React、Express、TypeScript 和 MySQL 构建的个人记账应用，提供账单记录、动态预算、备用金、消费分析、成就和数据导出等功能。

## 功能

- 账单新增、编辑、筛选与批量删除
- 月度预算、每日可用额度和备用金管理
- 消费趋势、行为标签和物价记录分析
- 连续记账与成就系统
- CSV、PDF 数据导出
- 多用户登录与数据隔离

## 技术栈

- 前端：React 18、TypeScript、Vite、Ant Design、Zustand、ECharts
- 后端：Node.js、Express、TypeScript、Sequelize、MySQL
- 安全：bcrypt、JWT、Helmet、CORS、请求限流

## 环境要求

- Node.js 20.19 或更高版本
- npm 10 或更高版本
- MySQL 8.0 或更高版本

## 本地运行

```bash
git clone <your-repository-url>
cd personal-accounting
npm ci
```

复制后端环境变量模板并填写本机配置：

```bash
cp server/.env.example server/.env
```

首次运行时初始化数据库并写入系统成就数据：

```bash
npm run db:migrate --workspace accounting-server
npm run db:seed --workspace accounting-server
```

分别启动后端和前端：

```bash
npm run dev:server
npm run dev:client
```

默认地址：

- 前端：<http://localhost:5173>
- 后端：<http://localhost:3001>
- 健康检查：<http://localhost:3001/api/health>

## 配置说明

所有私密配置仅保存在 `server/.env`。该文件已被 Git 忽略，不应提交。公开配置项请参考 [`server/.env.example`](server/.env.example)。

生产环境至少需要修改：

- `DB_USER`、`DB_PASSWORD`、`DB_NAME`
- `JWT_SECRET`：使用至少 32 位的随机字符串
- `CORS_ORIGINS`：填写实际前端域名，多个域名用英文逗号分隔

## 开发命令

```bash
npm run typecheck   # 前后端 TypeScript 检查
npm test            # 后端基础单元测试
npm run build       # 构建前后端
npm run check       # 依次执行以上检查
```

## 项目结构

```text
.
├── client/                  # React 前端
├── server/                  # Express 后端
│   └── src/
│       ├── config/          # 环境与数据库配置
│       ├── jobs/            # 定时任务
│       ├── middleware/      # 鉴权、校验和错误处理
│       ├── models/          # Sequelize 模型
│       ├── routes/          # API 路由
│       ├── scripts/         # 显式数据库迁移与种子脚本
│       ├── services/        # 业务逻辑
│       └── utils/           # 通用工具
├── docs/                    # 产品、架构与使用文档
└── .github/workflows/       # 持续集成
```

## 文档

- [产品需求](docs/product-requirements.md)
- [架构设计](docs/architecture.md)
- [功能说明](docs/user-guide.md)

## 安全提示

- 不要提交 `.env`、数据库导出、账单 CSV/PDF 或真实用户数据。
- 如果密钥曾被提交到远程仓库，应立即轮换，而不是只从最新提交中删除。
- 生产部署前应使用独立的低权限数据库账号，并通过 HTTPS 提供服务。

## 许可证

本项目使用 [MIT License](LICENSE)。
