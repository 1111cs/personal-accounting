import { Op } from 'sequelize';
import Bill from '../models/Bill';
import Budget from '../models/Budget';
import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import StreakRecord from '../models/StreakRecord';
import PriceRecord from '../models/PriceRecord';
import SocialMode from '../models/SocialMode';
import { getMonthKey, getDaysInMonth } from '../utils/date';

type CheckResult = { unlocked: string[] };

export async function checkAllAchievements(userId: number): Promise<CheckResult> {
  const achievements = await Achievement.findAll();
  const userAchievements = await UserAchievement.findAll({
    where: { user_id: userId },
  });
  const unlockedCodes = new Set(userAchievements.map((ua) => {
    const ach = achievements.find((a) => a.id === ua.achievement_id);
    return ach?.code || '';
  }));

  const newlyUnlocked: string[] = [];

  for (const ach of achievements) {
    if (unlockedCodes.has(ach.code)) continue;

    let passed = false;
    switch (ach.code) {
      case 'calm_week':
        passed = await checkCalmWeek(userId);
        break;
      case 'savings_master':
        passed = await checkSavingsMaster(userId);
        break;
      case 'iron_discipline':
        passed = await checkIronDiscipline(userId);
        break;
      case 'three_month_no_overdraft':
        passed = await checkThreeMonthNoOverdraft(userId);
        break;
      case 'reserve_guardian':
        passed = await checkReserveGuardian(userId);
        break;
      case 'bookkeeping_star':
        passed = await checkBookkeepingStar(userId);
        break;
      case 'price_detective':
        passed = await checkPriceDetective(userId);
        break;
    }

    if (passed) {
      await UserAchievement.create({
        user_id: userId,
        achievement_id: ach.id,
        unlocked_at: new Date(),
      });
      newlyUnlocked.push(ach.code);
    }
  }

  return { unlocked: newlyUnlocked };
}

async function checkCalmWeek(userId: number): Promise<boolean> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const bills = await Bill.findAll({
    where: {
      user_id: userId,
      bill_date: { [Op.gte]: sevenDaysAgo },
    },
  });
  if (bills.length === 0) return false;
  return !bills.some((b) => {
    const tags = b.tags as string[] | null;
    return tags && tags.includes('impulse');
  });
}

async function checkSavingsMaster(userId: number): Promise<boolean> {
  const monthKey = getMonthKey(new Date());
  const budget = await Budget.findOne({
    where: { user_id: userId, budget_month: monthKey },
  });
  if (!budget) return false;

  const totalResult = await Bill.sum('amount', {
    where: {
      user_id: userId,
      bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(new Date())}`] },
    },
  });
  const totalSpent = (Number(totalResult) || 0) + Number(budget.spent_base);
  return totalSpent <= Number(budget.total_budget) * 0.8;
}

async function checkIronDiscipline(userId: number): Promise<boolean> {
  const streak = await StreakRecord.findOne({ where: { user_id: userId } });
  return streak ? streak.current_streak >= 30 : false;
}

async function checkThreeMonthNoOverdraft(userId: number): Promise<boolean> {
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = getMonthKey(d);
    const budget = await Budget.findOne({
      where: { user_id: userId, budget_month: monthKey },
    });
    if (!budget) return false;

    const totalResult = await Bill.sum('amount', {
      where: {
        user_id: userId,
        bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(d)}`] },
      },
    });
    const totalSpent = (Number(totalResult) || 0) + Number(budget.spent_base);
    if (totalSpent > Number(budget.total_budget)) return false;
  }
  return true;
}

async function checkReserveGuardian(userId: number): Promise<boolean> {
  const now = new Date();
  for (let i = 0; i < 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = getMonthKey(d);
    const budget = await Budget.findOne({
      where: { user_id: userId, budget_month: monthKey },
    });
    if (!budget) return false;

    const reserveDeductedResult = await SocialMode.sum('reserve_deducted', {
      where: {
        user_id: userId,
        mode_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(d)}`] },
      },
    });
    const reserveUsed = Number(reserveDeductedResult) || 0;

    const totalResult = await Bill.sum('amount', {
      where: {
        user_id: userId,
        bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(d)}`] },
      },
    });
    const totalSpent = (Number(totalResult) || 0) + Number(budget.spent_base);
    const effectiveBudget = Number(budget.total_budget) - Number(budget.reserve_fund);
    const dailyOverdraft = Math.max(totalSpent - effectiveBudget, 0);

    if (reserveUsed > 0 || dailyOverdraft > 0) return false;
  }
  return true;
}

async function checkBookkeepingStar(userId: number): Promise<boolean> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const bills = await Bill.findAll({
    attributes: ['bill_date'],
    where: {
      user_id: userId,
      bill_date: { [Op.gte]: thirtyDaysAgo },
    },
    group: ['bill_date'],
  });
  return bills.length >= 30;
}

async function checkPriceDetective(userId: number): Promise<boolean> {
  const count = await PriceRecord.count({ where: { user_id: userId } });
  return count >= 20;
}
