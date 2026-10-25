import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import PriceRecord from '../models/PriceRecord';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPriceRanking } from '../services/price.service';
import { getMonthKey } from '../utils/date';

const router = Router();
router.use(authMiddleware);

const priceSchema = z.object({
  item_name: z.string().min(1).max(50),
  unit_price: z.number().positive(),
  unit: z.string().optional().default('斤'),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().max(100).optional().nullable(),
});

// 获取物价记录列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { item_name, page = '1', pageSize = '20' } = req.query;
    const where: any = { user_id: req.userId };
    if (item_name) where.item_name = { [Op.like]: `%${item_name}%` };

    const offset = (Number(page) - 1) * Number(pageSize);
    const { count, rows } = await PriceRecord.findAndCountAll({
      where,
      order: [['purchase_date', 'DESC']],
      limit: Number(pageSize),
      offset,
    });

    res.json({
      code: 200,
      data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 新增物价记录
router.post('/', validate(priceSchema), async (req: AuthRequest, res: Response) => {
  try {
    const record = await PriceRecord.create({ ...req.body, user_id: req.userId });

    // 计算历史均价
    const records = await PriceRecord.findAll({
      where: { user_id: req.userId, item_name: req.body.item_name },
      order: [['purchase_date', 'DESC']],
    });
    const avgPrice = records.length > 0
      ? records.reduce((s, r) => s + Number(r.unit_price), 0) / records.length
      : Number(req.body.unit_price);
    const maxPrice = Math.max(...records.map((r) => Number(r.unit_price)));
    const minPrice = Math.min(...records.map((r) => Number(r.unit_price)));

    res.json({
      code: 200,
      message: '物价记录添加成功',
      data: {
        record,
        stats: {
          avgPrice: Math.round(avgPrice * 100) / 100,
          maxPrice: Math.round(maxPrice * 100) / 100,
          minPrice: Math.round(minPrice * 100) / 100,
          recordCount: records.length,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 单物品价格趋势
router.get('/trend/:itemName', async (req: AuthRequest, res: Response) => {
  try {
    const records = await PriceRecord.findAll({
      where: { user_id: req.userId, item_name: req.params.itemName },
      order: [['purchase_date', 'ASC']],
    });

    const avgPrice = records.length > 0
      ? records.reduce((s, r) => s + Number(r.unit_price), 0) / records.length
      : 0;

    res.json({
      code: 200,
      data: {
        itemName: req.params.itemName,
        avgPrice: Math.round(avgPrice * 100) / 100,
        records: records.map((r) => ({
          price: Number(r.unit_price),
          date: r.purchase_date,
          unit: r.unit,
          location: r.location,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 本月涨幅排行榜
router.get('/ranking', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getMonthKey(new Date());
    const rankings = await getPriceRanking(req.userId!, monthKey);
    res.json({ code: 200, data: rankings });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 删除物价记录
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const record = await PriceRecord.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!record) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    await record.destroy();
    res.json({ code: 200, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
