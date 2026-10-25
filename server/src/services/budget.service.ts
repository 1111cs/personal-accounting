import { Op, fn, col, literal } from 'sequelize';
import Bill from '../models/Bill';
import Budget from '../models/Budget';
import { getRemainingDays, getDaysInMonth, getMonthKey } from '../utils/date';

export interface BudgetCalculation {
  dailyAllowance: number;
  progress: number;
  isOverdrawn: boolean;
  overdraftAmount: number;
  remainingDays: number;
  totalSpent: number;
  effectiveBudget: number;
  reserveFund: number;
  reserveRemaining: number;
  dailyOverspent: number;
  reserveOverspent: number;
}

export async function calculateBudget(userId: number, date: Date | string): Promise<BudgetCalculation> {
  const monthKey = getMonthKey(date);

  // 1. 获取当月预算
  const budget = await Budget.findOne({
    where: { user_id: userId, budget_month: monthKey },
  });

  if (!budget) {
    return {
      dailyAllowance: 0,
      progress: 0,
      isOverdrawn: false,
      overdraftAmount: 0,
      remainingDays: getRemainingDays(date),
      totalSpent: 0,
      effectiveBudget: 0,
      reserveFund: 0,
      reserveRemaining: 0,
      dailyOverspent: 0,
      reserveOverspent: 0,
    };
  }

  const totalBudget = Number(budget.total_budget);
  const reserveFund = Number(budget.reserve_fund);
  const spentBase = Number(budget.spent_base);
  const effectiveBudget = totalBudget - reserveFund;
  const remainingDays = getRemainingDays(date);

  // 2. 获取当月日常消费总额（source = 'daily' 或未设置 source 的账单）
  const dailyTotalResult = await Bill.sum('amount', {
    where: {
      user_id: userId,
      bill_date: {
        [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(date)}`],
      },
      source: { [Op.or]: ['daily', null] },
    },
  });
  const dailyTotal = Number(dailyTotalResult) || 0;

  // 3. 获取当月备用金消费总额（source = 'reserve'）
  const reserveTotalResult = await Bill.sum('amount', {
    where: {
      user_id: userId,
      bill_date: {
        [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(date)}`],
      },
      source: 'reserve',
    },
  });
  const reserveTotal = Number(reserveTotalResult) || 0;

  // 4. 计算
  const totalDailySpent = dailyTotal + spentBase;
  const baseDaily = remainingDays > 0
    ? Math.max((effectiveBudget - totalDailySpent) / remainingDays, 0)
    : 0;

  const dailyAllowance = baseDaily;
  const progress = effectiveBudget > 0 ? totalDailySpent / effectiveBudget : 1;

  // 备用金剩余 = 备用金额度 - 备用金消费
  const reserveRemaining = Math.max(reserveFund - reserveTotal, -reserveFund);

  // 日常透支金额
  const dailyOverspent = Math.max(totalDailySpent - effectiveBudget, 0);
  // 备用金透支金额
  const reserveOverspent = Math.max(reserveTotal - reserveFund, 0);

  const totalAllSpent = totalDailySpent + reserveTotal;
  const isOverdrawn = totalAllSpent > totalBudget;
  const overdraftAmount = Math.max(totalAllSpent - totalBudget, 0);

  return {
    dailyAllowance: Math.round(dailyAllowance * 100) / 100,
    progress: Math.round(progress * 100) / 100,
    isOverdrawn,
    overdraftAmount: Math.round(overdraftAmount * 100) / 100,
    remainingDays,
    totalSpent: Math.round(totalDailySpent * 100) / 100,
    effectiveBudget: Math.round(effectiveBudget * 100) / 100,
    reserveFund: Math.round(reserveFund * 100) / 100,
    reserveRemaining: Math.round(reserveRemaining * 100) / 100,
    dailyOverspent: Math.round(dailyOverspent * 100) / 100,
    reserveOverspent: Math.round(reserveOverspent * 100) / 100,
  };
}

export async function getDailyAllowanceHistory(userId: number, monthKey: string) {
  const budget = await Budget.findOne({
    where: { user_id: userId, budget_month: monthKey },
  });
  if (!budget) return [];

  const daysInMonth = getDaysInMonth(`${monthKey}-01`);
  const effectiveBudget = Number(budget.total_budget) - Number(budget.reserve_fund);
  const spentBase = Number(budget.spent_base);
  const history: { date: string; allowance: number }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayTotalResult = await Bill.sum('amount', {
      where: {
        user_id: userId,
        bill_date: { [Op.lte]: dateStr },
      },
    });
    const spentToDate = Number(dayTotalResult) || 0;
    const remaining = daysInMonth - day + 1;
    const allowance = remaining > 0
      ? Math.max((effectiveBudget - spentToDate - spentBase) / remaining, 0)
      : 0;

    history.push({
      date: dateStr,
      allowance: Math.round(allowance * 100) / 100,
    });
  }

  return history;
}
