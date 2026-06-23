/**
 * @file AlertPage.tsx
 * @description Giao diện quản lý cảnh báo (Alert) phong cách chuyên nghiệp với Ant Design.
 */

import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Input, DatePicker, Row, Col, Space, Drawer, Descriptions, Button, Select, Layout } from 'antd';
import { SearchOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAlerts, getDetailAlert, type Alert } from '../services/api';

const { RangePicker } = DatePicker;


const AlertPage: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
    const [filterParams, setFilterParams] = useState({ type: '', startDate: null, endDate: null });

    const fetchAlerts = async (params: any = {}) => {
        setLoading(true);
        try {
            const page = params.page || pagination.current;
            const limit = params.limit || pagination.pageSize;

            // Tạo đối tượng chứa các filter hiện tại
            const filterData = {
                type: filterParams.type || undefined,
                startDate: filterParams.startDate || undefined,
                endDate: filterParams.endDate || undefined
            };

            // Truyền trực tiếp filterData vào, KHÔNG dùng ...params
            const response = await getAlerts(page, limit, filterData);

            setAlerts(response.data || []);
            setPagination({
                current: response.pagination.current,
                pageSize: response.pagination.limit,
                total: response.pagination.total
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    // Handler khi nhấn nút Lọc
    const handleFilter = () => {
        fetchAlerts({
            type: filterParams.type || undefined,
            startDate: filterParams.startDate,
            endDate: filterParams.endDate
        });
    };

    const handleTableChange = (pag: any) => {
        fetchAlerts({ page: pag.current, limit: pag.pageSize });
    };

    // Handler reset
    const handleReset = () => {
        setFilterParams({ type: '', startDate: null, endDate: null });
        fetchAlerts({});
    };

    const columns = [
        { title: 'Thời gian', dataIndex: 'created_at', render: (t: string) => new Date(t).toLocaleString('vi-VN') },
        { title: 'Đối tượng', dataIndex: ['subject', 'full_name'], render: (name: string) => name || 'N/A' },
        {
            title: 'Loại vi phạm',
            dataIndex: 'type',
            render: (type: string) => (
                <Tag color={type === 'RESTRICTED_ENTRY' ? 'volcano' : 'gold'}>
                    {type === 'RESTRICTED_ENTRY' ? 'Vi phạm vùng cấm' : 'Bỏ lỡ check-in'}
                </Tag>
            )
        },
        { title: 'Nội dung', dataIndex: 'message', ellipsis: true },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <a onClick={async () => {
                    setLoadingDetail(true);
                    setSelectedAlert(null); // Reset để mở drawer
                    const data = await getDetailAlert(record.id);
                    setSelectedAlert(data);
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
                            <Select style={{ width: '100%' }} placeholder="Tất cả loại vi phạm" allowClear onChange={(val) => setFilterParams(p => ({ ...p, type: val }))}>
                                <Select.Option value="RESTRICTED_ENTRY">Vi phạm vùng cấm</Select.Option>
                                <Select.Option value="MISSED_CHECKIN">Bỏ lỡ check-in</Select.Option>
                            </Select>
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
                        dataSource={alerts}
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
                        onChange={handleTableChange}
                    />
                </Card>
            </div>

            <Drawer title="Chi tiết Cảnh báo" width={600} onClose={() => setSelectedAlert(null)} open={!!selectedAlert}>
                {loadingDetail ? <p>Đang tải chi tiết...</p> : selectedAlert && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Thời gian">{new Date(selectedAlert.created_at).toLocaleString('vi-VN')}</Descriptions.Item>
                        <Descriptions.Item label="Đối tượng">{selectedAlert.subject?.full_name || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="CCCD">{selectedAlert.subject?.id_number || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Loại cảnh báo">
                            <Tag color={selectedAlert.type === 'RESTRICTED_ENTRY' ? 'volcano' : 'gold'}>
                                {selectedAlert.type === 'RESTRICTED_ENTRY' ? 'Vi phạm vùng cấm' : 'Bỏ lỡ check-in'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Nội dung">{selectedAlert.message || 'Không có mô tả'}</Descriptions.Item>

                        {/* Hiển thị vùng nếu có */}
                        {selectedAlert.zone && (
                            <Descriptions.Item label="Vùng vi phạm">{selectedAlert.zone.zone_name}</Descriptions.Item>
                        )}

                        {/* Hiển thị thông tin check-in liên quan nếu có */}
                        {selectedAlert.checkin && (
                            <>
                                <Descriptions.Item label="Thời gian check-in">
                                    {new Date(selectedAlert.checkin.checkin_time).toLocaleString('vi-VN')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái check-in">{selectedAlert.checkin.status}</Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                )}
            </Drawer>
        </Layout>
    );
};

export default AlertPage;