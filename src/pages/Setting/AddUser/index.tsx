//src/pages/Setting/AddUser/index.tsx
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseApp } from '@/services/firebase';
import { auth } from '@/services/firebase';
import type { UserData, UserFormValues } from '@/types/users';
import { useAuth } from '@/hooks/useAuth';

const { Option } = Select;

const AddUserPage = () => {
  console.log('AddUserPage render');
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const pageSize = 5;
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);

  const { currentUser } = useAuth();
    console.log('currentUser (AddUserPage):', currentUser);



  // 3. query รายชื่อ user ทั้งหมด
  const { data: users = [] } = useQuery<UserData[]>({
  queryKey: ['users'],
  queryFn: async () => {
    console.log("queryFn START"); // 1
    console.log("currentUser (useQuery):", currentUser); // 2
    if (!currentUser) {
      console.log("NO USER YET");
      throw new Error("User is not authenticated");
    }
    console.log('before call getUsers'); // 3
    console.log("auth.currentUser", auth.currentUser);
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(token => console.log("Token:", token));
    }
    const functions = getFunctions(FirebaseApp);
    const getUsers = httpsCallable(functions, 'getUsers');
    const result = await getUsers();

    console.log('after call getUsers', result); // 4
    const usersData: UserData[] = Array.isArray(result.data) ? result.data : [];
    return usersData;
  },
  enabled: !!currentUser, // ให้ query ทำงานหลัง currentUser พร้อม
});


  // MUTATION สำหรับสร้าง user
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      // ดูค่าที่จะถูกส่งไปหลังบ้าน
      console.log('sending:', values);
      const functions = getFunctions(FirebaseApp);
      const createUser = httpsCallable(functions, 'createUser');
      // ส่ง values ตรง ๆ
      return await createUser(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('สร้างบัญชีผู้ใช้สำเร็จ');
    },
    onError: (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code: string };
        message.error(err.code === 'auth/email-already-in-use' ? 'อีเมลนี้ถูกใช้งานแล้ว' : 'ไม่สามารถสร้างบัญชีผู้ใช้ได้');
      } else {
        message.error('เกิดข้อผิดพลาดที่ไม่รู้จัก');
      }
    },
  });
  



  // 6. ฟังก์ชันการลบผู้ใช้
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const functions = getFunctions(FirebaseApp);
      const deleteUser = httpsCallable(functions, 'deleteUser');
      return await deleteUser({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('ลบบัญชีสำเร็จ');
      setDeleteTarget(null);
    },
    onError: () => message.error('ไม่สามารถลบได้'),
  });

  // 7. ฟังก์ชันการเปลี่ยนสถานะผู้ใช้
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) => {
      const functions = getFunctions(FirebaseApp);
      const updateUserStatus = httpsCallable(functions, 'updateUserStatus');
      return await updateUserStatus({ id, status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: () => message.error('ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้'),
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
    // ถ้าเป็นเพิ่มผู้ใช้ใหม่
    if (!editTarget) {
      // หา next userId อัตโนมัติ
      const maxId = Math.max(0, ...users.map((u) => parseInt(u.userId?.split('-')[1] || '0')));
      const nextId = `LC-${(maxId + 1).toString().padStart(6, '0')}`;

      // ส่งข้อมูล object ธรรมดา ไม่ต้องมี data หุ้ม
      createUserMutation.mutate({
        ...values,       // email, password, userName, role, jobPosition ฯลฯ
        userId: nextId,
        status: 'Active',
      });
    } else {
      // ถ้าเป็นแก้ไขผู้ใช้ (ส่วนนี้ถ้าไม่ใช้ก็ลบทิ้งได้)
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          message.error("ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ปัจจุบันได้");
          return;
        }
        const userUpdateData = {
          id: editTarget.uid || editTarget.id,
          newPassword: values.newPassword,
          userData: {
            userName: values.userName,
            role: values.role,
            jobPosition: values.jobPosition,
          },
          idToken: idToken,
        };
        const functions = getFunctions(FirebaseApp);
        if (values.newPassword) {
          const updateUserPasswordByAdmin = httpsCallable(functions, 'updateUserPasswordByAdmin');
          await updateUserPasswordByAdmin(userUpdateData);
          message.success("อัปเดตรหัสผ่านและข้อมูล Firestore สำเร็จ");
        } else {
          const updateUser = httpsCallable(functions, 'updateUser');
          await updateUser({
            id: editTarget.id,
            values: {
              userName: values.userName,
              role: values.role,
              jobPosition: values.jobPosition,
            }
          });
          message.success("อัปเดตข้อมูล Firestore สำเร็จ");
        }
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (err) {
        console.error("Error updating user:", err);
        message.error("ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้");
      }
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
  console.log('userssss:', users);
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
          <Form.Item label='Role' name='role' rules={[{ required: true }]}><Select> 
            <Option value='Admin'>Admin</Option> 
            <Option value='Staff'>Staff</Option> 
          </Select></Form.Item>
          <Form.Item label='Job Position' name='jobPosition' rules={[{ required: true }]}><Select> 
            <Option value='Developer'>Developer</Option> 
            <Option value='Business Analyst'>Business Analyst</Option> 
            <Option value='Project Coordinator'>Project Coordinator</Option> 
            <Option value='Project Manager'>Project Manager</Option> 
            <Option value='Project Owner'>Project Owner</Option> 
            <Option value='UX/UI Designer'>UX/UI Designer</Option> 
            <Option value='Tester'>Tester</Option> 
          </Select></Form.Item>
          <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          {!editTarget && (
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editTarget && (
            <Form.Item label="New Password" name="newPassword">
              <Input.Password placeholder="Leave blank to keep old password" />
            </Form.Item>
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
