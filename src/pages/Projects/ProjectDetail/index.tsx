// src/pages/ProjectDetail/index.tsx
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  DatePicker,
  Row,
  Col,
  Table,
  Dropdown,
  Button,
} from 'antd';
import type {MenuProps} from 'antd'
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

interface Issue {
  key: number;
  issueCode: string;
  issueDate: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  dueDate: string;
  completeDate: string;
  onLateTime: string;
  developer: string;
  baTest: string;
  remark: string;
  document: string;
}

interface Filters {
  issueCode: string;
  issueDate: Dayjs | null;
  title: string;
  status: string;
  startDate: Dayjs | null;
  dueDate: Dayjs | null;
  completeDate: Dayjs | null;
  developer: string;
  baTest: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({
    issueCode: '',
    issueDate: null,
    title: '',
    status: '',
    startDate: null,
    dueDate: null,
    completeDate: null,
    developer: '',
    baTest: '',
  });

  const data: Issue[] = [
    {
      key: 1,
      issueCode: 'ISS-001',
      issueDate: '2024-05-01',
      title: 'ฟีเจอร์ A',
      description: 'ระบบล็อกอิน',
      status: 'Done',
      startDate: '2024-04-01',
      dueDate: '2024-04-10',
      completeDate: '2024-04-09',
      onLateTime: 'On Time',
      developer: 'คุณต้น',
      baTest: 'คุณฝ้าย',
      remark: 'ไม่มีปัญหา',
      document: 'Doc.pdf',
    },
  ];

  const handleFilterChange = (field: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredData = data.filter((item) => {
    return (
      item.issueCode.toLowerCase().includes(filters.issueCode.toLowerCase()) &&
      item.title.toLowerCase().includes(filters.title.toLowerCase()) &&
      item.status.toLowerCase().includes(filters.status.toLowerCase()) &&
      item.developer.toLowerCase().includes(filters.developer.toLowerCase()) &&
      item.baTest.toLowerCase().includes(filters.baTest.toLowerCase()) &&
      (!filters.issueDate ||
        item.issueDate === dayjs(filters.issueDate).format('YYYY-MM-DD')) &&
      (!filters.startDate ||
        item.startDate === dayjs(filters.startDate).format('YYYY-MM-DD')) &&
      (!filters.dueDate ||
        item.dueDate === dayjs(filters.dueDate).format('YYYY-MM-DD')) &&
      (!filters.completeDate ||
        item.completeDate ===
          dayjs(filters.completeDate).format('YYYY-MM-DD'))
    );
  });

  const [tableData, setTableData] = useState<Issue[]>(data);

  const handleMenuClick = (key: string, record: Issue) => {
    const issueId = record.key;
    if (key === 'delete') {
      setTableData((prev) => prev.filter((item) => item.key !== issueId));
    } else {
      navigate(`/projects/${id}/${key}/${issueId}`);
    }
  };

  const columns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      render: (_: any, __: any, index: number) => index + 1,
    },
    { title: 'Issue Code', dataIndex: 'issueCode', key: 'issueCode' },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    {
      title: 'Complete',
      dataIndex: 'completeDate',
      key: 'completeDate',
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    { title: 'On/Late Time', dataIndex: 'onLateTime', key: 'onLateTime' },
    { title: 'Developer', dataIndex: 'developer', key: 'developer' },
    { title: 'BA/Test', dataIndex: 'baTest', key: 'baTest' },
    { title: 'Remark', dataIndex: 'remark', key: 'remark' },
    { title: 'Additional Document', dataIndex: 'document', key: 'document' },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: Issue) => {
        const items: MenuProps['items'] = [
          { key: 'view', label: '🔍 View' },
          { key: 'edit', label: '✏️ Edit' },
          { key: 'duplicate', label: '📄 Duplicate' },
          { key: 'delete', label: '🗑️ Delete', danger: true },
        ];

        return (
          <Dropdown
            menu={{
              items,
              onClick: ({ key }) => handleMenuClick(key, record),
            }}
            trigger={['click']}
          >
            <Button>⋯</Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <h2>รายละเอียดโปรเจกต์ #{id}</h2>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate(`/projects/${id}/add`)}>
          ➕ Add Issue
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          onClick={() =>
            setFilters({
              issueCode: '',
              issueDate: null,
              title: '',
              status: '',
              startDate: null,
              dueDate: null,
              completeDate: null,
              developer: '',
              baTest: '',
            })
          }
        >
          🧹 ล้างการค้นหา
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Input
            placeholder="Issue Code"
            value={filters.issueCode}
            onChange={(e) => handleFilterChange('issueCode', e.target.value)}
          />
        </Col>
        <Col span={4}>
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Issue Date"
            value={filters.issueDate}
            onChange={(date) => handleFilterChange('issueDate', date)}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="Title"
            value={filters.title}
            onChange={(e) => handleFilterChange('title', e.target.value)}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="Developer"
            value={filters.developer}
            onChange={(e) => handleFilterChange('developer', e.target.value)}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(date) => handleFilterChange('startDate', date)}
          />
        </Col>
        <Col span={4}>
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Due Date"
            value={filters.dueDate}
            onChange={(date) => handleFilterChange('dueDate', date)}
          />
        </Col>
        <Col span={4}>
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Complete Date"
            value={filters.completeDate}
            onChange={(date) => handleFilterChange('completeDate', date)}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="BA/Test"
            value={filters.baTest}
            onChange={(e) => handleFilterChange('baTest', e.target.value)}
          />
        </Col>
        <Col span={4}></Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData.length ? filteredData : tableData}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default ProjectDetail;
