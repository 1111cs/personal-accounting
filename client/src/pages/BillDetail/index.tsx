import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Spin, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { billApi } from '../../api/bill.api';
import type { Bill } from '../../types';
import { formatAmount, getCategoryName } from '../../utils/format';

const { Text } = Typography;

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    try {
      const res = await billApi.getById(Number(id));
      setBill(res.data || null);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin /></div>;
  if (!bill) return <div style={{ textAlign: 'center', padding: 100 }}>账单不存在</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <span>账单详情</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/record/${bill.id}`)}>编辑</Button>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="消费板块">
            {getCategoryName(bill.category)}
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            <Text strong style={{ fontSize: 18 }}>{formatAmount(Number(bill.amount))}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="日期">{bill.bill_date}</Descriptions.Item>
          <Descriptions.Item label="备注">{bill.note || '-'}</Descriptions.Item>
          <Descriptions.Item label="标签">
            {bill.tags?.length ? (
              bill.tags.map((tag) => (
                <Tag key={tag} color={tag === 'impulse' ? 'red' : 'orange'}>
                  {tag === 'impulse' ? '⚡ 冲动消费' : '📦 大宗消费'}
                </Tag>
              ))
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="热量超标">
            {bill.is_overeat ? <Tag color="volcano">🔥 是</Tag> : '否'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
