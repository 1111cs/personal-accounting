import { Card, Typography, Button, Space, Divider, message } from 'antd';
import { DownloadOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

const { Text, Title } = Typography;

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/export/csv?month=${new Date().toISOString().slice(0, 7)}`, '_blank');
  };

  const handleExportPDF = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/export/pdf?month=${new Date().toISOString().slice(0, 7)}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>⚙️ 设置</Title>

      {/* 用户信息 */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: '#1677ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20,
          }}>
            <UserOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 16 }}>{user?.username || '用户'}</Text>
            <br />
            <Text type="secondary">注册于 {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</Text>
          </div>
        </Space>
      </Card>

      {/* 数据导出 */}
      <Card title="数据导出" style={{ borderRadius: 12, marginBottom: 16 }}>
        <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
          导出当月账单数据，支持 CSV（Excel 兼容）和 PDF 月度报告格式。
        </Text>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
            导出 CSV
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>
            导出 PDF 月报
          </Button>
        </Space>
      </Card>

      {/* 关于 */}
      <Card title="关于" style={{ borderRadius: 12, marginBottom: 16 }}>
        <Text type="secondary">
          个人记账系统 V1.1<br />
          适配研究生群体的轻量财务伴侣<br />
          以"看见即改变"为核心理念
        </Text>
      </Card>

      <Divider />
      <Button danger icon={<LogoutOutlined />} block size="large" onClick={handleLogout}
        style={{ borderRadius: 8 }}>
        退出登录
      </Button>
    </div>
  );
}
