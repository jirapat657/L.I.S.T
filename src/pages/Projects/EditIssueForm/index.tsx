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
import { v4 as uuidv4 } from 'uuid'; // npm i uuid (หากยังไม่ได้ติดตั้ง)
import { Timestamp } from 'firebase/firestore';
import { getUsers } from '@/api/user';
import { calculateOnLateTime } from '@/utils/dateUtils';
import { PlusOutlined } from '@ant-design/icons';
import SubtaskTable from '@/components/SubtaskTable';
import { duplicateSubtask } from '@/utils/subtaskUtils';
import { getBATestOptions } from '@/utils/userOptions';

const EditIssueFormPage: React.FC = () => {
  const { issueId, projectId } = useParams<{
    issueId: string;
    projectId: string;
  }>();
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

  // วางตรงนี้ หลัง users ถูกประกาศ
  const baTestOptions = React.useMemo(() => getBATestOptions(users), [users]);

    const { data: issue, isLoading } = useQuery<IssueData | null>({
      queryKey: ['issue', issueId],
      queryFn: () => getIssueById(issueId!),
      enabled: !!issueId,
    });

  const mutation = useMutation({
    mutationFn: (updatedData: Partial<IssueData>) =>
      updateIssue(issueId!, updatedData),
    onSuccess: () => {
      if (!issueId) return;

      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });

      message.success('บันทึกการแก้ไขสำเร็จ');
      navigate(`/projects/${projectId}`);
    },
    onError: () => {
      message.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    },
  });

  useEffect(() => {
    if (!issueId) return;
    const fetchSubtasks = async () => {
      const subs = await getSubtasksByIssueId(issueId);
      setSubtasks(subs);
    };
    fetchSubtasks();
  }, [issueId]);

  const handleAddRow = () => {
    const newRow: Subtask & { id: string } = {
      id: uuidv4(), // ใช้ UUID เป็น id ชั่วคราว
      details: '',
      date: Timestamp.fromDate(new Date()),
      completeDate: null,
      baTest: '',
      remark: '',
      status: 'Awaiting',
      createdAt: Timestamp.now(), // 👈 เพิ่ม timestamp ทันที
    };

    setSubtasks((prev) => [newRow, ...prev]); // 👈 แทรกไว้ข้างหน้า
  };

  /**
 * แปลงค่า Dayjs, Timestamp หรือ Date → Timestamp ของ Firestore
 */
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

/**
 * บันทึกเฉพาะ Subtask ใหม่ที่ถูกเพิ่ม (UUID)
 * และรีโหลด subtasks จาก Firestore หลังจากเพิ่ม
 */
const saveNewSubtasks = async () => {
  if (!issueId) return;

  const newSubs = subtasks.filter(
    (s) => s.id.length > 20 && s.details.trim()
  );

  for (const sub of newSubs) {
    try {
      console.log('📌 Subtask ที่กำลังจะเพิ่ม:', sub);
      await addSubtask(issueId, {
        details: sub.details,
        date: convertToTimestamp(sub.date),
        completeDate: convertToTimestamp(sub.completeDate),
        baTest: sub.baTest,
        remark: sub.remark,
        status: sub.status,
        createdAt: sub.createdAt, // ✅ ส่งค่าตรงนี้! (ไม่ต้อง Timestamp.now())
      });
      console.log('✅ เพิ่ม subtask สำเร็จ:', sub.details);
    } catch (error) {
      console.error(`❌ เพิ่ม subtask ล้มเหลว: ${sub.details}`, error);
      message.error('ไม่สามารถเพิ่ม Subtask ใหม่ได้');
    }
  }

  // ✅ โหลด subtasks ใหม่จาก Firestore แล้วอัปเดต state
  try {
    const refreshed = await getSubtasksByIssueId(issueId);
    setSubtasks(refreshed);
    console.log('🔄 โหลด subtasks ใหม่สำเร็จ:', refreshed);
  } catch (error) {
    console.error('❌ โหลด subtasks ใหม่ไม่สำเร็จ:', error);
    message.warning('ไม่สามารถโหลด subtasks ล่าสุดได้');
  }
};

/**
 * ฟังก์ชันหลักที่เรียกตอนกด “บันทึก”
 * ทั้งอัปเดต Issue หลัก และบันทึก Subtask ใหม่
 */
const handleSave = async () => {
  try {
    const values = await form.validateFields();
    console.log('📄 ค่า form ที่ validate แล้ว:', values);

    const cleanedValues = {
      ...values,
      issueDate: values.issueDate?.toDate?.() ?? values.issueDate,
      startDate: values.startDate?.toDate?.() ?? values.startDate,
      dueDate: values.dueDate?.toDate?.() ?? values.dueDate,
      completeDate: values.completeDate?.toDate?.() ?? values.completeDate,
      onLateTime: calculateOnLateTime(values.completeDate, values.dueDate),
    };

    console.log('🧼 ค่า cleanedValues ที่จะอัปเดต:', cleanedValues);
    await mutation.mutateAsync(cleanedValues); // ✅ รอ mutation ให้เสร็จก่อน
    console.log('✅ อัปเดต issue สำเร็จ');

    await saveNewSubtasks(); // ✅ เพิ่ม subtasks แล้วโหลดใหม่

    queryClient.invalidateQueries({ queryKey: ['issue', issueId] });

    message.success('บันทึกการแก้ไขสำเร็จ');
    navigate(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Error ใน handleSave:', err);
    message.error('บันทึกไม่สำเร็จ');
  }
};


  const handleViewDetails = (sub: Subtask) => {
    setEditingSubtask(sub);
    setDetailInput(sub.details || '');
    setDetailModalOpen(true);
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

    const isTemp = subtaskId.length > 20; // uuid ชั่วคราว
    if (isTemp) return;

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
        subtasks={subtasks}  // state! ไม่ใช่ issue.subtasks
        userOptions={baTestOptions}
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
        <Button type="primary" htmlType="submit" onClick={handleSave}>บันทึก</Button>
      </div>
    </div>
  );
};

export default EditIssueFormPage;
