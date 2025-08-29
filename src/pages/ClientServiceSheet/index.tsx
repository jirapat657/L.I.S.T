// src/pages/ClientServiceSheet/index.tsx

import React from 'react';
import { Button, Dropdown, Menu, Table, message, Row, Col, Input } from 'antd';
import { PlusOutlined, MoreOutlined, PrinterOutlined, CopyOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { ClientServiceSheet_Firestore } from '@/types/clientServiceSheet';
import { getClientServiceSheets, deleteClientServiceSheet } from '@/api/clientServiceSheet';

const ClientServiceSheet: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchProjectsName, setSearchProjectsName] = React.useState('');
  const [filteredData, setFilteredData] = React.useState<ClientServiceSheet_Firestore[]>([]);

  

  // --- Fetch Data ---
  const { data: serviceSheets = [], isLoading } = useQuery({
    queryKey: ['clientServiceSheets'],
    queryFn: getClientServiceSheets,
  });

  React.useEffect(() => {
    if (searchProjectsName) {
      const filtered = serviceSheets.filter(item =>
        item.projectName?.toLowerCase().includes(searchProjectsName.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(serviceSheets);
    }
  }, [searchProjectsName, serviceSheets]);

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
  const handlePrint = (id: string | undefined) => {
    if (!id) {
      message.error('Invalid service sheet ID');
      return;
    }
    navigate(`/service-sheets/print/${id}`);
  };

  const handleDuplicate = (id: string | undefined) => {
    if (!id) {
      message.error('Invalid service sheet ID');
      return;
    }
    navigate(`/client-service-sheets/duplicate/${id}`);
  };

  const handleDelete = (id: string | undefined) => {
    if (!id) {
      message.error('Invalid service sheet ID');
      return;
    }
    deleteMutation.mutate(id);
  };

  // --- Dropdown Menu for each row ---
  const getMoreActionMenu = (record: ClientServiceSheet_Firestore) => (
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
        onClick={() => handleDuplicate(record.id)}
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
      render: (val: Date | { toDate: () => Date } | undefined) =>
        val && typeof (val as { toDate?: () => Date }).toDate === 'function'
          ? (val as { toDate: () => Date }).toDate().toLocaleDateString('th-TH')
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
      title: '',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: ClientServiceSheet_Firestore) => (
        <Dropdown overlay={getMoreActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        
        <Button type="primary" onClick={handleAdd}>
          <PlusOutlined /> Add Service Sheet
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          onClick={() => {
            
            setSearchProjectsName('')
          }}
        >
          <SyncOutlined /> Clear Search
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        
        <Col span={12}>
          <Input
            placeholder='Search by Project Name'
            value={searchProjectsName}
            onChange={(e) => setSearchProjectsName(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={searchProjectsName ? filteredData : serviceSheets} // ใช้ filteredData เมื่อมีการค้นหา
        loading={isLoading}
        pagination={{
          pageSize :10,
          showTotal: (total) => <div style={{ position: 'absolute', left: '16px' }}>ทั้งหมด {total} รายการ</div>,
        }}
      />
    </div>
  );
};

export default ClientServiceSheet;