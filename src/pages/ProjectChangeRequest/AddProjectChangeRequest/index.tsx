//src/pages/ProjectChangeRequest/AddProjectChangeRequest/index.tsx
import React from 'react';
import { Form, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Component ฟอร์มที่ใช้ซ้ำ
import ProjectChangeRequestForm from '@/components/ProjectChangeRequestForm';

// นำเข้า Type และ API function จริง
import type { ProjectChangeRequest_Firestore } from '@/types/projectChangeRequest';
import { addProjectChangeRequest } from '@/api/projectChangeRequest';

const AddProjectChangeRequest: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message: messageApi } = App.useApp();

  // [แก้ไข] สร้าง mutation instance ด้วย useMutation
  const mutation = useMutation({
    mutationFn: addProjectChangeRequest,
    onSuccess: () => {
      // เมื่อสำเร็จ: Invalidate query เพื่อให้ข้อมูลในหน้ารายการอัปเดตล่าสุด
      queryClient.invalidateQueries({ queryKey: ['projectChangeRequests'] });
      messageApi.success('Project Change Request added successfully!');
      form.resetFields();
      navigate('/projectchangerequests');
    },
    onError: (err: Error) => {
      console.error('Failed to add change request:', err);
      messageApi.error(err.message || 'Failed to save data.');
    },
  });

  // [แก้ไข] ปรับ handleFinish ให้เรียกใช้ mutation.mutate
  const handleFinish = async (values: ProjectChangeRequest_Firestore) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...payload } = values;
    mutation.mutate(payload as ProjectChangeRequest_Firestore);
    navigate('/projectchangerequests');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div>
      
      <ProjectChangeRequestForm
        formInstance={form}
        onFinish={handleFinish}
        onCancel={handleCancel}
        // [แก้ไข] ใช้ isPending จาก mutation เพื่อแสดงสถานะ loading
        isLoading={mutation.isPending}
        submitButtonText="บันทึก"
      />
    </div>
  );
};

export default AddProjectChangeRequest;