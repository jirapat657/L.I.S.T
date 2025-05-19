// src/pages/Setting/AddUser/index.tsx
import { useEffect, useState } from 'react';
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
  createUser,
  deleteUser,
  listenToUsers,
  updateUser,
  updateUserStatus,
  type UserData,
} from '@/api/user';

const { Option } = Select;

const AddUserPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filedUserId, setFiledUserId] = useState('');
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const pageSize = 5;

  useEffect(() => {
    const unsubscribe = listenToUsers((data) => {
      const sorted = [...data].sort(
        (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
      );
      setUsers(sorted);

      let maxId = 0;
      for (const user of data) {
        const match = user.userId?.match(/LC-(\d{6})/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxId) maxId = num;
        }
      }
      const nextId = (maxId + 1).toString().padStart(6, '0');
      setFiledUserId(`LC-${nextId}`);
    });
    return () => unsubscribe();
  }, []);

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
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditTarget(null);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editTarget) {
        await updateUser(editTarget.id, {
          userName: values.userName,
          email: values.email,
          password: values.password,
          role: values.role,
        });
        message.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      } else {
        await createUser({
          ...values,
          userId: filedUserId,
          createdAt: Timestamp.now(),
          status: 'Active',
        });
        message.success('สร้างบัญชีผู้ใช้สำเร็จ');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditTarget(null);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        message.error('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        message.error('ไม่สามารถบันทึกข้อมูลได้');
      }
    }
  };

  const handleDelete = async (record: UserData) => {
    try {
      await deleteUser(record.id);
      message.success('ลบบัญชีสำเร็จ');
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถลบได้');
    }
  };

  const handleToggleStatus = async (record: UserData) => {
    const newStatus = record.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateUserStatus(record.id, newStatus);
      message.success(`เปลี่ยนสถานะเป็น ${newStatus}`);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  const filteredData = users.filter(
    (item) =>
      item.userId.toLowerCase().includes(searchId.toLowerCase()) &&
      item.userName.toLowerCase().includes(searchName.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const columns = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'User Name', dataIndex: 'userName', key: 'userName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
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
              if (key === 'delete') {
                handleDelete(record);
              } else if (key === 'edit') {
                handleEdit(record);
              }
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
        <Button type="primary" onClick={handleOpenModal}>➕ Add User</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={() => { setSearchId(''); setSearchName(''); }}>🧹 ล้างการค้นหา</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input placeholder="Search by User ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        </Col>
        <Col span={12}>
          <Input placeholder="Search by User Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={paginatedData}
        rowKey="id"
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
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item label="User Name" name="userName" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}> <Input /> </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: !editTarget }]}> <Input.Password /> </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true }]}> <Select> <Option value="Business Analyst">Business Analyst</Option> <Option value="Tester">Tester</Option> </Select> </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={handleCancel}>❌ ยกเลิก</Button>
            <Button type="primary" htmlType="submit">💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AddUserPage;
