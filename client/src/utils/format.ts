export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date === today.toISOString().split('T')[0]) return '今天';
  if (date === yesterday.toISOString().split('T')[0]) return '昨天';

  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function getCategoryName(category: string): string {
  return category === 'food' ? '🍚 日常饮食' : '🛒 其他消费';
}

export function getRarityStars(rarity: number): string {
  return '★'.repeat(rarity) + '☆'.repeat(4 - rarity);
}
