import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Typography, Button, List, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { budgetApi } from '../../api/budget.api';
import type { BudgetCalculation } from '../../types';
import { formatAmount, formatDate } from '../../utils/format';

const { Text, Title } = Typography;

export default function ReserveDetail() {
  const navigate = useNavigate();
  const [calc, setCalc] = useState<BudgetCalculation | null>(null);
  const [detail, setDetail] = useState<{ list: { id: number; amount: number; note: string; bill_date: string; category: string }[]; totalDeducted: number } | null>(null);
  const [history, setHistory] = useState<{ month: string; reserveUsed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [calcRes, detailRes, histRes] = await Promise.all([
        budgetApi.calculate(),
        budgetApi.getReserveDetail(),
        budgetApi.getReserveHistory(6),
      ]);
      setCalc(calcRes.data);
      setDetail(detailRes.data);
      setHistory(histRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!calc) return <div style={{ textAlign: 'center', padding: 100 }}>暂无预算数据</div>;

  const reserveFund = calc.reserveFund;
  const reserveRemaining = calc.reserveRemaining;
  const reserveSpent = detail?.totalDeducted || 0;

  const chartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 10, right: 10, bottom: 20, left: 50 },
    xAxis: {
      type: 'category' as const,
      data: history.map((h) => h.month.slice(2)),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 10, formatter: '¥{value}' },
    },
    series: [{
      data: history.map((h) => h.reserveUsed),
      type: 'bar',
      itemStyle: { color: '#fa8c16', borderRadius: [4, 4, 0, 0] },
    }],
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </div>

      <Title level={4}>备用金详情</Title>

      {/* 状态卡片 */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 40, textAlign: 'center' }}>💧</div>
        <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: reserveRemaining < 0 ? '#ff4d4f' : '#1677ff' }}>
          {formatAmount(reserveRemaining)}
          <span style={{ fontSize: 16, color: '#999', fontWeight: 'normal' }}>
            {' '} / {formatAmount(reserveFund)}
          </span>
        </div>
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#999' }}>
          剩余 / 总额 &nbsp;&nbsp; 已用 {formatAmount(reserveSpent)}
        </div>
      </Card>

      {/* 使用明细 */}
      <Card title="本月使用明细" style={{ borderRadius: 12, marginBottom: 16 }}>
        {detail && detail.list.length > 0 ? (
          <List
            dataSource={detail.list}
            renderItem={(item) => (
              <List.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <Text>{formatDate(item.bill_date)}</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>备用金</Tag>
                    {item.note && <Text type="secondary">{item.note}</Text>}
                  </div>
                  <Text style={{ color: '#ff4d4f' }}>-{formatAmount(item.amount)}</Text>
                </div>
              </List.Item>
            )}
            footer={<Text strong>本月合计已用：{formatAmount(reserveSpent)}</Text>}
          />
        ) : (
          <Text type="secondary">本月未动用备用金 🎉</Text>
        )}
      </Card>

      {/* 历史趋势 */}
      <Card title="近6月备用金使用趋势" style={{ borderRadius: 12 }}>
        <ReactECharts option={chartOption} style={{ height: 200 }} />
      </Card>
    </div>
  );
}
