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
  Select,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { Issue, Filters } from '@/types/projectDetail';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issues, setIssues] = useState<Issue[]>([]);
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

  const fetchIssues = async () => {
    try {
      const q = query(
        collection(db, 'lucasIssues'),
        where('projectId', '==', id),
        orderBy('createdAt', 'desc') // ✅ เพิ่มบรรทัดนี้เพื่อเรียงจากใหม่ไปเก่า
      );
  
      const querySnapshot = await getDocs(q);
      const issuesArray: Issue[] = [];
  
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        issuesArray.push({ id: docSnap.id, ...(data as Omit<Issue, 'id'>) });
      });
  
      setIssues(issuesArray);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [id]);

  const handleFilterChange = (field: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (issueId: string) => {
    try {
      await deleteDoc(doc(db, 'lucasIssues', issueId));
      setIssues((prev) => prev.filter((item) => item.id !== issueId));
      message.success('Deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('Failed to delete');
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'lucasIssues', issueId), { status: newStatus });
      setIssues((prev) =>
        prev.map((item) => (item.id === issueId ? { ...item, status: newStatus } : item))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Status update failed');
    }
  };

  const filteredData = issues.filter((item) => {
    return (
      item.issueCode.toLowerCase().includes(filters.issueCode.toLowerCase()) &&
      item.title.toLowerCase().includes(filters.title.toLowerCase()) &&
      item.status.toLowerCase().includes(filters.status.toLowerCase()) &&
      item.developer.toLowerCase().includes(filters.developer.toLowerCase()) &&
      item.baTest.toLowerCase().includes(filters.baTest.toLowerCase()) &&
      (!filters.issueDate || item.issueDate === dayjs(filters.issueDate).format('YYYY-MM-DD')) &&
      (!filters.startDate || item.startDate === dayjs(filters.startDate).format('YYYY-MM-DD')) &&
      (!filters.dueDate || item.dueDate === dayjs(filters.dueDate).format('YYYY-MM-DD')) &&
      (!filters.completeDate || item.completeDate === dayjs(filters.completeDate).format('YYYY-MM-DD'))
    );
  });

  const columns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      render: (_: any, __: any, index: number) => issues.length - index,
    },    
    { title: 'Issue Code', dataIndex: 'issueCode', key: 'issueCode' },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
          return dayjs(timestamp.toDate()).format('DD/MM/YY');
        }
        return dayjs(timestamp).format('DD/MM/YY');
      },
    },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Issue) => (
        <Select
          value={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          options={['Awaiting','Inprogress', 'Complete', 'Cancel'].map((s) => ({ label: s, value: s }))}
        />
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
          return dayjs(timestamp.toDate()).format('DD/MM/YY');
        }
        return dayjs(timestamp).format('DD/MM/YY');
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
          return dayjs(timestamp.toDate()).format('DD/MM/YY');
        }
        return dayjs(timestamp).format('DD/MM/YY');
      },
    },
    {
      title: 'Complete Date',
      dataIndex: 'completeDate',
      key: 'completeDate',
      render: (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
          return dayjs(timestamp.toDate()).format('DD/MM/YY');
        }
        return dayjs(timestamp).format('DD/MM/YY');
      },
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
              onClick: ({ key }) => {
                if (key === 'delete') handleDelete(record.id);
                else navigate(`/projects/${id}/${key}/${record.id}`);
              },
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
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default ProjectDetail;