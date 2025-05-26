// src/pages/Projects/ViewIssue/index.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Divider,
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import IssueForm from '@/components/IssueForm';
import { getIssueById } from '@/api/issue';
import type { IssueData, Subtask } from '@/types/issue';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

const ViewIssuePage: React.FC = () => {
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

  const columns: ColumnsType<Subtask> = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (value: any) =>
        value && value.toDate ? dayjs(value.toDate()).format('DD/MM/YY') : '-',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      ellipsis: true,
    },
    {
      title: 'Complete Date',
      dataIndex: 'completeDate',
      render: (value: any) =>
        value && value.toDate ? dayjs(value.toDate()).format('DD/MM/YY') : '-',
    },
    {
      title: 'BA/Test',
      dataIndex: 'baTest',
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
    },
    {
      title: 'Status',
      dataIndex: 'status',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Subtask) => (
        <Button
          size="small"
          onClick={() =>
            setDetailModal({ visible: true, content: record.details || '—' })
          }
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>แสดง Issue #{issueId}</Title>

      <Text type="secondary">
        สร้างเมื่อ:{' '}
        {issue.createdAt && issue.createdAt.toDate
          ? dayjs(issue.createdAt.toDate()).format('DD/MM/YYYY HH:mm')
          : '-'}
      </Text>

      <Divider />

      <IssueForm issue={issue} form={form} disabled />

      <Divider>Subtasks</Divider>

      <Table<Subtask>
        columns={columns}
        dataSource={issue.subtasks ?? []}
        rowKey={(record) => record.id}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => navigate(-1)}>🔙 กลับ</Button>
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
