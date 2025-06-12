// src/pages/ProjectDetail/index.tsx
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  DatePicker,
  Row,
  Col,
  Button,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { collection, deleteDoc, doc, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import IssueTable from '@/components/IssueTable'; // Import the IssueTable component
import type { Filters, Issue } from '@/types/projectDetail';

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

  const [projectName, setProjectName] = useState<string | null>(null);

  const COLLECTION_NAME = 'LIMIssues';

  const fetchIssues = useCallback(async () => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', id),
        orderBy('createdAt', 'desc')
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
  }, [id]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // ดึงชื่อโปรเจกต์
  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'LIMProjects', id!));
        if (projectDoc.exists()) {
          setProjectName(projectDoc.data().projectName || `Project ${id}`);
        } else {
          setProjectName(`Project ${id}`);
        }
      } catch (error) {
        console.error(error);
        setProjectName(`Project ${id}`);
      }
    };
    if (id) fetchProjectName();
  }, [id]);

  const handleFilterChange = <K extends keyof Filters>(
    field: K,
    value: Filters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (issueId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, issueId));
      setIssues((prev) => prev.filter((item) => item.id !== issueId));
      message.success('Deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('Failed to delete');
    }
  };

  const filteredData = issues.filter((item) => {
    return (
      (item.issueCode ?? '').toLowerCase().includes((filters.issueCode ?? '').toLowerCase()) &&
      (item.title ?? '').toLowerCase().includes((filters.title ?? '').toLowerCase()) &&
      (item.status ?? '').toLowerCase().includes((filters.status ?? '').toLowerCase()) &&
      (item.developer ?? '').toLowerCase().includes((filters.developer ?? '').toLowerCase()) &&
      (item.baTest ?? '').toLowerCase().includes((filters.baTest ?? '').toLowerCase()) &&
      (!filters.issueDate || item.issueDate === dayjs(filters.issueDate).format('YYYY-MM-DD')) &&
      (!filters.startDate || item.startDate === dayjs(filters.startDate).format('YYYY-MM-DD')) &&
      (!filters.dueDate || item.dueDate === dayjs(filters.dueDate).format('YYYY-MM-DD')) &&
      (!filters.completeDate || item.completeDate === dayjs(filters.completeDate).format('YYYY-MM-DD'))
    );
  });

  const handleView = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/view/${issueId}`);
  };

  const handleEdit = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/edit/${issueId}`);
  };

  const handleDuplicate = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/duplicate/${issueId}`);
  };

  return (
    <div>
      <h2>{projectName ? `${projectName}` : `#${id}`}. Issue Log</h2>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate(`/projects/${id}/add`)}>
          <PlusOutlined /> Add Issue
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
          <SyncOutlined /> Clear Search
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

      <IssueTable
        issues={filteredData}
        onDelete={handleDelete}
        loading={false}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
};

export default ProjectDetail;
