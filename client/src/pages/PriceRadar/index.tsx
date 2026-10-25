import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Typography, Button, Space, List, Tag, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { priceApi } from '../../api/price.api';
import type { PriceRanking, PriceRecord } from '../../types';
import { formatAmount } from '../../utils/format';

const { Text, Title } = Typography;

export default function PriceRadar() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<PriceRanking[]>([]);
  const [items, setItems] = useState<PriceRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [trendData, setTrendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rankingRes, listRes] = await Promise.all([
        priceApi.getRanking(),
        priceApi.getList({ pageSize: 50 }),
      ]);
      setRanking(rankingRes.data);
      setItems(listRes.data.list);

      // 获取去重物品列表
      const uniqueItems = [...new Set(listRes.data.list.map((r) => r.item_name))];
      if (uniqueItems.length > 0) {
        setSelectedItem(uniqueItems[0]);
        loadTrend(uniqueItems[0]);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadTrend = async (itemName: string) => {
    try {
      const res = await priceApi.getTrend(itemName);
      setTrendData(res.data);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    await priceApi.delete(id);
    loadData();
  };

  const trendChartOption = trendData ? {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 10, right: 10, bottom: 20, left: 50 },
    xAxis: {
      type: 'category' as const,
      data: trendData.records.map((r: any) => r.date.slice(5)),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      name: '元',
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        data: trendData.records.map((r: any) => r.price),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#1677ff' },
        markLine: {
          silent: true,
          data: [{ yAxis: trendData.avgPrice, label: { formatter: `均价¥${trendData.avgPrice}`, fontSize: 10 } }],
          lineStyle: { color: '#fa8c16', type: 'dashed' },
        },
      },
    ],
  } : null;

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>🔍 物价雷达</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/price/record')}>
          录入物价
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* 涨幅排行榜 */}
        <Col xs={24} lg={12}>
          <Card title="本月涨幅 Top 5" style={{ borderRadius: 12 }}>
            {ranking.length === 0 ? (
              <Text type="secondary">暂无数据，去录入物价吧</Text>
            ) : (
              <List
                dataSource={ranking}
                renderItem={(item, index) => (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Space>
                        <Tag color="blue">#{index + 1}</Tag>
                        <Text strong>{item.itemName}</Text>
                        <Text type="secondary">{formatAmount(item.latestPrice)}/{item.unit}</Text>
                      </Space>
                      <Tag color={item.trend === 'up' ? 'red' : item.trend === 'down' ? 'green' : 'default'}>
                        {item.trend === 'up' ? '↑' : '↓'}{Math.abs(item.changePercent)}%
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* 价格走势 */}
        <Col xs={24} lg={12}>
          <Card
            title="价格走势"
            style={{ borderRadius: 12 }}
            extra={
              <select
                value={selectedItem}
                onChange={(e) => { setSelectedItem(e.target.value); loadTrend(e.target.value); }}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
              >
                {[...new Set(items.map((r) => r.item_name))].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            }
          >
            {trendChartOption ? (
              <ReactECharts option={trendChartOption} style={{ height: 250 }} />
            ) : (
              <Text type="secondary">暂无数据</Text>
            )}
          </Card>
        </Col>

        {/* 最近录入 */}
        <Col xs={24}>
          <Card title="最近物价记录" style={{ borderRadius: 12 }}>
            <List
              dataSource={items.slice(0, 10)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />}
                      onClick={() => handleDelete(item.id)} key="del" />,
                  ]}
                >
                  <List.Item.Meta
                    title={<Text strong>{item.item_name}</Text>}
                    description={
                      <Space>
                        <Text>{formatAmount(Number(item.unit_price))}/{item.unit}</Text>
                        <Text type="secondary">{item.purchase_date}</Text>
                        {item.location && <Tag>{item.location}</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
