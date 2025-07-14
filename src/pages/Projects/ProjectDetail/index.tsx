// src/pages/ProjectDetail/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Form } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { collection, deleteDoc, doc, getDocs, query, where, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import IssueTable from '@/components/IssueTable';
import type { Issue } from '@/types/projectDetail';
import SearchFormWithDropdown from "@/components/SearchFormWithDropdown";
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/api/user';
import { getDeveloperOptions, getBATestOptions } from '@/utils/userOptions';
import { defaultFilters, statusOptions } from '@/constants/searchFilters';
import { filterIssues } from '@/utils/filterItems';
import { useTableSearch } from '@/components/useTableSearch';

dayjs.extend(isBetween);

type IssueWithDateString = Issue & {
  issueDate?: string;
  startDate?: string;
  dueDate?: string;
  completeDate?: string;
};

const COLLECTION_NAME = 'LIMIssues';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchForm] = Form.useForm();

  const [issues, setIssues] = useState<IssueWithDateString[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);

  // Custom hook สำหรับ filter state
  const {
    filters,
    handleFilterChange,
     handleReset: resetFromHook, // เปลี่ยนชื่อเพื่อไม่ให้ซ้ำ
  } = useTableSearch(defaultFilters);

  // --- Fetch users สำหรับ dropdown ---
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  const developerOptions = React.useMemo(() => getDeveloperOptions(users), [users]);
  const baTestOptions = React.useMemo(() => getBATestOptions(users), [users]);

  // --- ดึงข้อมูล Issue ---
  const fetchIssues = useCallback(async () => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', id),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const issuesArray: IssueWithDateString[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // แปลง Firestore Timestamp เป็น string
        const parseDate = (d: Timestamp | string | undefined | null) => {
          if (d && typeof d === 'object' && 'toDate' in d) {
            return d.toDate().toISOString().slice(0, 10);
          }
          return d || "";
        };

        issuesArray.push({
          id: docSnap.id,
          ...(data as Omit<Issue, 'id'>),
          issueDate: parseDate(data.issueDate),
          startDate: parseDate(data.startDate),
          dueDate: parseDate(data.dueDate),
          completeDate: parseDate(data.completeDate),
        });
      });

      setIssues(issuesArray);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // --- ดึงชื่อโปรเจกต์ ---
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

  const handleSearch = () => {
    // ปกติใช้ filteredData อัตโนมัติ
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

  // --- Filter Table ---
  const filteredData = filterIssues(issues, filters);

  // ฟังก์ชันตรวจสอบว่ามีการเปลี่ยนแปลง filter หรือไม่
  const hasFiltersChanged = () => {
    return (
      filters.keyword !== defaultFilters.keyword ||
      filters.status !== defaultFilters.status ||
      filters.developer !== defaultFilters.developer ||
      filters.baTest !== defaultFilters.baTest ||
      filters.issueDateFilter.type !== defaultFilters.issueDateFilter.type ||
      filters.startDateFilter.type !== defaultFilters.startDateFilter.type ||
      filters.dueDateFilter.type !== defaultFilters.dueDateFilter.type ||
      filters.completeDateFilter.type !== defaultFilters.completeDateFilter.type
    );
  };

  const handleReset = () => {
    resetFromHook(); // เรียกใช้ฟังก์ชันจาก hook
    searchForm.resetFields(); // รีเซ็ต form
  };

  // --- ACTIONS ---
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
      
      <div style={{ width: "100%" }}>
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 16,
          gap: 10
        }}>
          <SearchFormWithDropdown
            form={searchForm}
            initialValues={defaultFilters}
            onSearch={handleSearch}
            filters={filters}
            handleFilterChange={handleFilterChange}
            statusOptions={statusOptions}
            developerOptions={developerOptions}
            baTestOptions={baTestOptions}
          />
          {hasFiltersChanged() && (
            <Button onClick={handleReset}>
              <SyncOutlined /> Clear Search
            </Button>
          )}
        </div>
      </div>
      
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