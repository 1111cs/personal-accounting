import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Typography, Button, Space, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import ProgressBar from '../../components/ProgressBar';
import { budgetApi } from '../../api/budget.api';
import { useBudgetStore } from '../../stores/useBudgetStore';
import type { BudgetCalculation } from '../../types';
import { formatAmount } from '../../utils/format';

const { Text, Title } = Typography;

export default function BudgetDetail() {
  const navigate = useNavigate();
  const [calc, setCalc] = useState<BudgetCalculation | null>(null);
  const [history, setHistory] = useState<{ date: string; allowance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { budget } = useBudgetStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [calcRes, histRes] = await Promise.all([
        budgetApi.calculate(),
        budgetApi.getHistory(),
      ]);
      setCalc(calcRes.data);
      setHistory(histRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!calc) return <Empty description="暂无预算数据，请先设置预算" />;

  const chartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 10, right: 10, bottom: 20, left: 50 },
    xAxis: {
      type: 'category' as const,
      data: history.map((h) => h.date.slice(5)),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 10, formatter: '¥{value}' },
    },
    series: [{
      data: history.map((h) => h.allowance),
      type: 'bar',
      itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
    }],
  };

  const progressColor = calc.progress > 1 ? '#a8071a' : calc.progress >= 0.8 ? '#ff4d4f' : calc.progress >= 0.5 ? '#fa8c16' : '#52c41a';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      <Title level={4}>预算详情</Title>

      {/* 消耗进度 */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Text type="secondary">日常消耗进度</Text>
        <div style={{ marginTop: 8 }}>
          <ProgressBar percent={calc.progress} height={16} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text>已花 {formatAmount(calc.totalSpent)}</Text>
          <Text>可用 {formatAmount(calc.effectiveBudget)}</Text>
        </div>
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#f6ffed',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <Text style={{ fontSize: 16 }}>今日可用额度</Text>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1677ff' }}>
            {formatAmount(calc.dailyAllowance)}
          </div>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            剩余 {calc.remainingDays} 天
          </Text>
        </div>
      </Card>

      {/* 每日额度变化 */}
      <Card title="每日额度变化（近30天）" style={{ borderRadius: 12, marginBottom: 16 }}>
        <ReactECharts option={chartOption} style={{ height: 200 }} />
      </Card>

      {/* 板块分布 */}
      <Card title="本月摘要" style={{ borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary">日常开销有效预算</Text>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{formatAmount(calc.effectiveBudget)}</div>
          </div>
          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary">已消费</Text>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: progressColor }}>
              {formatAmount(calc.totalSpent)}
            </div>
          </div>
          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary">备用金剩余</Text>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>
              {formatAmount(calc.reserveRemaining)}
            </div>
          </div>
          <div style={{ padding: 12, background: calc.isOverdrawn ? '#fff2f0' : '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary">状态</Text>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: calc.isOverdrawn ? '#ff4d4f' : '#52c41a' }}>
              {calc.isOverdrawn ? '已透支' : '正常'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
