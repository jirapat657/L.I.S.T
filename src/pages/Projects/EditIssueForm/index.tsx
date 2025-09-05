// src/pages/EditIssueForm/index.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Divider,
  message,
  Modal,
  Input,
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import IssueForm from '@/components/IssueForm';
import {
  getIssueById,
  updateIssue,
  getSubtasksByIssueId,
  updateSubtask,
  deleteSubtask,
  addSubtask
} from '@/api/issue';
import type { IssueData, Subtask } from '@/types/issue';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { getUsers } from '@/api/user';
import { calculateOnLateTime } from '@/utils/dateUtils';
import { PlusOutlined } from '@ant-design/icons';
import SubtaskTable from '@/components/SubtaskTable';
import { duplicateSubtask } from '@/utils/subtaskUtils';
import { getBATestOptions } from '@/utils/userOptions';

const EditIssueFormPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string; projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = useForm();

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInput, setDetailInput] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  const baTestOptions = React.useMemo(() => getBATestOptions(users), [users]);

  const { data: issue, isLoading } = useQuery<IssueData | null>({
    queryKey: ['issue', issueId],
    queryFn: () => getIssueById(issueId!),
    enabled: !!issueId,
  });

  // โหลด subtasks เดิมจาก Firestore
  useEffect(() => {
    if (!issueId) return;
    const fetchSubtasks = async () => {
      const subs = await getSubtasksByIssueId(issueId);
      setSubtasks(subs);
    };
    fetchSubtasks();
  }, [issueId]);

  // สำหรับอัปเดตข้อมูลหลักของ Issue
  const mutation = useMutation({
    mutationFn: (updatedData: Partial<IssueData>) =>
      updateIssue(issueId!, updatedData),
    onSuccess: () => {
      if (!issueId) return;
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      message.success('บันทึกการแก้ไขสำเร็จ');
      navigate(-1);
    },
    onError: () => {
      message.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    },
  });

  // ฟังก์ชันสำหรับบันทึก/อัปเดต/เพิ่ม subtasks
  const saveSubtasks = async () => {
    if (!issueId) return;

    // โหลดรายการ subtasks เดิมจาก Firestore เพื่อเช็คว่าตัวไหนเก่า
    const originalSubs = await getSubtasksByIssueId(issueId);
    const originalIds = originalSubs.map((s) => s.id);

    // แยกเป็น 3 กลุ่ม
    const toAdd = subtasks.filter((s) => !originalIds.includes(s.id));
    const toUpdate = subtasks.filter((s) => originalIds.includes(s.id));
    // const toDelete = originalSubs.filter((os) => !subtasks.some(s => s.id === os.id)); // ไม่ handle delete ที่นี่

    // เพิ่ม subtask ใหม่
    for (const sub of toAdd) {
      if (!sub.details.trim()) continue; // ถ้าต้องการไม่เอาที่ details ว่างออก
      await addSubtask(issueId, {
        details: sub.details,
        date: convertToTimestamp(sub.date),
        completeDate: convertToTimestamp(sub.completeDate),
        baTest: sub.baTest,
        remark: sub.remark,
        status: sub.status,
        createdAt: sub.createdAt,
      });
    }
    // อัปเดต subtask เดิม
    for (const sub of toUpdate) {
      await updateSubtask(issueId, sub.id, {
        details: sub.details,
        date: convertToTimestamp(sub.date),
        completeDate: convertToTimestamp(sub.completeDate),
        baTest: sub.baTest,
        remark: sub.remark,
        status: sub.status,
      });
    }

    // โหลด subtasks ใหม่จาก Firestore แล้วอัปเดต state
    const refreshed = await getSubtasksByIssueId(issueId);
    setSubtasks(refreshed);
  };

  // แปลง Dayjs, Timestamp หรือ Date → Timestamp
  const convertToTimestamp = (
    value: Timestamp | { toDate?: () => Date } | Date | null | undefined
  ): Timestamp | null => {
    if (!value) return null;
    if (value instanceof Timestamp) return value;
    if (value instanceof Date) return Timestamp.fromDate(value);
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof value.toDate === 'function'
    ) {
      return Timestamp.fromDate(value.toDate());
    }
    return null;
  };

  // เมื่อกด "บันทึก"
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const cleanedValues = {
        ...values,
        issueDate: values.issueDate?.toDate?.() ?? values.issueDate,
        startDate: values.startDate?.toDate?.() ?? values.startDate,
        dueDate: values.dueDate?.toDate?.() ?? values.dueDate,
        completeDate: values.completeDate?.toDate?.() ?? values.completeDate,
        onLateTime: calculateOnLateTime(values.completeDate, values.dueDate),
      };

      await mutation.mutateAsync(cleanedValues); // อัปเดต Issue หลัก
      await saveSubtasks(); // อัปเดตและเพิ่ม Subtask ทั้งหมด

      // invalidate query เผื่อ reload
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });

      message.success('บันทึกการแก้ไขสำเร็จ');
      
    } catch (err) {
      console.error('❌ Error ใน handleSave:', err);
      message.error('บันทึกไม่สำเร็จ');
    }
  };

  // เพิ่ม Subtask ใหม่
  const handleAddRow = () => {
    const newRow: Subtask & { id: string } = {
      id: uuidv4(),
      details: '',
      date: Timestamp.fromDate(new Date()),
      completeDate: null,
      baTest: '',
      remark: '',
      status: 'Awaiting',
      createdAt: Timestamp.now(),
    };
    setSubtasks((prev) => [newRow, ...prev]);
  };

  // Duplicate subtask
  const handleDuplicate = (row: Subtask) => {
    const newRow = duplicateSubtask(row);
    setSubtasks((prev) => [newRow, ...prev]);
    message.success('คัดลอก Subtask แล้ว');
  };

  // ดูรายละเอียด subtask
  const handleViewDetails = (sub: Subtask) => {
    setEditingSubtask(sub);
    setDetailInput(sub.details || '');
    setDetailModalOpen(true);
  };

  // ลบ subtask เฉพาะใน db (ถ้าเป็นของเดิม)
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!issueId) return;

    // ถ้าเป็น subtask ที่เพิ่งสร้าง (uuid/ยังไม่เคย save) ให้ลบออกจาก state เท่านั้น
    const sub = subtasks.find(s => s.id === subtaskId);
    if (sub && subtaskId.length > 20) {
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      return;
    }

    await deleteSubtask(issueId, subtaskId);
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    message.success('ลบ Subtask สำเร็จ');
  };

  // แก้ไขรายละเอียดใน modal
  const handleUpdateDetail = async () => {
    if (!editingSubtask || !issueId) return;

    // ถ้าเป็นของใหม่ อัปเดตใน state เท่านั้น
    if (editingSubtask.id.length > 20) {
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === editingSubtask.id ? { ...s, details: detailInput } : s
        )
      );
      setDetailModalOpen(false);
      return;
    }

    await updateSubtask(issueId, editingSubtask.id, { details: detailInput });
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === editingSubtask.id ? { ...s, details: detailInput } : s
      )
    );
    setDetailModalOpen(false);
    message.success('อัปเดตรายละเอียดสำเร็จ');
  };

  // inline edit (กรณีแก้ไข subtask แบบทันที)
  const handleInlineUpdate = async <K extends keyof Subtask>(
    subtaskId: string,
    field: K,
    value: Subtask[K]
  ) => {
    if (!issueId) return;
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, [field]: value } : s
      )
    );

    // ของใหม่ ไม่ต้อง update ไปที่ backend
    if (subtaskId.length > 20) return;

    try {
      await updateSubtask(issueId, subtaskId, { [field]: value });
      message.success('บันทึกสำเร็จ');
    } catch (err) {
      console.error(err);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!issue) return <div>ไม่พบข้อมูล Issue ที่ต้องการแก้ไข</div>;

  return (
    <div>
      <Divider />
      <IssueForm issue={issue} form={form} disabled={false} />
      <Divider orientation="left">Child Work Item</Divider>
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Button onClick={handleAddRow}><PlusOutlined /> Add Subtask</Button>
      </div>
      <SubtaskTable
        subtasks={subtasks}
        userOptions={baTestOptions}
        onUpdate={handleInlineUpdate}
        onDelete={handleDeleteSubtask}
        onView={handleViewDetails}
        onDuplicate={handleDuplicate}
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
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
        <Button type="primary" htmlType="submit" onClick={handleSave}>บันทึก</Button>
      </div>
    </div>
  );
};

export default EditIssueFormPage;
