import Bill from '../models/Bill';
import StreakRecord from '../models/StreakRecord';
import { checkAllAchievements } from '../services/achievement.service';
import User from '../models/User';

export async function runDailyJobs() {
  console.log(`[${new Date().toISOString()}] 开始执行每日定时任务...`);

  try {
    const users = await User.findAll({ attributes: ['id'] });
    const todayDate = new Date();

    for (const user of users) {
      try {
        // 1. 更新连续不透支天数
        await updateStreak(user.id, todayDate);

        // 2. 检查成就
        const result = await checkAllAchievements(user.id);
        if (result.unlocked.length > 0) {
          console.log(`用户 ${user.id} 解锁新成就: ${result.unlocked.join(', ')}`);
        }
      } catch (err: any) {
        console.error(`用户 ${user.id} 任务执行失败:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] 每日定时任务完成`);
  } catch (error) {
    console.error('定时任务执行失败:', error);
  }
}

async function updateStreak(userId: number, date: Date) {
  let streak = await StreakRecord.findOne({ where: { user_id: userId } });

  if (!streak) {
    streak = await StreakRecord.create({
      user_id: userId,
      current_streak: 0,
      best_streak: 0,
      last_updated: date,
    });
  }

  // 判断昨日是否为"有效冷静日"：有记账行为 + 无冲动消费标签
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const yesterdayBills = await Bill.findAll({
    where: { user_id: userId, bill_date: yesterdayStr },
  });
  const yesterdaySpent = yesterdayBills.reduce((sum, b) => sum + Number(b.amount), 0);

  // 有消费记录才判断
  if (yesterdayBills.length > 0 && yesterdaySpent > 0) {
    // 检查是否有任意一笔账单被打上"冲动消费"标签
    const hasImpulse = yesterdayBills.some((b) => {
      const tags = b.tags as string[] | null;
      return tags && tags.includes('impulse');
    });

    if (hasImpulse) {
      // 有冲动消费，清零连续记录
      streak.current_streak = 0;
    } else {
      // 有效冷静日：有记账 + 非冲动 → +1
      streak.current_streak += 1;
      streak.best_streak = Math.max(streak.best_streak, streak.current_streak);
    }
  }
  // 无消费的日子：不增不减（保持原值）

  streak.last_updated = date;
  await streak.save();
}
