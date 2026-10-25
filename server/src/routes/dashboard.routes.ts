import { Router, Response } from 'express';
import { Op } from 'sequelize';
import Bill from '../models/Bill';
import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import StreakRecord from '../models/StreakRecord';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { calculateBudget } from '../services/budget.service';
import { getMonthlyOverview, getTrendData, getDailyTrend, getTagStats } from '../services/stats.service';
import { getPriceRanking } from '../services/price.service';
import { getMonthKey } from '../utils/date';

const router = Router();
router.use(authMiddleware);

// 首页聚合
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const date = new Date();
    const monthKey = getMonthKey(date);

    // 预算计算
    const budgetCalc = await calculateBudget(req.userId!, date);

    // 连续不透支
    const streak = await StreakRecord.findOne({ where: { user_id: req.userId } });

    // 最近警示（大宗/冲动消费）
    const alertBills = await Bill.findAll({
      where: {
        user_id: req.userId,
        bill_date: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      order: [['bill_date', 'DESC'], ['created_at', 'DESC']],
      limit: 10,
    });
    const alerts = alertBills.filter((b) => {
      const tags = b.tags as string[] | null;
      return tags && (tags.includes('big_spend') || tags.includes('impulse'));
    }).slice(0, 5);

    // 物价摘要
    const priceRanking = await getPriceRanking(req.userId!, monthKey);

    // 成就摘要
    const allAchievements = await Achievement.findAll();
    const userAchievements = await UserAchievement.findAll({
      where: { user_id: req.userId },
    });
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

    // 今日社交模式（已移除）

    res.json({
      code: 200,
      data: {
        budget: budgetCalc,
        streak: streak
          ? {
              current: streak.current_streak,
              best: streak.best_streak,
            }
          : { current: 0, best: 0 },
        alerts,
        priceRanking: priceRanking.slice(0, 3),
        achievements: {
          unlocked: userAchievements.length,
          total: allAchievements.length,
          latest: allAchievements
            .filter((a) => unlockedIds.has(a.id))
            .slice(-3),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 收支概览
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getMonthKey(new Date());
    const overview = await getMonthlyOverview(req.userId!, monthKey);
    res.json({ code: 200, data: overview });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 消费趋势
router.get('/stats/trend', async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const type = req.query.type as string;

    if (type === 'daily') {
      const dailyTrend = await getDailyTrend(req.userId!, 30);
      return res.json({ code: 200, data: dailyTrend });
    }

    const trend = await getTrendData(req.userId!, months);
    res.json({ code: 200, data: trend });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 标签统计
router.get('/stats/tags', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getMonthKey(new Date());
    const stats = await getTagStats(req.userId!, monthKey);
    res.json({ code: 200, data: stats });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
