import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/useAppStore';
import { authApi } from '../../api/auth.api';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { setUser, setToken } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const api = mode === 'login' ? authApi.login : authApi.register;
      const res = await api(values.username, values.password);
      setToken(res.data.token);
      setUser(res.data.user);
      message.success(mode === 'login' ? '登录成功' : '注册成功');
      navigate('/');
    } catch (error: any) {
      // 错误已在拦截器处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 16,
    }}>
      <Card style={{ width: '100%', maxWidth: 400, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
          <Title level={3} style={{ margin: 0 }}>个人记账系统</Title>
          <Text type="secondary">轻量、克制、懂研究生的财务伴侣</Text>
        </div>

        <Tabs
          activeKey={mode}
          onChange={(k) => setMode(k as 'login' | 'register')}
          centered
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ]}
        />

        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item name="password" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 8, height: 44 }}>
              {mode === 'login' ? '登录' : '注册'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
