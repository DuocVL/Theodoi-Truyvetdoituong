import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Input, DatePicker, Row, Col, Space, Drawer, Descriptions, Button } from 'antd';
import { SearchOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';
import { getSystemLogs, getDetailLog } from '../../services/api';

const { RangePicker } = DatePicker;

const SystemLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // State cho bộ lọc
  const [filterParams, setFilterParams] = useState({ userId: '', startDate: null, endDate: null });

  const fetchLogs = async (params: any = {}) => {
    setLoading(true);
    try {
      // Ưu tiên page/limit từ params, nếu không có thì lấy từ state
      const page = params.page || pagination.current;
      const limit = params.limit || pagination.pageSize;

      const data = await getSystemLogs({ page, limit, ...params });

      setLogs(data.logs || []);
      setPagination({
        current: data.page,
        pageSize: data.limit,
        total: data.total // Dữ liệu total từ server
      });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  // Handler khi nhấn nút Lọc
  const handleFilter = () => {
    fetchLogs({
      userId: filterParams.userId || undefined,
      startDate: filterParams.startDate,
      endDate: filterParams.endDate
    });
  };

  const handleTableChange = (pag: any) => {
    fetchLogs({ page: pag.current, limit: pag.pageSize });
  };

  // Handler reset
  const handleReset = () => {
    setFilterParams({ userId: '', startDate: null, endDate: null });
    fetchLogs({});
  };

  const columns = [
    { title: 'Thời gian', dataIndex: 'created_at', render: (t: string) => new Date(t).toLocaleString() },
    { title: 'Danh mục', dataIndex: 'category', render: (c: string) => <Tag color="geekblue">{c}</Tag> },
    { title: 'Hành động', dataIndex: 'action', render: (a: string) => <Tag color="orange">{a}</Tag> },
    { title: 'User ID', dataIndex: 'user_id', ellipsis: true },
    { title: 'IP', dataIndex: 'ip_address' },
    { title: 'Status', dataIndex: 'status_code', render: (s: number) => <Tag color={s >= 400 ? 'red' : 'green'}>{s}</Tag> },
    { title: 'Thời gian xử lý', dataIndex: 'duration_ms', render: (d: number) => `${d}ms` },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <a onClick={async () => {
          setLoadingDetail(true);
          setSelectedLog(null); // Reset để mở drawer
          const data = await getDetailLog(record.id);
          setSelectedLog(data);
          setLoadingDetail(false);
        }}>
          <EyeOutlined /> Xem chi tiết
        </a>
      )
    }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>

        {/* Khối Bộ lọc */}
        <Card style={{ flexShrink: 0 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input
                placeholder="Tìm theo UserID"
                prefix={<SearchOutlined />}
                value={filterParams.userId}
                onChange={(e) => setFilterParams({ ...filterParams, userId: e.target.value })}
              />
            </Col>
            <Col span={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={[filterParams.startDate, filterParams.endDate]}
                onChange={(dates: any) => setFilterParams({ ...filterParams, startDate: dates?.[0], endDate: dates?.[1] })}
              />
            </Col>
            <Col span={8}>
              <Space>
                <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>Lọc</Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Khối Bảng */}
        <Card title="Nhật ký hệ thống" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flexGrow: 1, overflow: 'hidden' }}>
          <Table
            dataSource={logs}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800, y: 'calc(100vh - 300px)' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true
            }}
            onChange={handleTableChange} // QUAN TRỌNG: Gọi hàm này khi chuyển trang
          />
        </Card>
      </div>

      <Drawer title="Chi tiết Nhật ký" width={600} onClose={() => setSelectedLog(null)} open={!!selectedLog}>
        {loadingDetail ? <p>Đang tải chi tiết...</p> : selectedLog && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="Hành động">{selectedLog.action}</Descriptions.Item>
            <Descriptions.Item label="Dữ liệu cũ"><pre>{JSON.stringify(selectedLog.old_data, null, 2)}</pre></Descriptions.Item>
            <Descriptions.Item label="Dữ liệu mới"><pre>{JSON.stringify(selectedLog.new_data, null, 2)}</pre></Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Layout>
  );
};

export default SystemLogsPage;