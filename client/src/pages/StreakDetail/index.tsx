import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Typography, Button, Space, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ProgressBar from '../../components/ProgressBar';
import { streakApi } from '../../api/streak.api';
import type { StreakData } from '../../types';

const { Text, Title } = Typography;

export default function StreakDetail() {
  const navigate = useNavigate();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await streakApi.getDetail();
      setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!data) return <div>加载失败</div>;

  const isNewRecord = data.current >= data.best && data.current > 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </div>

      <Title level={4}>连续不透支记录</Title>

      {/* 当前状态 */}
      <Card style={{ borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
        {isNewRecord && <div style={{ fontSize: 24 }}>🎉 新纪录！</div>}
        <div style={{ fontSize: 64, fontWeight: 'bold', color: '#1677ff', lineHeight: 1 }}>
          {data.current}
        </div>
        <Text type="secondary" style={{ fontSize: 16 }}>连续不透支天数</Text>
        <div style={{ marginTop: 12 }}>
          <ProgressBar percent={data.current / 30} height={12} label="目标 30 天" />
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>{data.best}</div>
            <Text type="secondary">历史最佳</Text>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>30</div>
            <Text type="secondary">目标天数</Text>
          </div>
        </div>
      </Card>

      {/* 日历热力图 */}
      <Card title="近60天记录" style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {data.heatmap.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.overdrawn ? '透支' : day.count > 0 ? '已记账' : '无记录'}`}
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                background: day.overdrawn ? '#ff4d4f' : day.count > 0 ? '#52c41a' : '#f0f0f0',
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 11 }}>
          <span>🟢 已记账</span>
          <span>🔴 透支</span>
          <span>⬜ 无记录</span>
        </div>
      </Card>
    </div>
  );
}
