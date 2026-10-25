import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Form, Input, InputNumber, Select, DatePicker, Checkbox, Button,
  Typography, message, Alert, Space, Segmented,
} from 'antd';
import { ArrowLeftOutlined, WalletOutlined, BankOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { billApi } from '../../api/bill.api';
import { useBillStore } from '../../stores/useBillStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import type { PriceHint } from '../../types';

const { Text } = Typography;

const quickAmounts = [15, 25, 50, 100];

export default function Record() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [priceHint, setPriceHint] = useState<PriceHint | null>(null);
  const [category, setCategory] = useState<'food' | 'other'>('food');
  const [source, setSource] = useState<'daily' | 'reserve'>('daily');
  const [originalData, setOriginalData] = useState<any>(null);
  const { fetchBills } = useBillStore();
  const { fetchCalculation } = useBudgetStore();

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadBill();
    }
  }, [id]);

  const loadBill = async () => {
    try {
      const res = await billApi.getById(Number(id));
      const bill = res.data;
      if (bill) {
        setCategory(bill.category);
        setSource(bill.source || 'daily');
        const formValues = {
          ...bill,
          bill_date: dayjs(bill.bill_date),
          tags: bill.tags || [],
          source: bill.source || 'daily',
        };
        setOriginalData(formValues);
        form.setFieldsValue(formValues);
      }
    } catch {}
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        // 编辑模式：只提交实际变更的字段
        const changes: any = {};
        const originalBillDate = originalData?.bill_date
          ? (dayjs.isDayjs(originalData.bill_date) ? originalData.bill_date.format('YYYY-MM-DD') : originalData.bill_date)
          : null;
        const currentBillDate = values.bill_date.format('YYYY-MM-DD');

        const fieldsToCheck = ['amount', 'note', 'is_overeat'];
        for (const key of fieldsToCheck) {
          if (values[key] !== originalData?.[key]) {
            changes[key] = values[key];
          }
        }
        if (currentBillDate !== originalBillDate) {
          changes.bill_date = currentBillDate;
        }
        if (category !== originalData?.category) {
          changes.category = category;
        }
        if ((values.source || 'daily') !== (originalData?.source || 'daily')) {
          changes.source = values.source || 'daily';
        }
        // tags 是数组，需要深度比较
        const currentTags = values.tags || [];
        const originalTags = originalData?.tags || [];
        if (JSON.stringify(currentTags.sort()) !== JSON.stringify(originalTags.sort())) {
          changes.tags = currentTags;
        }

        if (Object.keys(changes).length === 0) {
          message.info('未检测到任何修改');
          setLoading(false);
          return;
        }

        await billApi.update(Number(id), changes);
        message.success('更新成功');
      } else {
        const data = {
          ...values,
          bill_date: values.bill_date.format('YYYY-MM-DD'),
          category,
          source: values.source || 'daily',
        };
        const result = await billApi.create(data);
        if (result.data.priceHint) {
          setPriceHint(result.data.priceHint);
        }
        message.success('录入成功');
      }

      form.resetFields();
      setPriceHint(null);
      fetchBills();
      fetchCalculation();
      if (!isEdit) navigate(-1);
    } catch (error: any) {
      if (error.message) message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <span>{isEdit ? '编辑账单' : '记一笔'}</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{
            bill_date: dayjs(),
            category: 'food',
            source: 'daily',
            tags: [],
            is_overeat: false,
          }}
        >
          {/* 消费板块 */}
          <Form.Item label="消费板块">
            <Select
              value={category}
              onChange={(v) => {
                setCategory(v);
                if (v === 'other') form.setFieldValue('is_overeat', false);
              }}
              options={[
                { label: '🍚 日常饮食', value: 'food' },
                { label: '🛒 其他消费', value: 'other' },
              ]}
            />
          </Form.Item>

          {/* 消费来源 */}
          <Form.Item name="source" label="费用来源">
            <Segmented
              block
              value={source}
              onChange={(v) => setSource(v as 'daily' | 'reserve')}
              options={[
                { label: '💰 日常开支', value: 'daily', icon: <BankOutlined /> },
                { label: '💧 备用金', value: 'reserve', icon: <WalletOutlined /> },
              ]}
            />
          </Form.Item>

          {/* 金额 */}
          <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber
              prefix="¥"
              style={{ width: '100%' }}
              placeholder="0.00"
              min={0}
              precision={2}
              size="large"
              autoFocus
            />
          </Form.Item>

          {/* 快捷金额 */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            {quickAmounts.map((amt) => (
              <Button key={amt} size="small" onClick={() => form.setFieldValue('amount', amt)}>
                ¥{amt}
              </Button>
            ))}
          </div>

          {/* 日期 */}
          <Form.Item name="bill_date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          {/* 备注 */}
          <Form.Item name="note" label="备注（可选）">
            <Input.TextArea maxLength={100} rows={2} placeholder="例如：食堂午餐" showCount />
          </Form.Item>

          {/* 标签 */}
          <Form.Item name="tags" label="标签">
            <Checkbox.Group options={[
              { label: '📦 大宗消费（≥¥100）', value: 'big_spend' },
              { label: '⚡ 冲动消费', value: 'impulse' },
            ]} />
          </Form.Item>

          {/* 热量超标（仅饮食板块） */}
          {category === 'food' && (
            <Form.Item name="is_overeat" valuePropName="checked">
              <Checkbox>🔥 热量超标</Checkbox>
            </Form.Item>
          )}

          {/* 物价提示 */}
          {priceHint && (
            <Alert
              type={priceHint.trend === 'up' ? 'warning' : 'info'}
              message={
                <span>
                  上次 {priceHint.itemName} ¥{priceHint.avgPrice}，这次{' '}
                  {priceHint.trend === 'up' ? '↑' : '↓'}
                  {Math.abs(priceHint.diffPercent)}%
                </span>
              }
              style={{ marginBottom: 16 }}
              closable
            />
          )}

          {/* 提交 */}
          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ borderRadius: 8 }}>
            {isEdit ? '保存修改' : '确认记账'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
