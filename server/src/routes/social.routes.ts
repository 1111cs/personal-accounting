import { Router, Response } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import SocialMode from '../models/SocialMode';
import Bill from '../models/Bill';
import Budget from '../models/Budget';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { calculateBudget } from '../services/budget.service';
import { getMonthKey, getDaysInMonth, getToday } from '../utils/date';

const router = Router();
router.use(authMiddleware);

const toggleSchema = z.object({
  multiplier: z.number().refine((v) => v === 1.3 || v === 1.5, {
    message: '倍率只能为 1.3 或 1.5',
  }),
});

// 获取今日社交模式
router.get('/today', async (req: AuthRequest, res: Response) => {
  try {
    const today = getToday();
    const mode = await SocialMode.findOne({
      where: { user_id: req.userId, mode_date: today },
    });
    res.json({ code: 200, data: mode || null });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 开启社交模式
router.post('/toggle', validate(toggleSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { multiplier } = req.body;
    const today = getToday();

    // 检查是否已存在
    const existing = await SocialMode.findOne({
      where: { user_id: req.userId, mode_date: today },
    });

    if (existing) {
      // 关闭
      await existing.destroy();
      return res.json({ code: 200, message: '社交模式已关闭', data: null });
    }

    // 开启
    const mode = await SocialMode.create({
      user_id: req.userId!,
      mode_date: today,
      multiplier,
      reserve_deducted: 0,
    });

    res.json({ code: 200, message: `社交模式已开启（×${multiplier}）`, data: mode });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 备用金使用明细
router.get('/reserve-detail', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getMonthKey(new Date());
    const socialModes = await SocialMode.findAll({
      where: {
        user_id: req.userId,
        mode_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-31`] },
        reserve_deducted: { [Op.gt]: 0 },
      },
      order: [['mode_date', 'DESC']],
    });

    const totalDeducted = socialModes.reduce((s, m) => s + Number(m.reserve_deducted), 0);

    res.json({
      code: 200,
      data: {
        list: socialModes,
        totalDeducted: Math.round(totalDeducted * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 备用金历史趋势
router.get('/reserve-history', async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const history: { month: string; reserveUsed: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = getMonthKey(d);
      const daysInMonth = getDaysInMonth(d);

      const deductedResult = await SocialMode.sum('reserve_deducted', {
        where: {
          user_id: req.userId,
          mode_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${daysInMonth}`] },
        },
      });

      history.push({
        month: monthKey,
        reserveUsed: Math.round((Number(deductedResult) || 0) * 100) / 100,
      });
    }

    res.json({ code: 200, data: history });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
