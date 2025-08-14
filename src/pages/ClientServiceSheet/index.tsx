// src/pages/ClientServiceSheet/index.tsx

import React from 'react';
import { Button, Dropdown, Menu, Table, message, Form } from 'antd';
import { PlusOutlined, MoreOutlined, SyncOutlined, PrinterOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import SearchFormWithDropdown from "@/components/SearchFormWithDropdown";
import { defaultFilters } from '@/constants/searchFilters';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClientServiceSheets, addClientServiceSheet, deleteClientServiceSheet } from '@/api/clientServiceSheet'
import type { ClientServiceSheetData } from '@/types/clientServiceSheet'

const ClientServiceSheet: React.FC = () => {
  const [searchForm] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- ดึงข้อมูล service sheet ---
  const { data: serviceSheets = [], isLoading } = useQuery({
    queryKey: ['clientServiceSheets'],
    queryFn: getClientServiceSheets,
  });

  // --- MUTATION ---
  const addMutation = useMutation({
    mutationFn: addClientServiceSheet,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientServiceSheets'])
      message.success('Duplicated!')
    },
    onError: () => {
      message.error('Duplicate failed')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClientServiceSheet,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientServiceSheets'])
      message.success('Deleted!')
    },
    onError: () => {
      message.error('Delete failed')
    }
  })

  // --- ACTION HANDLERS ---
  const handleAdd = () => {
    navigate('/add-client-service-sheet');
  };

  const handleDuplicate = (sheet: ClientServiceSheetData) => {
    // copy sheet โดยไม่ใส่ id, createdAt, updatedAt (Firestore จะ gen ใหม่)
    const { id, createdAt, updatedAt, ...sheetData } = sheet
    addMutation.mutate(sheetData)
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  };

  const handlePrint = (id: string) => {
    navigate(`/service-sheets/print/${id}`)
  }

  // --- DROPDOWN MENU ---
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
        onClick={() => handleDuplicate(record)}
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

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (val: any) =>
        typeof val === 'string'
          ? val
          : (val && val.toDate)
          ? val.toDate().toLocaleDateString()
          : '-',
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
      title: 'Service Location',
      dataIndex: 'serviceLocation',
      key: 'serviceLocation',
    },
    {
      title: 'Start Time - End Time',
      key: 'time',
      render: (_: any, record: ClientServiceSheetData) =>
        `${record.startTime} - ${record.endTime}`,
    },
    {
      title: 'More Action',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: ClientServiceSheetData) => (
        <Dropdown overlay={getMoreActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // --- SEARCH FORM (สามารถปรับได้เอง) ---
  const handleSearch = () => { /* ... */ };
  const handleReset = () => {
    searchForm.resetFields();
    // reset filter ถ้ามี
  };

  return (
    <div>
      <h2>Client Service Sheet</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>
          <PlusOutlined /> Add Service Sheet
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
            filters={{}} // ดัดแปลงตามที่ใช้งาน
            handleFilterChange={() => { }}
            statusOptions={[]}
            developerOptions={[]}
            baTestOptions={[]}
            isProjectSearchEnabled={false}
            handleReset={handleReset}
          />
        </div>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={serviceSheets}
        loading={isLoading}
        pagination={false}
      />
    </div>
  );
};

export default ClientServiceSheet;
