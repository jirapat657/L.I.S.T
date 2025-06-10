// src/pages/AddUser.tsx

import { useState, useEffect } from 'react';
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
  updateUserBySuperAdmin,
  getUserByEmail,
} from '@/api/user';
import type { UserData, UserFormValues } from '@/types/users';
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { auth } from '@/services/firebase';

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
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);

  // 1. โหลด profile user ปัจจุบันจาก Firestore หลัง login
  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser?.email) {
      getUserByEmail(firebaseUser.email).then((profile) => {
        setUserProfile(profile);
        console.log('Current user role:', profile?.role);
      });
    }
  }, []);

  // 2. เช็คสิทธิ์ admin จาก userProfile
  const isAdmin = userProfile?.role === "Admin";

  // 3. query รายชื่อ user ทั้งหมด
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
    onError: (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code: string };
        if (err.code === 'auth/email-already-in-use') {
          message.error('อีเมลนี้ถูกใช้งานแล้ว');
        } else {
          message.error('ไม่สามารถสร้างบัญชีผู้ใช้ได้');
        }
      } else {
        message.error('เกิดข้อผิดพลาดที่ไม่รู้จัก');
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
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
      setDeleteTarget(null);
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
      if (isAdmin) {
        try {
          await updateUserBySuperAdmin({
            uid: editTarget.uid || editTarget.id, // ใช้ uid (หรือ id ถ้าเท่ากัน)
            email: values.email,
            displayName: values.userName,
            firestoreData: {
              role: values.role,
              jobPosition: values.jobPosition,
              // ฟิลด์อื่น ๆ
            }
          });
          queryClient.invalidateQueries({ queryKey: ['users'] });
          message.success('อัปเดตข้อมูลผู้ใช้ (Auth+Firestore) สำเร็จ');
        } catch {
          message.error('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
        }
      } else {
        updateUserMutation.mutate({
          id: editTarget.id,
          values,
        });
      }
    } else {
      // สร้าง user ใหม่
      const maxId = Math.max(
        0,
        ...users.map((u) => parseInt(u.userId?.split('-')[1] || '0'))
      );
      const nextId = `LC-${(maxId + 1).toString().padStart(6, '0')}`;

      createUserMutation.mutate({
        ...values,
        password: values.password!,
        userId: nextId,
        status: 'Active',
      });
    }
    setIsModalOpen(false);
    form.resetFields();
    setEditTarget(null);
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
    { title: 'Job Position', dataIndex: 'jobPosition', key: 'jobPosition' },
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
      render: (_: unknown, record: UserData) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: (<><EditOutlined /> Edit</>) },
              { key: 'delete', label: (<><DeleteOutlined /> Delete</>), danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') handleEdit(record);
              if (key === 'delete') setDeleteTarget(record);
            },
          }}
        >
          <Button><MoreOutlined /></Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type='primary' onClick={handleOpenModal}>
          <PlusOutlined /> Add User
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          onClick={() => {
            setSearchId('')
            setSearchName('')
          }}
        >
          <SyncOutlined /> ล้างการค้นหา
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
            <Button onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
            <Button type='primary' htmlType='submit'>บันทึก</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        footer={null}
        centered
        width={400}
      >
        <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
          ต้องการลบบัญชีผู้ใช้ <strong>{deleteTarget?.userName}</strong> หรือไม่?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button type='primary' onClick={() => handleDelete(deleteTarget!)}>
            Yes
          </Button>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AddUserPage;
