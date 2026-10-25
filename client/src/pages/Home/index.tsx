import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/DashboardCard';
import ProgressBar from '../../components/ProgressBar';
import WaterDrop from '../../components/WaterDrop';
import { dashboardApi } from '../../api/dashboard.api';
import type { DashboardData, BudgetCalculation } from '../../types';
import { formatAmount, formatDate } from '../../utils/format';

const { Text, Title } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [location.pathname]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getDashboard();
      setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 100 }}>加载失败</div>;

  const { budget, streak, alerts, priceRanking, achievements } = data;

  return (
    <div>
      {/* 欢迎行 */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>📊 财务概览</Title>
        <Text type="secondary">本月已过 {30 - budget.remainingDays} 天，剩余 {budget.remainingDays} 天</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* 连续不透支 */}
        <Col xs={24} sm={12} lg={8}>
          <DashboardCard
            title="连续不透支"
            icon="🔥"
            detailPath="/streak/detail"
            summary={
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1677ff' }}>
                  {streak.current} <span style={{ fontSize: 14, color: '#999' }}>天</span>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  目标 30 天 · 最佳 {streak.best} 天
                </Text>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar percent={streak.current / 30} />
                </div>
              </div>
            }
          />
        </Col>

        {/* 日常消耗进度 */}
        <Col xs={24} sm={12} lg={8}>
          <DashboardCard
            title="日常消耗进度"
            icon="📊"
            detailPath="/budget/detail"
            badge={budget.dailyOverspent > 0 ? '透支' : undefined}
            summary={
              <div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: budget.dailyOverspent > 0 ? '#ff4d4f' : '#1677ff' }}>
                  {formatAmount(budget.totalSpent)}
                  <span style={{ fontSize: 13, color: '#999', fontWeight: 'normal' }}>
                    {' '}/ {formatAmount(budget.effectiveBudget)}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar percent={budget.effectiveBudget > 0 ? budget.totalSpent / budget.effectiveBudget : 1} />
                </div>
                {budget.dailyOverspent > 0 ? (
                  <Text style={{ fontSize: 12, color: '#ff4d4f' }}>
                    ⚠️ 本月日常已透支 {formatAmount(budget.dailyOverspent)}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: '#1677ff' }}>
                    今日可用 {formatAmount(budget.dailyAllowance)}
                  </Text>
                )}
              </div>
            }
          />
        </Col>

        {/* 备用金 */}
        <Col xs={24} sm={12} lg={8}>
          <DashboardCard
            title="备用金"
            icon="💧"
            detailPath="/reserve/detail"
            badge={budget.reserveOverspent > 0 ? '透支' : undefined}
            summary={
              <WaterDrop remaining={budget.reserveRemaining} total={budget.reserveFund > 0 ? budget.reserveFund : 0} />
            }
          />
        </Col>

        {/* 警示看板 */}
        <Col xs={24} sm={12} lg={8}>
          <DashboardCard
            title="警示看板"
            icon="⚠️"
            detailPath="/bills"
            badge={alerts.length > 0 ? String(alerts.length) : undefined}
            summary={
              alerts.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 13 }}>暂无警示，继续保持 🎉</Text>
              ) : (
                <div>
                  {alerts.slice(0, 2).map((bill) => (
                    <div key={bill.id} style={{ marginBottom: 4, fontSize: 12 }}>
                      {bill.tags?.includes('impulse') ? '🔴' : '🟡'}{' '}
                      {formatDate(bill.bill_date)} {bill.note || bill.category}{' '}
                      {formatAmount(Number(bill.amount))}
                    </div>
                  ))}
                </div>
              )
            }
          />
        </Col>

        {/* 物价雷达 */}
        <Col xs={24} sm={12} lg={8}>
          <DashboardCard
            title="物价雷达"
            icon="🔍"
            detailPath="/price"
            summary={
              priceRanking.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 13 }}>暂无物价数据，去录入吧</Text>
              ) : (
                <div>
                  {priceRanking.slice(0, 2).map((item) => (
                    <div key={item.itemName} style={{ fontSize: 12, marginBottom: 4 }}>
                      {item.trend === 'up' ? '📈' : '📉'} {item.itemName}{' '}
                      <span style={{ color: item.trend === 'up' ? '#ff4d4f' : '#52c41a' }}>
                        {item.changePercent > 0 ? '↑' : '↓'}{Math.abs(item.changePercent)}%
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          />
        </Col>

        {/* 成就概览 */}
        <Col xs={24}>
          <DashboardCard
            title="最新成就"
            icon="🏆"
            detailPath="/achievements"
            summary={
              <div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {achievements.latest.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>开始记账，解锁你的第一枚徽章！</Text>
                  ) : (
                    achievements.latest.map((ach) => (
                      <div key={ach.id} style={{
                        padding: '4px 12px',
                        background: '#f6ffed',
                        borderRadius: 8,
                        fontSize: 12,
                        border: '1px solid #b7eb8f',
                      }}>
                        {ach.icon} {ach.name}
                      </div>
                    ))
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  已解锁 {achievements.unlocked}/{achievements.total} 枚徽章
                </Text>
              </div>
            }
          />
        </Col>
      </Row>
    </div>
  );
}
