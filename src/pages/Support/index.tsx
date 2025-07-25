// src/pages/Support/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { message, Button, Form, Modal } from 'antd';
import IssueTable from '@/components/IssueTable';
import { useNavigate } from 'react-router-dom';
import SearchFormWithDropdown from '@/components/SearchFormWithDropdown';
import { statusOptions, defaultFilters } from '@/constants/searchFilters';
import { filterIssues } from '@/utils/filterItems';
import { useTableSearch } from '@/components/useTableSearch';
import { getUsers } from '@/api/user';
import { useQuery } from '@tanstack/react-query';
import { getDeveloperOptions, getBATestOptions } from '@/utils/userOptions';
import { SyncOutlined } from '@ant-design/icons';
import { getAllIssues, deleteIssue, getIssuesByProjectName } from '@/api/issue';
import { getProjects } from '@/api/project';
import type { FilterValues } from '@/types/filter';
import type { IssueData } from '@/types/issue';
import type { OptionType } from '@/types/filter';

type IssueWithProjectName = IssueData & { projectName: string };

const Support: React.FC = () => {
  // State สำหรับเก็บข้อมูลทั้งหมดของ issue และข้อมูลที่ฟิลเตอร์แล้ว
  const [issues, setIssues] = useState<IssueWithProjectName[]>([]);
  const [filteredData, setFilteredData] = useState<IssueWithProjectName[]>([]);
  const [projectOptions, setProjectOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<Error | null>(null);

  const navigate = useNavigate();
  const [searchForm] = Form.useForm();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; issueCode?: string } | null>(null);

  const {
    filters,
    handleFilterChange,
    handleReset: resetFromHook,
  } = useTableSearch(defaultFilters);

  // ดึงข้อมูลผู้ใช้งาน (developer, baTest options)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // ดึงข้อมูลโปรเจกต์เพื่อใช้ใน dropdown และ mapping
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // ดึง issues + ผูก projectName ให้แต่ละ issue
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [issuesData, projectsData] = await Promise.all([
        getAllIssues(),
        getProjects()
      ]);
      const projectMap = Object.fromEntries(
        projectsData.map((p: { id: string; projectName: string }) => [p.id, p.projectName])
      );
      const issuesWithProjectName: IssueWithProjectName[] = issuesData.map((issue: IssueData) => ({
        ...issue,
        projectName: projectMap[issue.projectId] || 'Unknown'
      }));
      setIssues(issuesWithProjectName);
      setFilteredData(issuesWithProjectName); // default = all
    } catch (err) {
      setError(err as Error);
      message.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ตั้งค่าตัวเลือกโปรเจกต์
  useEffect(() => {
    if (projects.length > 0) {
      setProjectOptions(
        projects.map((project: { id: string; projectName: string }) => ({
          label: project.projectName,
          value: project.projectName,
        }))
      );
    }
  }, [projects]);

  const developerOptions = getDeveloperOptions(users);
  const baTestOptions = getBATestOptions(users);

  const handleReset = () => {
    resetFromHook();
    searchForm.resetFields();
    setFilteredData(issues);  // รีเซ็ตให้แสดงข้อมูลทั้งหมด
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    message.loading({ content: 'กำลังลบ...', key: 'delete' });
    try {
      await deleteIssue(deleteTarget.id);
      message.success({ content: 'ลบสำเร็จ', key: 'delete' });
      await fetchData();
      setFilteredData(prev =>
        prev.filter(issue => issue.id !== deleteTarget.id)
      );  // อัปเดตข้อมูลหลังลบ
    } catch (error) {
      console.error('ลบไม่สำเร็จ:', error);
      message.error({ content: 'ลบไม่สำเร็จ', key: 'delete' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleView = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/view/${issueId}`);
  };

  const handleEdit = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/edit/${issueId}`);
  };

  const handleDuplicate = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/duplicate/${issueId}`);
  };

  // ฟังก์ชันสำหรับค้นหาข้อมูล
  const handleSearch = async (filters: FilterValues) => {
    try {
      let searchResults: IssueWithProjectName[] = [];

      // ขั้นตอนที่ 1: ดึงข้อมูลจาก Firebase ถ้ามีการเลือก projectName
      if (filters.projectName) {
        // getIssuesByProjectName return IssueData[] → ต้อง map ใส่ projectName อีก
        const rawIssues = await getIssuesByProjectName(filters.projectName);
        const matchedProject = projects.find((p: { id: string; projectName: string }) => p.projectName === filters.projectName);
        searchResults = rawIssues.map((issue: IssueData) => ({
          ...issue,
          projectName: matchedProject?.projectName || 'Unknown'
        }));
      } else {
        searchResults = issues;  // ถ้าไม่มีการเลือก projectName ให้ใช้ข้อมูลทั้งหมด
      }

      // ขั้นตอนที่ 2: ฟิลเตอร์ข้อมูลตามเงื่อนไขอื่นๆ เช่น status, developer, baTest
      const filtered = filterIssues(searchResults, filters);
      setFilteredData(filtered as IssueWithProjectName[]);  // อัปเดตข้อมูลที่กรองแล้ว

    } catch (error) {
      console.error('Search error:', error);
      message.error('เกิดข้อผิดพลาดในการค้นหา');
    }
  };

  const hasFiltersChanged = () => {
    for (const key of Object.keys(defaultFilters) as (keyof FilterValues)[]) {
      const defaultValue = defaultFilters[key];
      const filterValue = filters[key];
      if (
        typeof defaultValue === "object" &&
        defaultValue !== null &&
        "type" in defaultValue
      ) {
        // date filter case
        if (
          typeof filterValue !== "object" ||
          filterValue === null ||
          !("type" in filterValue) ||
          filterValue.type !== defaultValue.type
        ) {
          return true;
        }
      } else {
        // string/primitive case
        if (filterValue !== defaultValue) return true;
      }
    }
    return false;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        <SearchFormWithDropdown
          form={searchForm}
          initialValues={defaultFilters}
          onSearch={handleSearch}  // ค้นหาทันทีเมื่อกรอกข้อมูล
          filters={filters}
          handleFilterChange={handleFilterChange}
          statusOptions={statusOptions}
          developerOptions={developerOptions}
          baTestOptions={baTestOptions}
          projectOptions={projectOptions}
          isProjectSearchEnabled={true}
          handleReset={handleReset}
        />
        {hasFiltersChanged() && (
          <Button onClick={handleReset} style={{ marginLeft: "10px" }}>
            <SyncOutlined /> Clear Search
          </Button>
        )}
      </div>

      <IssueTable
        showProjectName={true}
        issues={filteredData}
        loading={loading}
        onDelete={(id, _projectId, record) => setDeleteTarget({ id, issueCode: record?.issueCode })}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
      />

      <Modal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        footer={null}
        centered
        width={400}
      >
        <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
          คุณต้องการลบ Issue{' '}
          <strong>{deleteTarget?.issueCode || deleteTarget?.id}</strong>
          {' '}หรือไม่?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button type='primary' danger onClick={handleDeleteConfirm}>
            ลบ
          </Button>
          <Button onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Support;
