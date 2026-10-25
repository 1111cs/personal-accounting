import { Router, Response } from 'express';
import StreakRecord from '../models/StreakRecord';
import Bill from '../models/Bill';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 连续不透支详情
router.get('/streak/detail', async (req: AuthRequest, res: Response) => {
  try {
    const streak = await StreakRecord.findOne({ where: { user_id: req.userId } });

    // 近 60 天热力图数据
    const days = 60;
    const heatmapData: { date: string; count: number; overdrawn: boolean }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayBills = await Bill.findAll({
        where: { user_id: req.userId, bill_date: dateStr },
      });
      const spent = dayBills.reduce((sum, b) => sum + Number(b.amount), 0);

      // 判断是否有冲动消费
      const hasImpulse = dayBills.some((b) => {
        const tags = b.tags as string[] | null;
        return tags && tags.includes('impulse');
      });

      const hasRecord = dayBills.length > 0 && spent > 0;

      heatmapData.push({
        date: dateStr,
        count: hasRecord ? 1 : 0,
        overdrawn: hasRecord && hasImpulse, // 有消费且有冲动标签 → 标记为透支
      });
    }

    res.json({
      code: 200,
      data: {
        current: streak?.current_streak || 0,
        best: streak?.best_streak || 0,
        lastUpdated: streak?.last_updated || null,
        heatmap: heatmapData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
