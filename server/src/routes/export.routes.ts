import { Router, Response } from 'express';
import { Op } from 'sequelize';
import Bill from '../models/Bill';
import PriceRecord from '../models/PriceRecord';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { getMonthKey } from '../utils/date';
import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';

const router = Router();
router.use(authMiddleware);

// 导出 CSV
router.get('/export/csv', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getMonthKey(new Date());
    const bills = await Bill.findAll({
      where: {
        user_id: req.userId,
        bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-31`] },
      },
      order: [['bill_date', 'ASC']],
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'bill_date', title: '日期' },
        { id: 'category', title: '板块' },
        { id: 'amount', title: '金额' },
        { id: 'note', title: '备注' },
        { id: 'tags', title: '标签' },
        { id: 'is_overeat', title: '热量超标' },
      ],
    });

    const records = bills.map((b) => ({
      bill_date: b.bill_date,
      category: b.category === 'food' ? '日常饮食' : '其他消费',
      amount: Number(b.amount),
      note: b.note || '',
      tags: (b.tags as string[])?.join(';') || '',
      is_overeat: b.is_overeat ? '是' : '否',
    }));

    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=记账数据_${monthKey}.csv`);
    // Add BOM for Excel Chinese support
    res.send('\ufeff' + csvContent);
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 导出 PDF
router.get('/export/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const monthKey = (req.query.month as string) || getMonthKey(new Date());
    const bills = await Bill.findAll({
      where: {
        user_id: req.userId,
        bill_date: { [Op.between]: [`${monthKey}-01`, `${monthKey}-31`] },
      },
      order: [['bill_date', 'ASC']],
    });

    const totalSpent = bills.reduce((s, b) => s + Number(b.amount), 0);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=月度报告_${monthKey}.pdf`);
    doc.pipe(res);

    // 标题
    doc.fontSize(20).text('个人记账月度报告', { align: 'center' });
    doc.fontSize(14).text(monthKey, { align: 'center' });
    doc.moveDown();

    // 摘要
    doc.fontSize(12).text(`本月总支出：¥${totalSpent.toFixed(2)}`);
    doc.text(`账单总数：${bills.length} 条`);
    doc.moveDown();

    // 表格头
    doc.fontSize(10);
    const tableTop = doc.y;
    const colX = [50, 150, 220, 320, 420, 480];
    doc.text('日期', colX[0], tableTop);
    doc.text('板块', colX[1], tableTop);
    doc.text('金额', colX[2], tableTop);
    doc.text('备注', colX[3], tableTop);
    doc.text('标签', colX[4], tableTop);
    doc.text('热量', colX[5], tableTop);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // 数据行
    for (const bill of bills) {
      if (doc.y > 750) {
        doc.addPage();
      }
      const y = doc.y;
      doc.text(bill.bill_date as string, colX[0], y);
      doc.text(bill.category === 'food' ? '饮食' : '其他', colX[1], y);
      doc.text(`¥${Number(bill.amount).toFixed(2)}`, colX[2], y);
      doc.text((bill.note || '').substring(0, 12), colX[3], y);
      doc.text(((bill.tags as string[]) || []).join(','), colX[4], y);
      doc.text(bill.is_overeat ? '是' : '否', colX[5], y);
    }

    doc.end();
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

export default router;
