//src/pages/ClientServiceSheet/DuplicateClientServiceSheet/index.tsx
import React, { useState, useEffect } from 'react';
import { Form, message, Spin, Flex } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs'; // [เพิ่ม] import dayjs
import ClientServiceSheetForm from '@/components/ClientServiceSheetForm';
import type { ClientServiceSheetData } from '@/types/clientServiceSheet';
import { addClientServiceSheet, getClientServiceSheetById } from '@/api/clientServiceSheet';

const DuplicateClientServiceSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [initialData, setInitialData] = useState<Partial<ClientServiceSheetData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      message.error('No document ID provided.');
      navigate(-1);
      return;
    }

    const fetchOriginalSheet = async () => {
      setIsLoading(true);
      try {
        const data = await getClientServiceSheetById(id);
        if (data) {
          const duplicatedData: Partial<ClientServiceSheetData> = {
            ...data,
            id: undefined,
            jobCode: data.jobCode ? `${data.jobCode}-COPY` : '',
            
            // [แก้ไข] เปลี่ยนค่า date จาก null เป็น dayjs() หรือปล่อยเป็น undefined
            // เพื่อให้ DatePicker ได้รับค่าเริ่มต้นที่ถูกต้อง
            date: dayjs(), // ตั้งเป็นวันปัจจุบัน

            customerInfo: {
              ...data.customerInfo,
              date: null, // สำหรับ DatePicker ในส่วนนี้ปล่อยเป็น null หรือ undefined ได้ เพราะฟอร์มจัดการได้
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
          navigate('/clientservicesheets');
        }
      } catch (error) {
        console.error('Failed to fetch original document:', error);
        message.error('Could not fetch data for duplication.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOriginalSheet();
  }, [id, navigate]);

  const handleFinish = async (values: ClientServiceSheetData) => {
    setIsSubmitting(true);
    try {
      await addClientServiceSheet(values);
      message.success('Service Sheet duplicated successfully!');
      navigate('/clientservicesheets');
    } catch (err: any) {
      console.error('Failed to duplicate service sheet:', err);
      message.error(err?.message || 'Failed to save data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // [แก้ไข] ลบ prop 'tip' ออกจาก Spin
  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '60vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <div>
      <h2>Duplicate Client Service Sheet</h2>
      <ClientServiceSheetForm
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

export default DuplicateClientServiceSheet;