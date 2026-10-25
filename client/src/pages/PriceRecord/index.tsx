import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, InputNumber, Select, DatePicker, Button,
  Typography, message, Space, AutoComplete, Tag,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { priceApi } from '../../api/price.api';
import { formatAmount } from '../../utils/format';

const { Text } = Typography;

const COMMON_ITEMS = [
  '苹果', '香蕉', '猪肉', '鸡胸肉', '牛奶', '咖啡',
  '鸡蛋', '面包', '白菜', '西红柿', '土豆', '牛肉',
  '酸奶', '橙子', '葡萄', '西瓜', '草莓', '西兰花',
];

const UNITS = ['斤', '个', '瓶', '杯', '盒', '袋', 'kg'];

export default function PriceRecord() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [searchItems, setSearchItems] = useState<string[]>([]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        purchase_date: values.purchase_date.format('YYYY-MM-DD'),
      };
      const res = await priceApi.create(data);
      setStats(res.data.stats);
      message.success('物价记录添加成功');
      form.resetFields();
      form.setFieldValue('purchase_date', dayjs());
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSearch = async (value: string) => {
    if (!value) {
      setSearchItems([]);
      return;
    }
    try {
      const res = await priceApi.getList({ item_name: value, pageSize: 10 });
      const names = [...new Set(res.data.list.map((r) => r.item_name))];
      setSearchItems(names);
    } catch {
      setSearchItems(COMMON_ITEMS.filter((i) => i.includes(value)));
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <span>录入物价</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{
            unit: '斤',
            purchase_date: dayjs(),
          }}
        >
          {/* 物品名称 */}
          <Form.Item name="item_name" label="物品名称"
            rules={[{ required: true, message: '请输入物品名称' }]}
          >
            <AutoComplete
              options={searchItems.map((item) => ({ value: item }))}
              onSearch={handleItemSearch}
              placeholder="输入物品名称"
              size="large"
            >
              <Input />
            </AutoComplete>
          </Form.Item>

          {/* 快捷选择 */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {COMMON_ITEMS.slice(0, 8).map((item) => (
              <Tag
                key={item}
                style={{ cursor: 'pointer' }}
                onClick={() => form.setFieldValue('item_name', item)}
              >
                {item}
              </Tag>
            ))}
          </div>

          {/* 单价 + 单位 */}
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="unit_price" label="单价"
              rules={[{ required: true, message: '请输入单价' }]}
              style={{ flex: 1 }}
            >
              <InputNumber prefix="¥" style={{ width: '100%' }} min={0} precision={2} size="large"
                placeholder="0.00" />
            </Form.Item>
            <Form.Item name="unit" label="单位" style={{ width: 100 }}>
              <Select options={UNITS.map((u) => ({ label: u, value: u }))} />
            </Form.Item>
          </Space.Compact>

          {/* 购买日期 */}
          <Form.Item name="purchase_date" label="购买日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          {/* 购买地点 */}
          <Form.Item name="location" label="购买地点（可选）">
            <Input placeholder="如：学校超市、菜市场" maxLength={50} />
          </Form.Item>

          {/* 统计信息 */}
          {stats && (
            <Card size="small" style={{ marginBottom: 16, background: '#f6ffed' }}>
              <Text strong>📊 历史统计</Text>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13 }}>
                <div>均价：{formatAmount(stats.avgPrice)}</div>
                <div>最高：{formatAmount(stats.maxPrice)}</div>
                <div>最低：{formatAmount(stats.minPrice)}</div>
                <div>记录：{stats.recordCount}条</div>
              </div>
            </Card>
          )}

          <Button type="primary" htmlType="submit" loading={loading} block size="large"
            style={{ borderRadius: 8 }}>
            保存
          </Button>
        </Form>
      </Card>
    </div>
  );
}
