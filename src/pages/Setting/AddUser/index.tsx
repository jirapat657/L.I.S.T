// src/pages/AddUser.tsx
import { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Dropdown,
  message,
  Tag,
  Pagination,
  Row,
  Col,
} from 'antd';
import { Timestamp } from 'firebase/firestore';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserStatus,
} from '@/api/user';
import type { UserData, UserFormValues } from '@/types/users';

const { Option } = Select;

const AddUserPage = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const pageSize = 5;
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<UserData[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('สร้างบัญชีผู้ใช้สำเร็จ');
    },
    onError: (error: any) => {
      if (error.code === 'auth/email-already-in-use') {
        message.error('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        message.error('ไม่สามารถสร้างบัญชีผู้ใช้ได้');
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      updateUser(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
    },
    onError: () => message.error('ไม่สามารถอัปเดตข้อมูลได้'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('ลบบัญชีสำเร็จ');
    },
    onError: () => message.error('ไม่สามารถลบได้'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
      updateUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleOpenModal = () => {
    form.resetFields();
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: UserData) => {
    setEditTarget(record);
    form.setFieldsValue({
      userName: record.userName,
      email: record.email,
      role: record.role,
      jobPosition: record.jobPosition,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editTarget) {
      updateUserMutation.mutate({
        id: editTarget.id,
        values,
      });
    } else {
      const maxId = Math.max(
        0,
        ...users.map((u) => parseInt(u.userId?.split('-')[1] || '0'))
      );
      const nextId = `LC-${(maxId + 1).toString().padStart(6, '0')}`;

      createUserMutation.mutate({
        ...values,
        userId: nextId,
        createdAt: Timestamp.now(),
        status: 'Active',
      });
    }
    setIsModalOpen(false);
    form.resetFields();
    setEditTarget(null);
    console.log("saddasdas", values)
  };

  const handleToggleStatus = (record: UserData) => {
    const newStatus = record.status === 'Active' ? 'Inactive' : 'Active';
    toggleStatusMutation.mutate({ id: record.id, status: newStatus });
  };

  const handleDelete = (record: UserData) => {
    deleteUserMutation.mutate(record.id);
  };

  const filteredData = users
    .filter(
      (item) =>
        item.userId?.toLowerCase().includes(searchId.toLowerCase()) &&
        item.userName?.toLowerCase().includes(searchName.toLowerCase())
    )
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'User Name', dataIndex: 'userName', key: 'userName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Job Position', dataIndex: 'jobPosition', key: 'jobPostion' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_: string, record: UserData) => (
        <Tag
          color={record.status === 'Active' ? 'green' : 'red'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleToggleStatus(record)}
        >
          {record.status}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: UserData) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: '📝 Edit' },
              { key: 'delete', label: '🗑️ Delete', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') handleEdit(record);
              if (key === 'delete') handleDelete(record);
            },
          }}
        >
          <Button>⋯</Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type='primary' onClick={handleOpenModal}>
          ➕ Add User
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input
            placeholder='Search by User ID'
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </Col>
        <Col span={12}>
          <Input
            placeholder='Search by User Name'
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={paginatedData}
        rowKey='id'
        pagination={false}
        scroll={{ x: 'max-content' }}
        footer={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>ทั้งหมด {filteredData.length} รายการ</div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total) => `หน้า ${currentPage} / ${Math.ceil(total / pageSize)}`}
            />
          </div>
        )}
      />

      <Modal
        title={editTarget ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout='vertical' form={form} onFinish={handleSubmit}>
          <Form.Item label='User Name' name='userName' rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label='Role' name='role' rules={[{ required: true }]}><Select> <Option value='Admin'>Admin</Option> <Option value='Staff'>Staff</Option> </Select></Form.Item>
          <Form.Item label='Job Position' name='jobPosition' rules={[{ required: true }]}><Select> <Option value='Developer'>Developer</Option> <Option value='Business Analyst'>Business Analyst</Option> <Option value='Project Coordinator'>Project Coordinator</Option> <Option value='Project Manager'>Project Manager</Option> <Option value='Project Owner'>Project Owner</Option> <Option value='UX/UI Designer'>UX/UI Designer</Option> <Option value='Tester'>Tester</Option> </Select></Form.Item>
          <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          {!editTarget && (
            <Form.Item label='Password' name='password' rules={[{ required: true }]}><Input.Password /></Form.Item>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>❌ ยกเลิก</Button>
            <Button type='primary' htmlType='submit'>💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AddUserPage;

