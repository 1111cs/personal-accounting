import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Spin, Typography, Row, Col, Select, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import { dashboardApi } from '../../api/dashboard.api';
import { formatAmount } from '../../utils/format';

const { Text, Title } = Typography;

export default function Stats() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [tagStats, setTagStats] = useState<any>(null);
  const [viewType, setViewType] = useState<'month' | 'daily'>('month');

  useEffect(() => {
    loadData();
  }, [location.pathname]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, dailyRes, tagRes] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getTrend(6),
        dashboardApi.getTrend(undefined, 'daily'),
        dashboardApi.getTagStats(),
      ]);
      setOverview(overviewRes.data);
      setTrend(trendRes.data);
      setDailyTrend(dailyRes.data);
      setTagStats(tagRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  const pieOption = overview ? {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: overview.foodTotal, name: '日常饮食', itemStyle: { color: '#1677ff' } },
        { value: overview.otherTotal, name: '其他消费', itemStyle: { color: '#fa8c16' } },
      ],
      label: { formatter: '{b}\n{d}%' },
    }],
  } : null;

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 10, right: 10, bottom: 20, left: 60 },
    xAxis: {
      type: 'category' as const,
      data: (viewType === 'daily' ? dailyTrend : trend).map((t: any) =>
        viewType === 'daily' ? t.date.slice(5) : t.month.slice(2)
      ),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 10, formatter: '¥{value}' },
    },
    series: [{
      data: (viewType === 'daily' ? dailyTrend : trend).map((t: any) => t.amount),
      type: 'bar',
      itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
      markPoint: viewType === 'daily' ? {
        data: dailyTrend
          .filter((t: any) => t.hasImpulse)
          .map((t: any) => ({
            name: '冲动',
            coord: [t.date.slice(5), t.amount],
            symbol: 'pin',
            symbolSize: 24,
            itemStyle: { color: '#ff4d4f' },
          })),
      } : undefined,
    }],
  };

  return (
    <div>
      <Title level={4}>📊 宏观资产看板</Title>

      {/* 数据卡片 */}
      {overview && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {[
            { label: '本月总支出', value: formatAmount(overview.totalSpent), color: '#1677ff' },
            { label: '日均支出', value: formatAmount(overview.dailyAvg), color: '#52c41a' },
            { label: '单笔最高', value: formatAmount(overview.maxSingle), color: '#fa8c16' },
            { label: '账单总数', value: `${overview.billCount} 条`, color: '#722ed1' },
          ].map((item) => (
            <Col xs={12} sm={6} key={item.label}>
              <Card style={{ borderRadius: 12, textAlign: 'center' }} bodyStyle={{ padding: '16px 12px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: item.color }}>
                  {item.value}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {/* 板块分布 */}
        <Col xs={24} lg={12}>
          <Card title="消费板块分布" style={{ borderRadius: 12 }}>
            {pieOption && <ReactECharts option={pieOption} style={{ height: 300 }} />}
          </Card>
        </Col>

        {/* 消费趋势 */}
        <Col xs={24} lg={12}>
          <Card
            title="消费趋势"
            style={{ borderRadius: 12 }}
            extra={
              <Select value={viewType} onChange={setViewType} size="small" style={{ width: 100 }}
                options={[
                  { label: '月度', value: 'month' },
                  { label: '每日', value: 'daily' },
                ]}
              />
            }
          >
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>

        {/* 标签统计 */}
        {tagStats && (
          <Col xs={24}>
            <Card title="行为标签统计" style={{ borderRadius: 12 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card size="small" style={{ background: '#fff2f0', borderRadius: 8 }}>
                    <Text strong>⚡ 冲动消费</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
                      {tagStats.impulse.count} 次
                    </div>
                    <Text style={{ fontSize: 12 }}>金额 {formatAmount(tagStats.impulse.amount)}</Text>
                    <br />
                    <Text style={{ fontSize: 12, color: tagStats.impulse.changePercent > 0 ? '#ff4d4f' : '#52c41a' }}>
                      环比 {tagStats.impulse.changePercent > 0 ? '↑' : '↓'}{Math.abs(tagStats.impulse.changePercent)}%
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" style={{ background: '#fff7e6', borderRadius: 8 }}>
                    <Text strong>📦 大宗消费</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                      {tagStats.bigSpend.count} 次
                    </div>
                    <Text style={{ fontSize: 12 }}>金额 {formatAmount(tagStats.bigSpend.amount)}</Text>
                    <br />
                    <Text style={{ fontSize: 12, color: tagStats.bigSpend.changePercent > 0 ? '#ff4d4f' : '#52c41a' }}>
                      环比 {tagStats.bigSpend.changePercent > 0 ? '↑' : '↓'}{Math.abs(tagStats.bigSpend.changePercent)}%
                    </Text>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
