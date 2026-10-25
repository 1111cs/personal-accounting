import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface DashboardCardProps {
  title: string;
  icon?: string;
  summary: React.ReactNode;
  detailPath: string;
  badge?: string;
  extra?: React.ReactNode;
}

export default function DashboardCard({ title, icon, summary, detailPath, badge, extra }: DashboardCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(detailPath)}
      style={{
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
        height: '100%',
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14, color: '#666' }}>
          {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
          {title}
          {badge && (
            <span style={{
              marginLeft: 8,
              fontSize: 10,
              background: '#ff4d4f',
              color: '#fff',
              padding: '1px 6px',
              borderRadius: 10,
            }}>
              {badge}
            </span>
          )}
        </Text>
        <RightOutlined style={{ color: '#bbb', fontSize: 12 }} />
      </div>
      <div>{summary}</div>
      {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
    </Card>
  );
}
