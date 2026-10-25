import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Typography, Tag, Space, Button, Popconfirm,
  Input, Select, DatePicker, Empty, Spin, Pagination, Segmented,
} from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined, WalletOutlined, BankOutlined } from '@ant-design/icons';
import { useBillStore } from '../../stores/useBillStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import type { Bill } from '../../types';
import { formatAmount, formatDate, getCategoryName } from '../../utils/format';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function BillList() {
  const navigate = useNavigate();
  const { bills, total, loading, fetchBills, deleteBill } = useBillStore();
  const { fetchCalculation } = useBudgetStore();
  const [filters, setFilters] = useState<Record<string, any>>({ page: 1, pageSize: 20 });

  useEffect(() => {
    fetchBills(filters);
  }, [filters]);

  const handleDelete = async (id: number) => {
    await deleteBill(id);
    fetchCalculation();
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, keyword: value || undefined, page: 1 }));
  };

  // 按日期分组
  const groupBills = (bills: Bill[]) => {
    const groups: Record<string, Bill[]> = {};
    bills.forEach((bill) => {
      const label = formatDate(bill.bill_date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(bill);
    });
    return groups;
  };

  const grouped = groupBills(bills);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="搜索备注..."
          allowClear
          onSearch={handleSearch}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="板块"
          allowClear
          style={{ width: 120 }}
          onChange={(v) => setFilters((prev) => ({ ...prev, category: v, page: 1 }))}
          options={[
            { label: '日常饮食', value: 'food' },
            { label: '其他消费', value: 'other' },
          ]}
        />
        <Select
          placeholder="标签"
          allowClear
          style={{ width: 120 }}
          onChange={(v) => setFilters((prev) => ({ ...prev, tags: v, page: 1 }))}
          options={[
            { label: '大宗消费', value: 'big_spend' },
            { label: '冲动消费', value: 'impulse' },
          ]}
        />
        <Segmented
          size="middle"
          options={[
            { label: '全部来源', value: undefined },
            { label: '💰 日常开支', value: 'daily' },
            { label: '💧 备用金', value: 'reserve' },
          ]}
          onChange={(v) => setFilters((prev) => ({ ...prev, source: v || undefined, page: 1 }))}
        />
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          {bills.length === 0 && !filters.keyword && !filters.category && !filters.tags && !filters.source ? (
            <Empty description="暂无账单记录" />
          ) : bills.length === 0 ? (
            <Empty description="没有匹配的账单记录" />
          ) : (
            <div>
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <Text strong style={{ fontSize: 14, color: '#999' }}>{dateLabel}</Text>
                  <List
                    dataSource={items}
                    renderItem={(bill) => (
                      <List.Item
                        style={{ padding: '12px 0', cursor: 'pointer' }}
                        onClick={() => navigate(`/bills/${bill.id}`)}
                        actions={[
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => { e.stopPropagation(); navigate(`/record/${bill.id}`); }}
                          />,
                          <Popconfirm
                            title="确定删除？"
                            onConfirm={(e) => { e?.stopPropagation(); handleDelete(bill.id); }}
                            onCancel={(e) => e?.stopPropagation()}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text>{getCategoryName(bill.category)}</Text>
                              <Text strong>{formatAmount(Number(bill.amount))}</Text>
                              {bill.source === 'reserve' && (
                                <Tag icon={<BankOutlined />} color="blue" style={{ fontSize: 10 }}>备用金</Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space size={4} wrap>
                              {bill.source !== 'reserve' && (
                                <Tag icon={<WalletOutlined />} style={{ fontSize: 10, borderColor: '#d9d9d9' }}>日常开支</Tag>
                              )}
                              {bill.note && <Text type="secondary">{bill.note}</Text>}
                              {bill.tags?.map((tag) => (
                                <Tag key={tag} color={tag === 'impulse' ? 'red' : 'orange'} style={{ fontSize: 10 }}>
                                  {tag === 'impulse' ? '冲动' : '大宗'}
                                </Tag>
                              ))}
                              {bill.is_overeat && <Tag color="volcano" style={{ fontSize: 10 }}>热量超标</Tag>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
          {total > filters.pageSize && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                current={filters.page}
                pageSize={filters.pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(t) => `共 ${t} 条`}
                size="small"
                onChange={(page, pageSize) => setFilters((prev) => ({ ...prev, page, pageSize }))}
              />
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
}
