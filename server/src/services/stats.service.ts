import { Op, fn, col, literal } from 'sequelize';
import Bill from '../models/Bill';
import Budget from '../models/Budget';
import { getMonthKey, getDaysInMonth } from '../utils/date';

export async function getMonthlyOverview(userId: number, monthKey: string) {
  const daysInMonth = getDaysInMonth(`${monthKey}-01`);
  const dateEnd = `${monthKey}-${String(daysInMonth).padStart(2, '0')}`;
  const dateRange = { [Op.between]: [`${monthKey}-01`, dateEnd] };

  const totalResult = await Bill.sum('amount', {
    where: { user_id: userId, bill_date: dateRange },
  });
  const totalSpent = Number(totalResult) || 0;

  const billCount = await Bill.count({
    where: { user_id: userId, bill_date: dateRange },
  });

  // 日均支出 = 本月总支出 / 有消费记录的天数
  const spentDaysResult = await Bill.findAll({
    attributes: [[fn('DISTINCT', col('bill_date')), 'bill_date']],
    where: { user_id: userId, bill_date: dateRange, amount: { [Op.gt]: 0 } },
    raw: true,
  });
  const spentDays = spentDaysResult.length;
  const dailyAvg = spentDays > 0 ? totalSpent / spentDays : 0;

  const maxBill = await Bill.findOne({
    where: { user_id: userId, bill_date: dateRange },
    order: [['amount', 'DESC']],
  });

  // 板块分布
  const foodTotal = await Bill.sum('amount', {
    where: { user_id: userId, bill_date: dateRange, category: 'food' },
  });
  const otherTotal = await Bill.sum('amount', {
    where: { user_id: userId, bill_date: dateRange, category: 'other' },
  });

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    billCount,
    dailyAvg: Math.round(dailyAvg * 100) / 100,
    maxSingle: maxBill ? Math.round(Number(maxBill.amount) * 100) / 100 : 0,
    foodTotal: Math.round((Number(foodTotal) || 0) * 100) / 100,
    otherTotal: Math.round((Number(otherTotal) || 0) * 100) / 100,
  };
}

export async function getTrendData(userId: number, months: number = 6) {
  const result: { month: string; amount: number; impulseCount: number; bigSpendCount: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = getMonthKey(d);

    const totalResult = await Bill.sum('amount', {
      where: {
        user_id: userId,
        bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(d)}`] },
      },
    });

    // 冲动消费和大宗消费
    const bills = await Bill.findAll({
      where: {
        user_id: userId,
        bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-${getDaysInMonth(d)}`] },
      },
    });

    let impulseCount = 0;
    let bigSpendCount = 0;
    for (const b of bills) {
      const tags = b.tags as string[] | null;
      if (tags) {
        if (tags.includes('impulse')) impulseCount++;
        if (tags.includes('big_spend')) bigSpendCount++;
      }
    }

    result.push({
      month: monthKey,
      amount: Math.round((Number(totalResult) || 0) * 100) / 100,
      impulseCount,
      bigSpendCount,
    });
  }

  return result;
}

export async function getDailyTrend(userId: number, days: number = 30) {
  const result: { date: string; amount: number; hasImpulse: boolean }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const totalResult = await Bill.sum('amount', {
      where: { user_id: userId, bill_date: dateStr },
    });

    const bills = await Bill.findAll({
      where: { user_id: userId, bill_date: dateStr },
    });
    const hasImpulse = bills.some((b) => {
      const tags = b.tags as string[] | null;
      return tags && tags.includes('impulse');
    });

    result.push({
      date: dateStr,
      amount: Math.round((Number(totalResult) || 0) * 100) / 100,
      hasImpulse,
    });
  }

  return result;
}

export async function getTagStats(userId: number, monthKey: string) {
  const daysInMonth = getDaysInMonth(`${monthKey}-01`);
  const dateEnd = `${monthKey}-${String(daysInMonth).padStart(2, '0')}`;

  const bills = await Bill.findAll({
    where: {
      user_id: userId,
      bill_date: { [Op.between]: [`${monthKey}-01`, dateEnd] },
    },
  });

  let impulseCount = 0;
  let impulseAmount = 0;
  let bigSpendCount = 0;
  let bigSpendAmount = 0;

  for (const b of bills) {
    const tags = b.tags as string[] | null;
    const amount = Number(b.amount);
    if (tags) {
      if (tags.includes('impulse')) {
        impulseCount++;
        impulseAmount += amount;
      }
      if (tags.includes('big_spend')) {
        bigSpendCount++;
        bigSpendAmount += amount;
      }
    }
  }

  // 上月对比
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const prevMonthKey = getMonthKey(d);
  const prevBills = await Bill.findAll({
    where: {
      user_id: userId,
      bill_date: { [Op.between]: [`${prevMonthKey}-01`, `${prevMonthKey}-${getDaysInMonth(d)}`] },
    },
  });

  let prevImpulseCount = 0;
  let prevBigSpendCount = 0;
  for (const b of prevBills) {
    const tags = b.tags as string[] | null;
    if (tags) {
      if (tags.includes('impulse')) prevImpulseCount++;
      if (tags.includes('big_spend')) prevBigSpendCount++;
    }
  }

  const impulseChange = prevImpulseCount > 0
    ? ((impulseCount - prevImpulseCount) / prevImpulseCount * 100)
    : (impulseCount > 0 ? 100 : 0);
  const bigSpendChange = prevBigSpendCount > 0
    ? ((bigSpendCount - prevBigSpendCount) / prevBigSpendCount * 100)
    : (bigSpendCount > 0 ? 100 : 0);

  return {
    impulse: {
      count: impulseCount,
      amount: Math.round(impulseAmount * 100) / 100,
      changePercent: Math.round(impulseChange),
    },
    bigSpend: {
      count: bigSpendCount,
      amount: Math.round(bigSpendAmount * 100) / 100,
      changePercent: Math.round(bigSpendChange),
    },
  };
}
