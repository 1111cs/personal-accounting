import { create } from 'zustand';
import type { Budget, BudgetCalculation, SocialMode } from '../types';
import { budgetApi } from '../api/budget.api';
import { socialApi } from '../api/social.api';

interface BudgetState {
  budget: Budget | null;
  calculation: BudgetCalculation | null;
  socialMode: SocialMode | null;
  loading: boolean;
  fetchBudget: (month?: string) => Promise<void>;
  fetchCalculation: (date?: string) => Promise<void>;
  fetchSocialMode: () => Promise<void>;
  updateBudget: (data: Partial<Budget>) => Promise<void>;
  toggleSocialMode: (multiplier: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budget: null,
  calculation: null,
  socialMode: null,
  loading: false,

  fetchBudget: async (month) => {
    set({ loading: true });
    try {
      const res = await budgetApi.getCurrent(month);
      set({ budget: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchCalculation: async (date) => {
    try {
      const res = await budgetApi.calculate(date);
      set({ calculation: res.data });
    } catch {}
  },

  fetchSocialMode: async () => {
    try {
      const res = await socialApi.getToday();
      set({ socialMode: res.data });
    } catch {}
  },

  updateBudget: async (data) => {
    const res = await budgetApi.update(data);
    set({ budget: res.data });
    // 重新计算
    get().fetchCalculation();
  },

  toggleSocialMode: async (multiplier) => {
    const res = await socialApi.toggle(multiplier);
    set({ socialMode: res.data });
    get().fetchCalculation();
  },
}));
