import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, InputNumber, Button, Typography, message, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useBudgetStore } from '../../stores/useBudgetStore';

const { Title, Text } = Typography;

export default function Budget() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { budget, loading, fetchBudget, updateBudget } = useBudgetStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBudget();
  }, []);

  useEffect(() => {
    if (budget) {
      form.setFieldsValue({
        total_budget: Number(budget.total_budget),
        reserve_fund: Number(budget.reserve_fund),
        spent_base: Number(budget.spent_base),
      });
    }
  }, [budget]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await updateBudget({
        ...values,
        budget_month: budget?.budget_month || new Date().toISOString().slice(0, 7),
      });
      message.success('预算设置成功');
    } catch (error: any) {
      message.error(error.message || '设置失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <span>预算设置</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}
            initialValues={{ total_budget: 2500, reserve_fund: 200, spent_base: 0 }}
          >
            <Form.Item name="total_budget" label="月度总预算"
              rules={[{ required: true, message: '请输入月度总预算' }]}
            >
              <InputNumber prefix="¥" style={{ width: '100%' }} min={0} precision={2} size="large"
                placeholder="例如：2500" />
            </Form.Item>

            <Form.Item name="reserve_fund" label="大额备用金"
              rules={[{ required: true, message: '请输入备用金金额' }]}
              extra="备用金不参与日常消耗进度计算，用于应急和社交超额"
            >
              <InputNumber prefix="¥" style={{ width: '100%' }} min={0} precision={2} size="large"
                placeholder="例如：200" />
            </Form.Item>

            <Form.Item name="spent_base" label="本月已花金额（初始基数）"
              extra="如果月中开始使用，可填入本月已消费金额"
            >
              <InputNumber prefix="¥" style={{ width: '100%' }} min={0} precision={2} size="large"
                placeholder="例如：350" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={submitting} block size="large"
              style={{ borderRadius: 8 }}>
              保存预算
            </Button>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
