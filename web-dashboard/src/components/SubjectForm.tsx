


import React from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { type Subject } from '../services/api';
import dayjs from 'dayjs'; // Giả sử bạn để type ở file riêng

export type SubjectFormData = Omit<Subject, '_id' | 'createdAt' | 'updatedAt' | 'account'>;

interface SubjectFormProps {
  initialData?: Partial<SubjectFormData>;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
  submitButtonText: string;
  error?: string | null;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ initialData, onSubmit, isSaving, submitButtonText }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Xử lý khi submit form
  const onFinish = async (values: any) => {
    // Format dữ liệu trước khi gửi lên API
    const processedData = {
      ...values,
      monitoringStart: values.monitoringStart ? values.monitoringStart.toISOString() : undefined,
      monitoringEnd: values.monitoringEnd ? values.monitoringEnd.toISOString() : undefined,
    };
    await onSubmit(processedData);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...initialData,
        gender: initialData?.gender || 'Other',
        interval_minutes: initialData?.interval_minutes ?? 30,
        grace_minutes: initialData?.grace_minutes ?? 5,
        // Convert date string to dayjs object for AntD
        monitoringStart: initialData?.monitoringStart ? dayjs(initialData.monitoringStart) : undefined,
        monitoringEnd: initialData?.monitoringEnd ? dayjs(initialData.monitoringEnd) : undefined,
      }}
      onFinish={onFinish}
    >
      <Row gutter={24}>
        <Col span={12}><Form.Item label="Họ tên" name="fullName" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
        
        <Col span={12}><Form.Item label="Ngày sinh" name="dob"><Input type="date" /></Form.Item></Col>
        <Col span={12}>
          <Form.Item label="Giới tính" name="gender">
            <Select>
              <Select.Option value="Male">Nam</Select.Option>
              <Select.Option value="Female">Nữ</Select.Option>
              <Select.Option value="Other">Khác</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}><Form.Item label="CCCD/CMND" name="idNumber"><Input /></Form.Item></Col>
        <Col span={12}><Form.Item label="SĐT" name="phone"><Input /></Form.Item></Col>
        
        <Col span={24}><Form.Item label="Địa chỉ" name="address"><Input /></Form.Item></Col>

        <Col span={12}><Form.Item label="Khoảng cách check-in (phút)" name="interval_minutes"><InputNumber min={1} style={{width:'100%'}} /></Form.Item></Col>
        <Col span={12}><Form.Item label="Thời gian chờ (phút)" name="grace_minutes"><InputNumber min={0} style={{width:'100%'}} /></Form.Item></Col>

        <Col span={12}><Form.Item label="Giờ bắt đầu" name="active_start_time"><Input type="time" /></Form.Item></Col>
        <Col span={12}><Form.Item label="Giờ kết thúc" name="active_end_time"><Input type="time" /></Form.Item></Col>
      </Row>

      <div style={{ textAlign: 'right', marginTop: '20px' }}>
        <Button onClick={() => navigate('/subjects')} style={{ marginRight: '10px' }}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={isSaving}>{submitButtonText}</Button>
      </div>
    </Form>
  );
};

export default SubjectForm;