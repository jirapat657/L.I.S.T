// src/pages/DuplicateIssueForm/index.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Divider,
  message,
  Modal,
  Input,
  Form,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
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
import { CopyOutlined, PlusOutlined } from '@ant-design/icons';
import SubtaskTable from '@/components/SubtaskTable';
import { duplicateSubtask } from '@/utils/subtaskUtils';
import type { FirestoreDateInput } from '@/types/common';

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

  const convertToTimestamp = (value: FirestoreDateInput): Timestamp | null => {
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
        status: 'Awaiting',
        createdAt: Timestamp.now(), // 👈 เพิ่ม timestamp ทันที
      };
      setSubtasks((prev) => [newRow, ...prev]); // 👈 แทรกไว้ข้างหน้า
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

  const handleInlineUpdate = <K extends keyof Subtask>(
    id: string,
    field: K,
    value: Subtask[K]
  ) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

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
      <SubtaskTable
        subtasks={subtasks}
        userOptions={userOptions}
        onUpdate={handleInlineUpdate}
        onDelete={handleDeleteSubtask}
        onView={handleViewDetails}
        onDuplicate={(row) => {
          const newRow = duplicateSubtask(row);
          setSubtasks((prev) => [newRow, ...prev]);
          message.success('คัดลอก Subtask แล้ว');
        }}
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
