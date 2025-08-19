import React, { useState, useEffect } from 'react';
import { Form, message, Spin, Flex } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore'; // [เพิ่ม] import Timestamp
import ClientServiceSheetForm from '@/components/ClientServiceSheetForm';
import type { ClientServiceSheet_Firestore } from '@/types/clientServiceSheet';
import { addClientServiceSheet, getClientServiceSheetById } from '@/api/clientServiceSheet';

const DuplicateClientServiceSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [initialData, setInitialData] = useState<Partial<ClientServiceSheet_Firestore> | null>(null);
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
          const duplicatedData: Partial<ClientServiceSheet_Firestore> = {
            ...data,
            id: undefined, // ล้าง ID เดิมออก
            jobCode: data.jobCode ? `${data.jobCode}` : '',
            
            // [แก้ไข] สร้าง Timestamp ของวันปัจจุบันสำหรับเอกสารใหม่
            date: Timestamp.now(),

            // ล้างข้อมูลลายเซ็นและวันที่ของลูกค้า/ผู้ให้บริการ
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

  const handleFinish = async (values: ClientServiceSheet_Firestore) => {
    setIsSubmitting(true);
    try {
      // [แก้ไข] เพิ่ม comment เพื่อ disable ESLint warning สำหรับบรรทัดนี้โดยเฉพาะ
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...payload } = values;
      await addClientServiceSheet(payload as ClientServiceSheet_Firestore);
      message.success('Service Sheet duplicated successfully!');
      navigate('/clientservicesheets');
    } catch (err: unknown) {
      console.error('Failed to duplicate service sheet:', err);
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save data.');
      } else {
        message.error('Failed to save data.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

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