import { Switch, Space, Typography, Popconfirm, Select, message } from 'antd';
import { useState } from 'react';
import { useBudgetStore } from '../../stores/useBudgetStore';

const { Text } = Typography;

export default function SocialSwitch() {
  const { socialMode, toggleSocialMode, calculation } = useBudgetStore();
  const [loading, setLoading] = useState(false);
  const [multiplier, setMultiplier] = useState<number>(1.3);
  const isActive = socialMode !== null;

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setLoading(true);
      try {
        await toggleSocialMode(1.3); // 关闭传任意值
        message.success('社交模式已关闭');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmOpen = async () => {
    setLoading(true);
    try {
      await toggleSocialMode(multiplier);
      message.success(`社交模式已开启（×${multiplier}）`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <Space>
        <span style={{ fontSize: 20 }}>🎯</span>
        <Text strong>社交模式</Text>
        {isActive ? (
          <Switch
            checked
            loading={loading}
            onChange={handleToggle}
            style={{ marginLeft: 8 }}
          />
        ) : (
          <Popconfirm
            title="开启社交模式"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>选择消费倍率：</div>
                <Select
                  value={multiplier}
                  onChange={setMultiplier}
                  style={{ width: 120 }}
                  options={[
                    { label: '×1.3 普通社交', value: 1.3 },
                    { label: '×1.5 高消费', value: 1.5 },
                  ]}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                  多花部分将从备用金扣除
                </div>
              </div>
            }
            onConfirm={handleConfirmOpen}
            okText="确认开启"
            cancelText="取消"
          >
            <Switch checked={false} loading={loading} style={{ marginLeft: 8 }} />
          </Popconfirm>
        )}
      </Space>
      {isActive && calculation && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#1677ff' }}>
          今日可用额度：¥{(calculation.dailyAllowance * socialMode.multiplier).toFixed(2)}（×{socialMode.multiplier}）
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>多花部分从备用金扣除</Text>
        </div>
      )}
    </div>
  );
}
