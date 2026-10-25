import { Router, Response } from 'express';
import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取所有成就（含解锁状态）
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const allAchievements = await Achievement.findAll({
      order: [['rarity', 'DESC']],
    });

    const userAchievements = await UserAchievement.findAll({
      where: { user_id: req.userId },
    });
    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievement_id, ua.unlocked_at])
    );

    const result = allAchievements.map((ach) => ({
      ...ach.toJSON(),
      unlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null,
    }));

    res.json({
      code: 200,
      data: {
        list: result,
        unlockedCount: userAchievements.length,
        totalCount: allAchievements.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
