import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import Bill from '../models/Bill';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { matchPrice } from '../services/price.service';

const router = Router();
router.use(authMiddleware);

const createBillSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['food', 'other']),
  bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(100).optional().nullable(),
  tags: z.array(z.enum(['big_spend', 'impulse'])).optional().nullable(),
  is_overeat: z.boolean().optional(),
  source: z.enum(['daily', 'reserve']).optional().nullable(),
});

const updateBillSchema = createBillSchema.partial();

// 获取单条账单
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!bill) {
      return res.status(404).json({ code: 404, message: '账单不存在' });
    }
    res.json({ code: 200, data: bill });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取账单列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '20',
      category,
      startDate,
      endDate,
      tags,
      keyword,
      source,
    } = req.query;

    const where: any = { user_id: req.userId };

    if (category) where.category = category;
    if (source) where.source = source;
    if (startDate && endDate) {
      where.bill_date = { [Op.between]: [startDate, endDate] };
    }
    if (keyword) {
      where.note = { [Op.like]: `%${keyword}%` };
    }

    const offset = (Number(page) - 1) * Number(pageSize);
    const { count, rows } = await Bill.findAndCountAll({
      where,
      order: [['bill_date', 'DESC'], ['created_at', 'DESC']],
      limit: Number(pageSize),
      offset,
    });

    // 标签筛选
    let filteredRows = rows;
    if (tags) {
      const tagList = (tags as string).split(',');
      filteredRows = rows.filter((bill) => {
        const billTags = bill.tags as string[] | null;
        if (!billTags) return false;
        return tagList.some((t) => billTags.includes(t));
      });
    }

    res.json({
      code: 200,
      data: {
        list: filteredRows,
        total: count,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 创建账单
router.post('/', validate(createBillSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const bill = await Bill.create({ ...data, user_id: req.userId });

    // 物价匹配提示
    let priceHint = null;
    if (data.note) {
      priceHint = await matchPrice(req.userId!, data.note, data.category);
    }

    res.json({
      code: 200,
      message: '录入成功',
      data: { bill, priceHint },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 更新账单
router.put('/:id', validate(updateBillSchema), async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!bill) {
      return res.status(404).json({ code: 404, message: '账单不存在' });
    }

    await bill.update(req.body);
    res.json({ code: 200, message: '更新成功', data: bill });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 批量删除（必须注册在 /:id 之前）
router.delete('/batch/delete', async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ code: 400, message: '请提供要删除的ID列表' });
    }

    await Bill.destroy({
      where: { id: { [Op.in]: ids }, user_id: req.userId },
    });
    res.json({ code: 200, message: '批量删除成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 删除账单
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!bill) {
      return res.status(404).json({ code: 404, message: '账单不存在' });
    }

    await bill.destroy();
    res.json({ code: 200, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
