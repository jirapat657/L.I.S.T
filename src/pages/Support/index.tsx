// src/pages/Support/index.tsx
import React, { useState, useEffect } from 'react';
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
import { useIssuesWithProjectName } from '@/hooks/useIssuesWithProjectName';
import { deleteIssue, getIssuesByProjectName } from '@/api/issue';
import { getProjects } from '@/api/project';
import type { FilterValues } from '@/types/filter';
import type { IssueData } from '@/types/issue';
import type { OptionType } from '@/types/filter';

const Support: React.FC = () => {
  // State สำหรับเก็บข้อมูลทั้งหมดของ issue และข้อมูลที่ฟิลเตอร์แล้ว
  const { data: issues = [], loading, refetch } = useIssuesWithProjectName();  // ดึงข้อมูล issues ทั้งหมดที่มี projectName
  const [filteredData, setFilteredData] = useState<IssueData[]>([]);  // เก็บข้อมูลที่กรองแล้ว
  const [projectOptions, setProjectOptions] = useState<OptionType[]>([]);  // ตัวเลือกโปรเจกต์
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

  // ดึงข้อมูลโปรเจกต์เพื่อใช้ใน dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // Initialize project options and filtered data
  useEffect(() => {
    if (projects.length > 0) {
      setProjectOptions(
        projects.map((project) => ({
          label: project.projectName,
          value: project.projectName,
        }))
      );
    }
    setFilteredData(issues as IssueData[]);  // ตั้งค่าเริ่มต้นให้แสดงข้อมูลทั้งหมด
  }, [projects, issues]);

  const developerOptions = getDeveloperOptions(users);
  const baTestOptions = getBATestOptions(users);

  const handleReset = () => {
    resetFromHook();
    searchForm.resetFields();
    setFilteredData(issues as IssueData[]);  // รีเซ็ตให้แสดงข้อมูลทั้งหมด
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    message.loading({ content: 'กำลังลบ...', key: 'delete' });
    try {
      await deleteIssue(deleteTarget.id);
      message.success({ content: 'ลบสำเร็จ', key: 'delete' });
      await refetch();
      setFilteredData(filteredData.filter(issue => issue.id !== deleteTarget.id));  // รีเฟรชข้อมูลหลังลบ
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
      let searchResults: IssueData[] = [];

      // ขั้นตอนที่ 1: ดึงข้อมูลจาก Firebase ถ้ามีการเลือก projectName
      if (filters.projectName) {
        searchResults = await getIssuesByProjectName(filters.projectName);
      } else {
        searchResults = issues;  // ถ้าไม่มีการเลือก projectName ให้ใช้ข้อมูลทั้งหมด
      }

      // ขั้นตอนที่ 2: ฟิลเตอร์ข้อมูลตามเงื่อนไขอื่นๆ เช่น status, developer, baTest
      const filtered = filterIssues(searchResults, filters);
      setFilteredData(filtered as IssueData[]);  // อัปเดตข้อมูลที่กรองแล้ว

    } catch (error) {
      console.error('Search error:', error);
      message.error('เกิดข้อผิดพลาดในการค้นหา');
    }
  };

  // เช็คว่ามีการเปลี่ยนแปลงเงื่อนไขการค้นหาหรือไม่
  const hasFiltersChanged = () => {
    return (
      filters.keyword !== defaultFilters.keyword ||
      filters.status !== defaultFilters.status ||
      filters.developer !== defaultFilters.developer ||
      filters.baTest !== defaultFilters.baTest ||
      filters.projectName !== defaultFilters.projectName ||
      filters.issueDateFilter.type !== defaultFilters.issueDateFilter.type ||
      filters.startDateFilter.type !== defaultFilters.startDateFilter.type ||
      filters.dueDateFilter.type !== defaultFilters.dueDateFilter.type ||
      filters.completeDateFilter.type !== defaultFilters.completeDateFilter.type
    );
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
          handleReset={handleReset}  // ส่งฟังก์ชัน handleReset ไปที่ SearchFormWithDropdown
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
