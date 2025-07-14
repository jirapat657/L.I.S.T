// src/pages/Projects/AddIssueForm/index.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Select,
  message,
  Divider,
  Modal
} from 'antd';
import dayjs from 'dayjs';
import { getUsers } from '@/api/user';
import { Timestamp } from 'firebase/firestore';
import { addIssue } from '@/api/issue';
import type { FormValues, SubtaskData } from '@/types/issue';
import { useQuery, useMutation } from '@tanstack/react-query';
import { calculateOnLateTime } from '@/utils/dateUtils';
import { PlusOutlined } from '@ant-design/icons';
import { useGenerateIssueCode } from '@/hooks/useGenerateIssueCode';
import { getProjects } from '@/api/project';
import SubtaskTable from '@/components/SubtaskTable';
import { duplicateSubtask } from '@/utils/subtaskUtils';
import { priorityOptions, typeOptions } from './helper';
import { getDeveloperOptions, getBATestOptions } from '@/utils/userOptions';

// ใช้ใน AddIssueForm (ขยายแบบ local)
type SubtaskDraft = SubtaskData & { id: string; showFull?: boolean };

const AddIssueForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<SubtaskDraft[]>([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [detailInput, setDetailInput] = useState('');

  const statusOptions = ['Awaiting', 'Inprogress', 'Complete', 'Cancel'];

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // วางตรงนี้ หลัง users ถูกประกาศ
  const developerOptions = React.useMemo(() => getDeveloperOptions(users), [users]);
  const baTestOptions = React.useMemo(() => getBATestOptions(users), [users]);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // === (1) ย้าย logic ไปไว้ในฟังก์ชันสำหรับ useMutation ===
  

  // === (2) useMutation ===
  const mutation = useMutation<
    void, // ผลลัพธ์ที่ได้จาก mutationFn (ไม่ต้องการข้อมูลกลับ)
    unknown, // error type (แนะนำ unknown)
    { values: FormValues; data: SubtaskDraft[] } // input ของ mutationFn
  >({
    mutationFn: async ({ values, data }) => {
      // ----- Logic เดิม -----
      const { startDate, dueDate, completeDate, ...rest } = values;
      const onLateTime = calculateOnLateTime(completeDate, dueDate);

      // หา projectCode จาก projects, id
      const currentProject = projects.find((p) => p.id === id);
      const projectCode = currentProject?.projectId;
      if (!projectCode) throw new Error('ไม่พบ projectId (code)');

      const issuePayload = {
        ...rest,
        projectId: projectCode,
        issueDate: values.issueDate
          ? Timestamp.fromDate(values.issueDate.toDate())
          : Timestamp.now(),
        startDate: startDate ? Timestamp.fromDate(startDate.toDate()) : null,
        dueDate: dueDate ? Timestamp.fromDate(dueDate.toDate()) : null,
        completeDate: completeDate
          ? Timestamp.fromDate(completeDate.toDate())
          : null,
        onLateTime,
        createdAt: Timestamp.now(),
      };

      const subtasks = data
        .filter((row) => row.details.trim())
        .map((row) => ({
          details: row.details,
          date: row.date,
          completeDate: row.completeDate,
          baTest: row.baTest,
          status: row.status,
          remark: row.remark,
          createdAt: row.createdAt,
        }));

      // เรียก addIssue ตามปกติ
      return addIssue(issuePayload, subtasks);
    },

    onSuccess: () => {
      message.success('เพิ่ม Issue สำเร็จ');
      navigate(`/projects/${id}`);
    },

    onError: (error: unknown) => {
      if (error instanceof Error) {
        message.error(error.message);
      } else if (typeof error === 'string') {
        message.error(error);
      } else {
        message.error('เกิดข้อผิดพลาดในการเพิ่ม Issue');
      }
    },
  });
  // === (3) onFinish เรียก mutate ===
  const onFinish = async () => {
    const values = form.getFieldsValue();
    mutation.mutate({ values, data }); // ส่ง data ล่าสุดเข้าไป
  };


  // ✨ เรียก hook สร้าง issueCode อัตโนมัติ
  useGenerateIssueCode(id, form);

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error loading users</div>;

  const handleAddRow = () => {
    const newRow: SubtaskDraft = {
      id: `${Date.now()}`,
      details: '',
      date: Timestamp.fromDate(new Date()),
      completeDate: null,
      baTest: '',
      status: 'Awaiting',
      remark: '',
      createdAt: Timestamp.now(),
      showFull: false,
    };
    setData((prev) => [...prev, newRow]);
  };

  const handleChange = <K extends keyof SubtaskDraft>(
    id: string,
    field: K,
    value: SubtaskDraft[K]
  ) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'details' && typeof value === 'string' && value.trim()) {
            updatedRow.showFull = true;
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleViewDetails = (record: SubtaskDraft) => {
    setEditingKey(record.id);
    setDetailInput(record.details);
    setDetailModalOpen(true);
  };

  const handleUpdateDetail = () => {
    if (!editingKey) return;
    setData((prev) =>
      prev.map((row) =>
        row.id === editingKey ? { ...row, details: detailInput, showFull: true } : row
      )
    );
    setDetailModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((row) => row.id !== id));
    message.success('ลบแถวแล้ว');
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
          <Col span={12}>
            <Form.Item label="Issue Code" name="issueCode" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Issue Date" name="issueDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Type" name="type">
              <Select showSearch placeholder="Select Type" options={typeOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Priority" name="priority">
              <Select showSearch placeholder="Select Priority" options={priorityOptions} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Title" name="title" ><Input /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Description" name="description" ><Input.TextArea rows={4}/></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Status" name="status" rules={[{ required: true }]} initialValue="Awaiting">
              <Select placeholder="Select Status"
              onChange={(value) => {
                const now = dayjs();
                if (value === 'Inprogress') {
                  form.setFieldsValue({ startDate: now });
                } else if (value === 'Complete') {
                  form.setFieldsValue({ completeDate: now });
                }
              }}>
                {statusOptions.map((s) => (
                  <Select.Option key={s} value={s}>{s}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Start Date" name="startDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Due Date" name="dueDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Complete Date" name="completeDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Developer" name="developer" >
              <Select showSearch placeholder="Select Developer" options={developerOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="BA/Test" name="baTest" >
              <Select showSearch placeholder="Select BA/Test" options={baTestOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Remark" name="remark" ><Input.TextArea rows={4} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Additional Document" name="document" ><Input.TextArea rows={4}/></Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Child Work Item</Divider>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Button onClick={handleAddRow}><PlusOutlined /> Add Subtask</Button>
        </div>
        <SubtaskTable
          subtasks={[...data].sort(
            (a, b) =>
              (b.createdAt?.toDate?.()?.getTime?.() ?? 0) -
              (a.createdAt?.toDate?.()?.getTime?.() ?? 0)
          )}
          userOptions={baTestOptions}
          onUpdate={(id, field, value) => handleChange(id, field, value)}
          onDelete={handleDelete}
          onView={handleViewDetails}
          onDuplicate={(row) => {
            const newRow = duplicateSubtask(row);
            console.log('== subtasks หลัง duplicate ==', row);
            setData((prev) => [newRow, ...prev]);
            message.success('คัดลอก Subtask แล้ว');
          }}
        />
        <Modal
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          onOk={handleUpdateDetail}
          title="แก้ไขรายละเอียด Subtask"
          width="80%"
          bodyStyle={{ height: '60vh' }}
        >
          <Input.TextArea
            rows={15}
            value={detailInput}
            onChange={(e) => setDetailInput(e.target.value)}
            style={{ height: '100%' }}
          />
        </Modal>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending} // แสดง loading ขณะ save
          >บันทึก</Button>
        </div>
      </Form>
    </div>
  );
};

export default AddIssueForm;
