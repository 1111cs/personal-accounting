import { create } from 'zustand';
import type { Bill } from '../types';
import { billApi } from '../api/bill.api';

interface BillState {
  bills: Bill[];
  total: number;
  loading: boolean;
  fetchBills: (params?: Record<string, any>) => Promise<void>;
  createBill: (data: Partial<Bill>) => Promise<any>;
  updateBill: (id: number, data: Partial<Bill>) => Promise<void>;
  deleteBill: (id: number) => Promise<void>;
  batchDelete: (ids: number[]) => Promise<void>;
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  total: 0,
  loading: false,

  fetchBills: async (params) => {
    set({ loading: true });
    try {
      const res = await billApi.getList(params);
      set({ bills: res.data.list, total: res.data.total });
    } finally {
      set({ loading: false });
    }
  },

  createBill: async (data) => {
    const res = await billApi.create(data);
    return res.data;
  },

  updateBill: async (id, data) => {
    await billApi.update(id, data);
    get().fetchBills();
  },

  deleteBill: async (id) => {
    await billApi.delete(id);
    get().fetchBills();
  },

  batchDelete: async (ids) => {
    await billApi.batchDelete(ids);
    get().fetchBills();
  },
}));
