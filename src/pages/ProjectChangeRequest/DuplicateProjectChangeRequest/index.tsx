//src/pages/ProjectChangeRequest/DuplicateProjectChangeRequest/index.tsx
import React, { useState, useEffect } from 'react';
import { Form, message, Spin, Flex } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';

// Component ฟอร์มที่ใช้ซ้ำ
import ProjectChangeRequestForm from '@/components/ProjectChangeRequestForm';

// Types และ API functions ที่เกี่ยวข้อง
import type { ProjectChangeRequest_Firestore } from '@/types/projectChangeRequest';
import { addProjectChangeRequest, getProjectChangeRequestById } from '@/api/projectChangeRequest';

const DuplicateProjectChangeRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ดึง ID จาก URL
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [initialData, setInitialData] = useState<Partial<ProjectChangeRequest_Firestore> | null>(null);
  const [isLoading, setIsLoading] = useState(true); // State สำหรับโหลดข้อมูลต้นฉบับ
  const [isSubmitting, setIsSubmitting] = useState(false); // State สำหรับตอนกดบันทึก

  useEffect(() => {
    if (!id) {
      message.error('No document ID provided.');
      navigate(-1);
      return;
    }

    const fetchOriginalRequest = async () => {
      setIsLoading(true);
      try {
        const data = await getProjectChangeRequestById(id);
        if (data) {
          // เตรียมข้อมูลสำหรับทำสำเนา
          const duplicatedData: Partial<ProjectChangeRequest_Firestore> = {
            ...data,
            id: undefined, // ล้าง ID เดิมออกเพื่อให้ Firestore สร้างใหม่
            jobCode: data.jobCode ? `${data.jobCode}` : '',
            
            // ตั้งค่าวันที่เป็นวันปัจจุบันสำหรับเอกสารใหม่
            date: Timestamp.now(),

            // ล้างข้อมูลลายเซ็นและวันที่
            customerInfo: {
              ...data.customerInfo,
              date: null,
              signature: '',
            },
            serviceByInfo: {
              ...data.serviceByInfo,
              date: null,
              signature: '',
            },
          };
          setInitialData(duplicatedData);
        } else {
          message.error('Original document not found.');
          navigate('/projectchangerequests');
        }
      } catch (error) {
        console.error('Failed to fetch original document:', error);
        message.error('Could not fetch data for duplication.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOriginalRequest();
  }, [id, navigate]);

  const handleFinish = async (values: ProjectChangeRequest_Firestore) => {
    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...payload } = values; // แยก id เดิมทิ้งไป
      await addProjectChangeRequest(payload as ProjectChangeRequest_Firestore);
      message.success('Project Change Request duplicated successfully!');
      navigate('/projectchangerequests');
    } catch (err: unknown) {
      console.error('Failed to duplicate change request:', err);
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save data.');
      } else {
        message.error('An unknown error occurred while saving data.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // แสดง Spinner ขณะกำลังโหลดข้อมูลต้นฉบับ
  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '60vh' }}>
        <Spin size="large" tip="Loading original data..." />
      </Flex>
    );
  }

  return (
    <div>
      
      <ProjectChangeRequestForm
        formInstance={form}
        initialValues={initialData || {}}
        onFinish={handleFinish}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        submitButtonText="Save as Duplicate"
      />
    </div>
  );
};

export default DuplicateProjectChangeRequest;
