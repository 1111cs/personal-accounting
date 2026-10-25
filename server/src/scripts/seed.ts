import sequelize from '../config/database';
import '../models/index';
import Achievement from '../models/Achievement';

const seedAchievements = [
  { code: 'calm_week', name: '冷静一周', description: '连续 7 天无冲动消费标记', rarity: 1, icon: '🧊' },
  { code: 'savings_master', name: '储蓄达人', description: '当月实际支出 ≤ 预算的 80%', rarity: 2, icon: '💰' },
  { code: 'iron_discipline', name: '铁打的自律', description: '连续 30 天不透支', rarity: 3, icon: '🛡️' },
  { code: 'three_month_no_overdraft', name: '三个月无透支', description: '连续 3 个自然月无透支记录', rarity: 4, icon: '👑' },
  { code: 'reserve_guardian', name: '备用金守护者', description: '连续 2 个月未动用备用金', rarity: 2, icon: '💎' },
  { code: 'bookkeeping_star', name: '记账标兵', description: '连续 30 天每天都有记账记录', rarity: 2, icon: '⭐' },
  { code: 'price_detective', name: '物价侦探', description: '累计录入 20 条物价记录', rarity: 1, icon: '🔍' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    for (const ach of seedAchievements) {
      await Achievement.findOrCreate({
        where: { code: ach.code },
        defaults: ach,
      });
    }
    console.log('成就数据初始化完成');

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

seed();
