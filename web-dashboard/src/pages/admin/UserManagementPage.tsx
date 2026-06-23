import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Popconfirm, message, Input, Row, Col, Select } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';
import { getAllUsersApi, deleteUserApi } from '../../services/api';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const fetchUsers = async (name?: string, role?: string) => {
    setLoading(true);
    try {
      // Gọi API với query params mới
      const response = await getAllUsersApi(name, role);
      setUsers(response.data || []);
    } catch (err) { /* ... */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteUserApi(id);
      message.success('Đã xóa thành công');
      fetchUsers(searchTerm);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa');
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={role === 'ADMIN' ? 'gold' : 'blue'}>{role}</Tag> },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => <Tag color={status ? 'green' : 'red'}>{status ? 'Hoạt động' : 'Đã xóa'}</Tag>
    },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => {
        // LOGIC: KHÔNG hiện nút xóa nếu là ADMIN hoặc đã bị xóa (status false)
        const canDelete = record.role !== 'ADMIN' && record.status === true;
        return canDelete ? (
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        ) : null;
      },
    },
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input placeholder="Tìm theo tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Chọn vai trò"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setRoleFilter(value)}
              >
                <Select.Option value="ADMIN">ADMIN</Select.Option>
                <Select.Option value="USER">USER</Select.Option>
              </Select>
            </Col>
            <Col>
              <Button type="primary" onClick={() => fetchUsers(searchTerm, roleFilter)}>Tìm kiếm</Button>
            </Col>
          </Row>
        </Card>

        <Card title="Quản lý người dùng">
          <Table
            columns={columns}
            dataSource={users}
            loading={loading}
            rowKey="id"
          />
        </Card>
      </div>
    </Layout>
  );
};

export default UserManagementPage;