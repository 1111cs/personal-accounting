// 用户
export interface User {
  id: number;
  username: string;
  avatar: string | null;
  created_at: string;
}

// 账单
export interface Bill {
  id: number;
  user_id: number;
  amount: number;
  category: 'food' | 'other';
  bill_date: string;
  note: string | null;
  tags: string[] | null;
  is_overeat: boolean;
  source: 'daily' | 'reserve' | null;
  created_at: string;
  updated_at: string;
}

// 预算
export interface Budget {
  id: number;
  user_id: number;
  budget_month: string;
  total_budget: number;
  reserve_fund: number;
  spent_base: number;
}

// 预算计算结果
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

// 社交模式
export interface SocialMode {
  id: number;
  user_id: number;
  mode_date: string;
  multiplier: number;
  reserve_deducted: number;
}

// 物价记录
export interface PriceRecord {
  id: number;
  user_id: number;
  item_name: string;
  unit_price: number;
  unit: string;
  purchase_date: string;
  location: string | null;
}

// 物价排名
export interface PriceRanking {
  itemName: string;
  unit: string;
  latestPrice: number;
  avgPrice: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

// 物价提示
export interface PriceHint {
  itemName: string;
  currentPrice: number;
  avgPrice: number;
  diffPercent: number;
  trend: 'up' | 'down' | 'stable';
}

// 成就
export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  rarity: number;
  icon: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
}

// 连续记录
export interface StreakData {
  current: number;
  best: number;
  lastUpdated: string | null;
  heatmap: { date: string; count: number; overdrawn: boolean }[];
}

// 首页数据
export interface DashboardData {
  budget: BudgetCalculation;
  streak: { current: number; best: number };
  alerts: Bill[];
  priceRanking: PriceRanking[];
  achievements: {
    unlocked: number;
    total: number;
    latest: Achievement[];
  };
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}
