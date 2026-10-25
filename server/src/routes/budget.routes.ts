import { Router, Response } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import Budget from '../models/Budget';
import Bill from '../models/Bill';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { calculateBudget, getDailyAllowanceHistory } from '../services/budget.service';
import { getCurrentMonth, getDaysInMonth, getMonthKey } from '../utils/date';

const router = Router();
router.use(authMiddleware);

const budgetSchema = z.object({
  budget_month: z.string().regex(/^\d{4}-\d{2}$/),
  total_budget: z.number().positive(),
  reserve_fund: z.number().min(0),
  spent_base: z.number().min(0).optional(),
});

// 获取当月预算
router.get('/current', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getCurrentMonth();
    const budget = await Budget.findOne({
      where: { user_id: req.userId, budget_month: monthKey },
    });

    res.json({
      code: 200,
      data: budget || null,
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 设置/更新预算
router.put('/current', validate(budgetSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { budget_month, total_budget, reserve_fund, spent_base } = req.body;

    const [budget] = await Budget.findOrCreate({
      where: { user_id: req.userId, budget_month },
      defaults: {
        user_id: req.userId!,
        budget_month,
        total_budget,
        reserve_fund,
        spent_base: spent_base || 0,
      },
    });

    if (!budget.isNewRecord) {
      await budget.update({ total_budget, reserve_fund, spent_base: spent_base || 0 });
    }

    res.json({ code: 200, message: '预算设置成功', data: budget });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 计算每日额度
router.get('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const result = await calculateBudget(req.userId!, date);
    res.json({ code: 200, data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 每日额度历史
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getCurrentMonth();
    const history = await getDailyAllowanceHistory(req.userId!, monthKey);
    res.json({ code: 200, data: history });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 备用金使用明细（当月 source='reserve' 的账单）
router.get('/reserve/detail', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getCurrentMonth();
    const daysInMonth = getDaysInMonth(`${monthKey}-01`);
    const dateRange = { [Op.between]: [`${monthKey}-01`, `${monthKey}-${daysInMonth}`] };

    const bills = await Bill.findAll({
      where: { user_id: req.userId, bill_date: dateRange, source: 'reserve' },
      order: [['bill_date', 'DESC'], ['created_at', 'DESC']],
    });

    const totalDeducted = bills.reduce((sum, b) => sum + Number(b.amount), 0);

    res.json({
      code: 200,
      data: {
        list: bills.map((b) => ({
          id: b.id,
          amount: Number(b.amount),
          note: b.note,
          bill_date: b.bill_date,
          category: b.category,
        })),
        totalDeducted: Math.round(totalDeducted * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 备用金历史趋势（近N月）
router.get('/reserve/history', async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const result: { month: string; reserveUsed: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = getMonthKey(d);
      const dim = getDaysInMonth(d);

      const sumResult = await Bill.sum('amount', {
        where: {
          user_id: req.userId,
          bill_date: { [Op.between]: [`${mKey}-01`, `${mKey}-${dim}`] },
          source: 'reserve',
        },
      });

      result.push({
        month: mKey,
        reserveUsed: Math.round((Number(sumResult) || 0) * 100) / 100,
      });
    }

    res.json({ code: 200, data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
