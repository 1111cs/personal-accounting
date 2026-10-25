import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import path from 'path';

import sequelize from './config/database';
import './models/index';

import authRoutes from './routes/auth.routes';
import billRoutes from './routes/bill.routes';
import budgetRoutes from './routes/budget.routes';
import socialRoutes from './routes/social.routes';
import priceRoutes from './routes/price.routes';
import dashboardRoutes from './routes/dashboard.routes';
import achievementRoutes from './routes/achievement.routes';
import streakRoutes from './routes/streak.routes';
import exportRoutes from './routes/export.routes';
import { errorHandler } from './middleware/errorHandler';
import { runDailyJobs } from './jobs/dailyBudget';
import { env } from './config/env';

const app = express();
// 安全中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
}));

// 限流
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
}));

app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api', streakRoutes);
app.use('/api', exportRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 数据库连接与启动
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 每日凌晨 00:05 执行定时任务
    cron.schedule('5 0 * * *', runDailyJobs);
    console.log('✅ 定时任务已注册');

    // 启动时立即执行一次，初始化 streak 等数据
    runDailyJobs().catch((err) => console.error('初始化定时任务执行失败:', err));

    app.listen(env.port, () => {
      console.log(`🚀 服务已启动: http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

start();

export default app;
