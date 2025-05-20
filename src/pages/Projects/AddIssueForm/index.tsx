//src/pages/Projects/AddIssueForm/index.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, DatePicker, Button, Row, Col, Select, message, Divider} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getAllUsers } from '@/api/user';
import { db } from '@/services/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

interface FormValues {
  issueCode: string;
  issueDate?: Dayjs;
  title?: string;
  description?: string;
  status?: string;
  startDate?: Dayjs;
  dueDate?: Dayjs;
  completeDate?: Dayjs;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
}

const AddIssueForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        const uniqueUsers = users.filter(
          (user, index, self) =>
            index === self.findIndex((u) => u.userName === user.userName)
        );
        const options = uniqueUsers.map((user) => ({
          value: user.userName,
          label: user.userName,
        }));
        setUserOptions(options);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);
  

  const onFinish = async (values: FormValues) => {
    try {
      const { startDate, dueDate, completeDate, ...rest } = values;
      let onLateTime = '';

      if (completeDate && dueDate) {
        const diff = completeDate.diff(dueDate, 'day');
        onLateTime = diff <= 0 ? `On Time (${Math.abs(diff)} Day)` : `Late Time (${diff} Day)`;
      }

      const payload = {
        ...rest,
        projectId: id,
        issueDate: values.issueDate?.toDate() || new Date(),
        startDate: startDate?.toDate() || null,
        dueDate: dueDate?.toDate() || null,
        completeDate: completeDate?.toDate() || null,
        onLateTime,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'lucasIssues'), payload);
      message.success('เพิ่ม Issue สำเร็จ');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error adding issue:', error);
      message.error('เกิดข้อผิดพลาดในการเพิ่ม Issue');
    }
  };

  return (
    <div>
      <h2>เพิ่ม Issue ใหม่ในโปรเจกต์ #{id}</h2>

      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        initialValues={{ issueDate: dayjs() }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Issue Code" name="issueCode" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Issue Date" name="issueDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Title" name="title">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Description" name="description">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
              initialValue="Awaiting"
            >
              <Select placeholder="เลือกสถานะ">
                <Select.Option value="Awaiting">Awaiting</Select.Option>
                <Select.Option value="Inprogress">Inprogress</Select.Option>
                <Select.Option value="Complete">Complete</Select.Option>
                <Select.Option value="Cancel">Cancel</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Due Date" name="dueDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Complete Date" name="completeDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Developer" name="developer">
              <Select
                showSearch
                placeholder="เลือก Developer"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={userOptions}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="BA/Test" name="baTest">
              <Select
                showSearch
                placeholder="เลือก BA/Test"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={userOptions}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Remark" name="remark">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Additional Document" name="document">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Section Title</Divider>

        

        {/* ปุ่มบันทึก/ยกเลิก */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => navigate(`/projects/${id}`)}>❌ ยกเลิก</Button>
          <Button type="primary" htmlType="submit">
            💾 บันทึก
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddIssueForm;
