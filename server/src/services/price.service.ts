import { Op, fn, col } from 'sequelize';
import PriceRecord from '../models/PriceRecord';

export interface PriceHint {
  itemName: string;
  currentPrice: number;
  avgPrice: number;
  diffPercent: number;
  trend: 'up' | 'down' | 'stable';
}

// 常见物品关键词映射
const ITEM_KEYWORDS: Record<string, string> = {
  '苹果': '苹果', 'apple': '苹果',
  '香蕉': '香蕉', 'banana': '香蕉',
  '猪肉': '猪肉', 'pork': '猪肉',
  '鸡胸肉': '鸡胸肉',
  '牛奶': '牛奶', 'milk': '牛奶',
  '咖啡': '咖啡', 'coffee': '咖啡',
  '鸡蛋': '鸡蛋', 'egg': '鸡蛋',
  '面包': '面包', 'bread': '面包',
  '白菜': '白菜',
  '西红柿': '西红柿', '番茄': '西红柿',
  '土豆': '土豆',
  '牛肉': '牛肉', 'beef': '牛肉',
  '酸奶': '酸奶', 'yogurt': '酸奶',
  '橙子': '橙子', 'orange': '橙子',
  '葡萄': '葡萄', 'grape': '葡萄',
};

function extractItemKeywords(note: string): string[] {
  if (!note) return [];
  const keywords: string[] = [];
  const noteLower = note.toLowerCase();
  for (const [key, name] of Object.entries(ITEM_KEYWORDS)) {
    if (noteLower.includes(key.toLowerCase()) && !keywords.includes(name)) {
      keywords.push(name);
    }
  }
  return keywords;
}

function extractPrice(note: string): number | null {
  const patterns = [
    /(?:¥|￥|元)\s*(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*(?:元|块)/,
    /(\d+(?:\.\d+)?)\s*(?:¥|￥)/,
  ];
  for (const pattern of patterns) {
    const match = note.match(pattern);
    if (match) {
      const price = parseFloat(match[1]);
      if (price > 0 && price < 10000) return price;
    }
  }
  return null;
}

export async function matchPrice(
  userId: number,
  billNote: string,
  billCategory: string
): Promise<PriceHint | null> {
  if (!billNote) return null;

  const keywords = extractItemKeywords(billNote);
  if (keywords.length === 0) return null;

  for (const keyword of keywords) {
    const records = await PriceRecord.findAll({
      where: {
        user_id: userId,
        item_name: { [Op.like]: `%${keyword}%` },
      },
      order: [['purchase_date', 'DESC']],
      limit: 20,
    });

    if (records.length < 2) continue;

    const avgPrice = records.reduce((s, r) => s + Number(r.unit_price), 0) / records.length;
    const currentPrice = extractPrice(billNote);

    if (currentPrice !== null && avgPrice > 0) {
      const diffPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
      return {
        itemName: keyword,
        currentPrice,
        avgPrice: Math.round(avgPrice * 100) / 100,
        diffPercent: Math.round(diffPercent),
        trend: diffPercent > 5 ? 'up' : diffPercent < -5 ? 'down' : 'stable',
      };
    }
  }

  return null;
}

export async function getPriceRanking(userId: number, monthKey: string) {
  const records = await PriceRecord.findAll({
    where: {
      user_id: userId,
      purchase_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-31`] },
    },
    order: [['purchase_date', 'DESC']],
  });

  const itemMap = new Map<string, { prices: number[]; unit: string }>();
  for (const r of records) {
    if (!itemMap.has(r.item_name)) {
      itemMap.set(r.item_name, { prices: [], unit: r.unit });
    }
    itemMap.get(r.item_name)!.prices.push(Number(r.unit_price));
  }

  const rankings = Array.from(itemMap.entries())
    .filter(([, v]) => v.prices.length >= 2)
    .map(([name, v]) => {
      const latest = v.prices[0];
      const avg = v.prices.reduce((s, p) => s + p, 0) / v.prices.length;
      const change = avg > 0 ? ((latest - avg) / avg) * 100 : 0;
      return {
        itemName: name,
        unit: v.unit,
        latestPrice: Math.round(latest * 100) / 100,
        avgPrice: Math.round(avg * 100) / 100,
        changePercent: Math.round(change),
        trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const,
      };
    })
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  return rankings;
}
