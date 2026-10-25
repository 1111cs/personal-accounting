import { useEffect, useState } from 'react';
import { Card, Spin, Typography, Row, Col, Progress } from 'antd';
import { TrophyOutlined, LockOutlined } from '@ant-design/icons';
import { achievementApi } from '../../api/achievement.api';
import type { Achievement as AchievementType } from '../../types';
import { getRarityStars } from '../../utils/format';

const { Text, Title } = Typography;

const RARITY_COLORS: Record<number, string> = {
  1: '#52c41a',
  2: '#1677ff',
  3: '#722ed1',
  4: '#fa8c16',
};

export default function Achievement() {
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await achievementApi.getList();
      setAchievements(res.data.list);
      setUnlockedCount(res.data.unlockedCount);
      setTotalCount(res.data.totalCount);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div>
      <Title level={4}>🏆 成就墙</Title>
      <div style={{ marginBottom: 20 }}>
        <Progress
          percent={totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}
          format={() => `${unlockedCount}/${totalCount}`}
          strokeColor="#1677ff"
        />
      </div>

      <Row gutter={[16, 16]}>
        {achievements.map((ach) => (
          <Col xs={24} sm={12} md={8} key={ach.id}>
            <Card
              style={{
                borderRadius: 12,
                opacity: ach.unlocked ? 1 : 0.6,
                background: ach.unlocked ? 'linear-gradient(135deg, #fffbe6 0%, #fff 100%)' : '#fafafa',
                border: ach.unlocked ? `1px solid ${RARITY_COLORS[ach.rarity] || '#1677ff'}` : '1px solid #f0f0f0',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {ach.unlocked ? (ach.icon || <TrophyOutlined />) : <LockOutlined style={{ color: '#d9d9d9' }} />}
                </div>
                <Text strong style={{ fontSize: 16 }}>{ach.name}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ color: RARITY_COLORS[ach.rarity] }}>
                    {getRarityStars(ach.rarity)}
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{ach.description}</Text>
                </div>
                {ach.unlocked && ach.unlockedAt && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      解锁于 {new Date(ach.unlockedAt).toLocaleDateString('zh-CN')}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
