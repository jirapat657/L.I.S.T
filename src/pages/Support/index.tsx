import React, { useState } from 'react';
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
import { deleteIssue } from '@/api/issue';

type DeleteTarget = { id: string; issueCode?: string } | null;

const Support: React.FC = () => {
  const { data: issues, loading, refetch } = useIssuesWithProjectName();
  const navigate = useNavigate();
  const [searchForm] = Form.useForm();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const {
    filters,
    handleFilterChange,
    handleReset: resetFromHook,
  } = useTableSearch(defaultFilters);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  const developerOptions = getDeveloperOptions(users);
  const baTestOptions = getBATestOptions(users);

  const handleReset = () => {
    resetFromHook();
    searchForm.resetFields();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    message.loading({ content: 'กำลังลบ...', key: 'delete' });
    try {
      await deleteIssue(deleteTarget.id);
      message.success({ content: 'ลบสำเร็จ', key: 'delete' });
      await refetch();
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

  const filteredData = issues ? filterIssues(issues, filters) : [];

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        <SearchFormWithDropdown
          form={searchForm}
          initialValues={defaultFilters}
          onSearch={() => {}}
          filters={filters}
          handleFilterChange={handleFilterChange}
          statusOptions={statusOptions}
          developerOptions={developerOptions}
          baTestOptions={baTestOptions}
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
        onDelete={(id, _projectId, record) =>
          setDeleteTarget({ id, issueCode: record?.issueCode })
        }
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
