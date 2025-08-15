// src/pages/ClientServiceSheet/index.tsx

import React from 'react';
import { Button, Dropdown, Menu, Table, message, Form } from 'antd';
import { PlusOutlined, MoreOutlined, PrinterOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { ClientServiceSheetData } from '@/types/clientServiceSheet';
import { getClientServiceSheets, deleteClientServiceSheet } from '@/api/clientServiceSheet';
import SearchFormWithDropdown from "@/components/SearchFormWithDropdown"; // Optional: if you use search
import { defaultFilters } from '@/constants/searchFilters'; // Optional: if you use search

const ClientServiceSheet: React.FC = () => {
  const [searchForm] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Fetch Data ---
  const { data: serviceSheets = [], isLoading } = useQuery({
    queryKey: ['clientServiceSheets'],
    queryFn: getClientServiceSheets,
  });

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: deleteClientServiceSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientServiceSheets'] });
      message.success('Deleted successfully!');
    },
    onError: (error) => {
      message.error(`Delete failed: ${error.message}`);
    }
  });

  // --- Action Handlers ---
  const handleAdd = () => {
    navigate('/client-service-sheets/add');
  };

  /**
   * This is the key function. It navigates to the dedicated duplicate page,
   * passing the ID of the sheet to be copied in the URL.
   */
  const handleDuplicate = (id: string) => {
    navigate(`/client-service-sheets/duplicate/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handlePrint = (id: string) => {
    navigate(`/service-sheets/print/${id}`);
  };

  // --- Dropdown Menu for each row ---
  const getMoreActionMenu = (record: ClientServiceSheetData) => (
    <Menu>
      <Menu.Item
        key="print"
        icon={<PrinterOutlined />}
        onClick={() => handlePrint(record.id)}
      >
        Print
      </Menu.Item>
      <Menu.Item
        key="duplicate"
        icon={<CopyOutlined />}
        onClick={() => handleDuplicate(record.id)} // This is the trigger
      >
        Duplicate
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={() => handleDelete(record.id)}
        danger
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  // --- Table Columns ---
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (val: any) => val?.toDate ? val.toDate().toLocaleDateString('th-TH') : '-',
    },
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'Job Code',
      dataIndex: 'jobCode',
      key: 'jobCode',
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: ClientServiceSheetData) => (
        <Dropdown overlay={getMoreActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Client Service Sheet</h2>
        <Button type="primary" onClick={handleAdd}>
          <PlusOutlined /> Add Service Sheet
        </Button>
      </div>
      
      {/* Optional Search Bar */}
      {/* <SearchFormWithDropdown
        form={searchForm}
        // ... other props
      />
      */}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={serviceSheets}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ClientServiceSheet;