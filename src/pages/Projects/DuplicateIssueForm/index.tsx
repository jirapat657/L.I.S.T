// src/pages/DuplicateIssueForm/index.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Divider,
  message,
  Table,
  Dropdown,
  Modal,
  Input,
  Popconfirm,
  DatePicker,
  Select,
  Form,
} from 'antd';
import type { MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

import IssueForm from '@/components/IssueForm';
import {
  getIssueById,
  addIssue,
  getSubtasksByIssueId,
  deleteSubtask,
  updateSubtask
} from '@/api/issue';
import { getAllUsers } from '@/api/user';
import type { Subtask, SubtaskData, IssueFormValues } from '@/types/issue';
import { calculateOnLateTime } from '@/utils/dateUtils';
import { CopyOutlined, DeleteOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';

const DuplicateIssueForm: React.FC = () => {
  const { issueId, projectId } = useParams<{ issueId: string; projectId: string }>();
  console.log("🔍 projectId:", projectId);
  console.log("🔍 issueId:", issueId);
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInput, setDetailInput] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => getIssueById(issueId!),
    enabled: !!issueId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  const userOptions = React.useMemo(
    () =>
      users.map((user) => ({
        value: user.userName,
        label: user.userName,
      })),
    [users]
  );

  useEffect(() => {
    if (issueId) {
      getSubtasksByIssueId(issueId).then(setSubtasks);
    }
  }, [issueId]);

  const convertToTimestamp = (value: any): Timestamp | null => {
    if (!value) return null;
    if (value instanceof Timestamp) return value;
    if (value instanceof Date) return Timestamp.fromDate(value);
    if (typeof value.toDate === 'function') return Timestamp.fromDate(value.toDate());
    return null;
  };

  const handleAddRow = () => {
      const newRow: SubtaskData & { id: string } = {
        id: uuidv4(), // ใช้ id ชั่วคราว ไม่ชนกับ Firebase
        details: '',
        date: Timestamp.fromDate(new Date()), // ✅ ถูกต้อง
        completeDate: null,
        baTest: '',
        remark: '',
        status: 'Awaitting',
      };
      setSubtasks((prev) => [...prev, newRow]);
    };

  const handleViewDetails = (sub: Subtask) => {
      setEditingSubtask(sub);
      setDetailInput(sub.details || '');
      setDetailModalOpen(true);
      console.log(sub,"subbbbbbb")
    };
  
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!issueId) return;
    await deleteSubtask(issueId, subtaskId);
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    message.success('ลบ Subtask สำเร็จ');
  };

  const handleUpdateDetail = async () => {
    if (!editingSubtask || !issueId) return;
    await updateSubtask(issueId, editingSubtask.id, { details: detailInput });
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === editingSubtask.id ? { ...s, details: detailInput } : s
      )
    );
    setDetailModalOpen(false);
    message.success('อัปเดตรายละเอียดสำเร็จ');
  };

  const handleDuplicate = async () => {
    try {
      const values = await form.validateFields();

      const newIssue: IssueFormValues = {
        ...values,
        projectId: projectId!,
        issueDate: convertToTimestamp(values.issueDate)!,
        startDate: convertToTimestamp(values.startDate),
        dueDate: convertToTimestamp(values.dueDate),
        completeDate: convertToTimestamp(values.completeDate),
        onLateTime: calculateOnLateTime(values.completeDate, values.dueDate),
        createdAt: Timestamp.now(),
      };

      const newSubtasks: SubtaskData[] = subtasks.map((sub) => ({
        details: sub.details,
        date: convertToTimestamp(sub.date),
        completeDate: convertToTimestamp(sub.completeDate),
        baTest: sub.baTest,
        remark: sub.remark,
        status: sub.status,
      }));

      await addIssue(newIssue, newSubtasks);

      message.success('เพิ่มสำเนา Issue เรียบร้อยแล้ว');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('❌ Error duplicating issue:', error);
      message.error('ไม่สามารถเพิ่มสำเนา Issue ได้');
    }
  };

  const handleInlineUpdate = (id: string, field: keyof Subtask, value: any) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (value: any, record: Subtask) => (
        <DatePicker
          value={value?.toDate ? dayjs(value.toDate()) : null}
          onChange={(date) =>
            handleInlineUpdate(record.id, 'date', date ? Timestamp.fromDate(date.toDate()) : null)
          }
        />
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (text: string, record: Subtask) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleInlineUpdate(record.id, 'details', e.target.value)}
          rows={1}
        />
      ),
    },
    {
      title: 'Complete Date',
      dataIndex: 'completeDate',
      render: (value: any, record: Subtask) => (
        <DatePicker
          value={value?.toDate ? dayjs(value.toDate()) : null}
          onChange={(date) =>
            handleInlineUpdate(
              record.id,
              'completeDate',
              date ? Timestamp.fromDate(date.toDate()) : null
            )
          }
        />
      ),
    },
    {
      title: 'BA/Test',
      dataIndex: 'baTest',
      render: (text: string, record: Subtask) => (
        <Select
          value={text}
          onChange={(val) => handleInlineUpdate(record.id, 'baTest', val)}
          options={userOptions}
          style={{ width: 150 }}
          showSearch
        />
      ),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      render: (text: string, record: Subtask) => (
        <Input
          value={text}
          onChange={(e) => handleInlineUpdate(record.id, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text: string, record: Subtask) => (
        <Select
          value={text}
          onChange={(val) => handleInlineUpdate(record.id, 'status', val)}
          style={{ width: 120 }}
          options={[
            { label: 'Awaiting', value: 'Awaiting' },
            { label: 'Complete', value: 'Complete' },
            { label: 'Fail', value: 'Fail' },
          ]}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Subtask) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            label: (<><EyeOutlined /> View</>),
            onClick: () => handleViewDetails(record),
          },
          {
            key: 'delete',
            label: (
              <Popconfirm
                title="ยืนยันการลบ Subtask นี้?"
                onConfirm={() => handleDeleteSubtask(record.id)}
                okText="ลบ"
                cancelText="ยกเลิก"
              >
                <DeleteOutlined /> Delete
              </Popconfirm>
            ),
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small"><MoreOutlined /></Button>
          </Dropdown>
        );
      },
    },
  ];

  if (isLoading || !issue) return <div>Loading...</div>;

  return (
    <div>
      <h2><CopyOutlined /> สร้างสำเนา Issue #{issueId}</h2>
      <Divider />
      <IssueForm issue={issue} form={form} disabled={false} />
      <Divider orientation="left">Child Work Item</Divider>
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Button onClick={handleAddRow}><PlusOutlined /> Add Subtask</Button>
      </div>
      <Table
        columns={columns}
        dataSource={subtasks}
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        onOk={handleUpdateDetail}
        title="แก้ไขรายละเอียด Subtask"
        width="80%" // ✅ เต็มหน้าจอเกือบสุด
        bodyStyle={{ height: '60vh' }} // ✅ เพิ่มความสูง
      >
        <Input.TextArea
          rows={15}
          value={detailInput}
          onChange={(e) => setDetailInput(e.target.value)}
          style={{ height: '100%' }}
        />
      </Modal>
      <Divider />   
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button onClick={() => navigate(`/projects/${projectId}`)}>ยกเลิก</Button>
        <Button type="primary" htmlType="submit" onClick={handleDuplicate}>บันทึกสำเนา</Button>
      </div>
    </div>
  );
};

export default DuplicateIssueForm;
