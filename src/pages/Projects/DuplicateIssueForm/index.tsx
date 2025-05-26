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
  Form, // ✅ เพิ่มบรรทัดนี้เข้าไป
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

import IssueForm from '@/components/IssueForm';
import {
  getIssueById,
  addIssue,
  addSubtask,
  getSubtasksByIssueId,
} from '@/api/issue';
import { getAllUsers } from '@/api/user';
import type { IssueData, Subtask, SubtaskData, IssueFormValues } from '@/types/issue';
import { calculateOnLateTime } from '@/utils/dateUtils';

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
  ];

  if (isLoading || !issue) return <div>Loading...</div>;

  return (
    <div>
      <h2>📄 สร้างสำเนา Issue #{issueId}</h2>
      <Divider />
      <IssueForm issue={issue} form={form} disabled={false} />
      <Divider>Subtasks</Divider>
      <Table
        columns={columns}
        dataSource={subtasks}
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <Divider />
      <div style={{ textAlign: 'right' }}>
        <Button onClick={() => navigate(-1)} style={{ marginRight: 8 }}>
          ยกเลิก
        </Button>
        <Button type="primary" onClick={handleDuplicate}>
          💾 บันทึกสำเนา
        </Button>
      </div>
    </div>
  );
};

export default DuplicateIssueForm;
