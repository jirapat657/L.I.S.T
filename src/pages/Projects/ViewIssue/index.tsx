// src/pages/Projects/ViewIssue/index.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Divider,
  Typography,
  Button,
  Space,
  Modal,
  Form,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import IssueForm from '@/components/IssueForm';
import { getIssueById } from '@/api/issue';
import type { IssueData } from '@/types/issue';
import { CaretLeftOutlined } from '@ant-design/icons';
import SubtaskTable from '@/components/SubtaskTable';

const { Text } = Typography;

const ViewIssuePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: issue, isLoading } = useQuery<IssueData | null>({
    queryKey: ['issue', issueId],
    queryFn: () => getIssueById(issueId!),
    enabled: !!issueId,
  });

  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    content: string;
  }>({ visible: false, content: '' });

  if (isLoading) return <div>Loading...</div>;
  if (!issue) return <div>ไม่พบข้อมูล Issue นี้</div>;

  const userOptions = issue.subtasks?.map((s) => s.baTest)
    .filter((val, idx, arr) => val && arr.indexOf(val) === idx)
    .map((val) => ({ label: val!, value: val! })) ?? [];
  
  const sortedSubtasks = [...(issue.subtasks ?? [])].sort(
    (a, b) =>
      (a.createdAt?.toDate?.()?.getTime?.() ?? 0) -
      (b.createdAt?.toDate?.()?.getTime?.() ?? 0)  
  );

  return (
    <div>


      <Text type="secondary">
        สร้างเมื่อ:{' '}
        {issue.createdAt && issue.createdAt.toDate
          ? dayjs(issue.createdAt.toDate()).format('DD/MM/YYYY HH:mm')
          : '-'}
      </Text>

      <Divider />

      <IssueForm issue={issue} form={form} disabled />

      <Divider orientation="left">Child Work Item</Divider>

      <SubtaskTable
        subtasks={sortedSubtasks}
        userOptions={userOptions}
        onUpdate={() => {}}
        onDelete={() => {}}
        onDuplicate={() => {}}
        onView={(record) =>
          setDetailModal({ visible: true, content: record.details || '—' })
        }
        readOnly
      />

      <Divider />
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => navigate(`/projects/${id}`)}><CaretLeftOutlined /> กลับ</Button>
        </Space>
      </div>

      <Modal
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, content: '' })}
        footer={null}
        title="รายละเอียด Subtask"
        width="80%"
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {detailModal.content}
        </pre>
      </Modal>
    </div>
  );
};

export default ViewIssuePage;
