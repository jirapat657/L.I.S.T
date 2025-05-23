import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Select,
  Divider,
  Table,
  Button,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getIssueById } from '@/api/issue';
import type { IssueData, Subtask } from '@/types/issue';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const ViewIssuePage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();

  const { data: issue, isLoading } = useQuery<IssueData | null>({
    queryKey: ['issue', issueId],
    queryFn: () => getIssueById(issueId!),
    enabled: !!issueId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!issue) return <div>ไม่พบข้อมูล Issue นี้</div>;

  console.log("📦 Loaded issue:", issue);

  const columns: ColumnsType<Subtask> = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (value: any) => value && value.toDate ? dayjs(value.toDate()).format('DD/MM/YY') : '-',
    },
    { title: 'Details', dataIndex: 'details' },
    {
      title: 'Complete Date',
      dataIndex: 'completeDate',
      render: (value: any) => value && value.toDate ? dayjs(value.toDate()).format('DD/MM/YY') : '-',
    },
    { title: 'BA/Test', dataIndex: 'baTest' },
    { title: 'Remark', dataIndex: 'remark' },
    { title: 'Status', dataIndex: 'status' },
  ];

  const safeDate = (date: any) => (date && date.toDate ? dayjs(date.toDate()) : null);

  return (
    <div>
      <h2>แสดง Issue #{issueId}</h2>

      <Text type="secondary">สร้างเมื่อ: {issue.createdAt && issue.createdAt.toDate ? dayjs(issue.createdAt.toDate()).format('DD/MM/YYYY HH:mm') : '-'}</Text>
      <Divider />

      <Form
        layout="vertical"
        initialValues={{
          issueCode: issue.issueCode,
          issueDate: safeDate(issue.issueDate),
          title: issue.title,
          description: issue.description,
          status: issue.status,
          startDate: safeDate(issue.startDate),
          dueDate: safeDate(issue.dueDate),
          completeDate: safeDate(issue.completeDate),
          developer: issue.developer,
          baTest: issue.baTest,
          remark: issue.remark,
          document: issue.document,
        }}
      >
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Issue Code" name="issueCode"><Input disabled /></Form.Item></Col>
          <Col span={8}><Form.Item label="Issue Date" name="issueDate"><DatePicker format="DD/MM/YY" disabled style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Title" name="title"><Input disabled /></Form.Item></Col>
          <Col span={8}><Form.Item label="Description" name="description"><Input disabled /></Form.Item></Col>
          <Col span={8}><Form.Item label="Status" name="status"><Select disabled><Select.Option value={issue.status}>{issue.status}</Select.Option></Select></Form.Item></Col>
          <Col span={8}><Form.Item label="Start Date" name="startDate"><DatePicker format="DD/MM/YY" disabled style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Due Date" name="dueDate"><DatePicker format="DD/MM/YY" disabled style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Complete Date" name="completeDate"><DatePicker format="DD/MM/YY" disabled style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={8}><Form.Item label="Developer" name="developer"><Input disabled /></Form.Item></Col>
          <Col span={8}><Form.Item label="BA/Test" name="baTest"><Input disabled /></Form.Item></Col>
          <Col span={8}><Form.Item label="Remark" name="remark"><Input disabled /></Form.Item></Col>
          <Col span={8}><Form.Item label="Additional Document" name="document"><Input disabled /></Form.Item></Col>
        </Row>

        <Divider>Subtasks</Divider>

        <Table<Subtask>
          columns={columns}
          dataSource={issue.subtasks ?? []}
          rowKey={(record) => record.id}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button onClick={() => navigate(-1)}>🔙 กลับ</Button>
        </div>
      </Form>
    </div>
  );
};

export default ViewIssuePage;