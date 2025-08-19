//src/pages/ProjectChangeRequest/index.tsx
import React, { useState, useMemo } from 'react';
import { Button, Dropdown, Table, message, Input, Flex } from 'antd';
import { PlusOutlined, MoreOutlined, PrinterOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// [แก้ไข] นำเข้า Type และ API functions จริง
import type { ProjectChangeRequest_Firestore } from '@/types/projectChangeRequest';
import { getProjectChangeRequests, deleteProjectChangeRequest } from '@/api/projectChangeRequest';

const ProjectChangeRequest: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchProjectName, setSearchProjectName] = useState('');

  // --- Fetch Data ---
  const { data: changeRequests = [], isLoading } = useQuery({
    queryKey: ['projectChangeRequests'],
    queryFn: getProjectChangeRequests,
  });

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    if (!searchProjectName) {
      return changeRequests;
    }
    return changeRequests.filter(item =>
      item.projectName?.toLowerCase().includes(searchProjectName.toLowerCase())
    );
  }, [searchProjectName, changeRequests]);

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: deleteProjectChangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectChangeRequests'] });
      message.success('Deleted successfully!');
    },
    onError: (error: Error) => {
      message.error(`Delete failed: ${error.message}`);
    }
  });

  // --- Action Handlers ---
  const handleAdd = () => {
    navigate('/project-change-requests/add');
  };

  const handlePrint = (id: string) => {
    navigate(`/project-change-requests/print/${id}`);
  };

  const handleDuplicate = (id: string) => {
    navigate(`/project-change-requests/duplicate/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: { toDate?: () => Date }) =>
        date?.toDate ? date.toDate().toLocaleDateString('th-TH') : '-',
    },
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'Project Stage',
      dataIndex: 'projectStage',
      key: 'projectStage',
    },
    {
      title: 'Job Code',
      dataIndex: 'jobCode',
      key: 'jobCode',
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: ProjectChangeRequest_Firestore) => {
        const menuItems = [
          {
            key: 'print',
            icon: <PrinterOutlined />,
            label: 'Print',
            onClick: () => handlePrint(record.id),
          },
          {
            key: 'duplicate',
            icon: <CopyOutlined />,
            label: 'Duplicate',
            onClick: () => handleDuplicate(record.id),
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            onClick: () => handleDelete(record.id),
            danger: true,
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" gap="middle" style={{ marginBottom: 24 }}>
        <h2>Project Change Request</h2>
        <Input
          placeholder='Search by Project Name'
          value={searchProjectName}
          onChange={(e) => setSearchProjectName(e.target.value)}
          style={{ maxWidth: 300 }}
          allowClear
        />
        <Button type="primary" onClick={handleAdd}>
          <PlusOutlined /> Add Change Request
        </Button>
      </Flex>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ProjectChangeRequest;