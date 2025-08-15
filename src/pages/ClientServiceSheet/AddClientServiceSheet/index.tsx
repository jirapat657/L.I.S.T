// src/pages/AddClientServiceSheet/index.tsx

import React, { useState } from 'react';
import { Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import ClientServiceSheetForm from '@/components/ClientServiceSheetForm';
import type { ClientServiceSheetData } from '@/types/clientServiceSheet';
import { addClientServiceSheet } from '@/api/clientServiceSheet'; // สมมติว่ามี API function นี้

const AddClientServiceSheet: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function ที่จะถูกเรียกเมื่อฟอร์มผ่านการตรวจสอบและถูกส่ง
  const handleFinish = async (values: ClientServiceSheetData) => {
    // สามารถเพิ่มการตรวจสอบข้อมูลขั้นสุดท้ายที่นี่ได้
    if (values.chargeTypes?.includes('extra') && !values.extraChargeDescription) {
      message.error('Please fill in the Extra Charge description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addClientServiceSheet(values);
      message.success('Service Sheet added successfully!');
      form.resetFields(); // ล้างค่าในฟอร์ม
      navigate('/clientservicesheets'); // กลับไปที่หน้ารายการ
    } catch (err: any) {
      console.error('Failed to add service sheet:', err);
      message.error(err?.message || 'Failed to save data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function สำหรับปุ่ม Cancel
  const handleCancel = () => {
    navigate(-1); // กลับไปหน้าก่อนหน้า
  };

  return (
    <div>
      <h2>Add Client Service Sheet</h2>
      <ClientServiceSheetForm
        formInstance={form}
        onFinish={handleFinish}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        submitButtonText="Create Sheet"
      />
    </div>
  );
};

export default AddClientServiceSheet;