import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, message, Spin, Layout } from 'antd'; // Import các thành phần antd
import { createSubject } from '../services/api';
import SubjectForm, { type SubjectFormData } from '../components/SubjectForm';

const { Title } = Typography;

const AddSubjectPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: Partial<SubjectFormData>) => {
    setError(null);
    setIsSaving(true);
    try {
      await createSubject(data as any);
      message.success('Thêm đối tượng thành công!');
      navigate('/subjects');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi.';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <Card 
          title={<Title level={3} style={{ margin: 0 }}>Tạo Đối tượng Mới</Title>}
          style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <Spin spinning={isSaving}>
            <SubjectForm
              onSubmit={handleSubmit}
              isSaving={isSaving}
              submitButtonText="Thêm Đối tượng"
              error={error}
            />
          </Spin>
        </Card>
      </div>
    </Layout>
  );
};

export default AddSubjectPage;