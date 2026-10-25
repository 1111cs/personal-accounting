import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography } from 'antd';
import {
  HomeOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  TrophyOutlined,
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  UserOutlined,
  LogoutOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../stores/useAppStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useEffect } from 'react';

const { Content, Footer } = AntLayout;
const { Text } = Typography;

const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/bills', icon: <UnorderedListOutlined />, label: '账单' },
  { key: '/stats', icon: <PieChartOutlined />, label: '看板' },
  { key: '/budget', icon: <WalletOutlined />, label: '预算' },
  { key: '/achievements', icon: <TrophyOutlined />, label: '成就' },
  { key: '/price', icon: <SearchOutlined />, label: '物价' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAppStore();
  const { fetchCalculation } = useBudgetStore();

  useEffect(() => {
    fetchCalculation();
  }, []);

  const currentKey = '/' + location.pathname.split('/')[1];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航 */}
      <AntLayout.Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 56,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text strong style={{ fontSize: 18, color: '#1677ff' }}>💰 个人记账</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/record')}
            size="middle"
          >
            记一笔
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <Text>{user?.username || '用户'}</Text>
            </div>
          </Dropdown>
        </div>
      </AntLayout.Header>

      {/* 内容区 */}
      <Content style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>

      {/* 底部导航（移动端） */}
      <Footer
        style={{
          padding: 0,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
        }}
      >
        <Menu
          mode="horizontal"
          selectedKeys={[currentKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{
            justifyContent: 'center',
            borderBottom: 'none',
          }}
        />
      </Footer>
    </AntLayout>
  );
}
