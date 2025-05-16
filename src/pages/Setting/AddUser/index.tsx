// ✅ src/pages/setting/AddUser/index.tsx
import { useState } from 'react';
import {
  Button,
  Input,
  Row,
  Col,
  Table,
  Dropdown,
  Menu,
  Modal,
  Form,
  Select,
} from 'antd';
import { useNavigate } from 'react-router-dom';

interface User {
  key: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  status: string;
}

const initialUsers: User[] = [
  {
    key: '1',
    userId: 'U001',
    userName: 'คุณสมชาย',
    email: 'somchai@example.com',
    role: 'Admin',
    status: 'Active',
  },
  {
    key: '2',
    userId: 'U002',
    userName: 'คุณปิ่น',
    email: 'pin@example.com',
    role: 'User',
    status: 'Inactive',
  },
];

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (key: string) => {
    setUsers(prev => prev.filter(item => item.key !== key));
    setDeleteTarget(null);
  };

  const columns = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'User Name', dataIndex: 'userName', key: 'userName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Dropdown
          overlay={
            <Menu
              onClick={({ key }) => {
                if (key === 'edit') {
                  setEditTarget(record);
                  editForm.setFieldsValue(record);
                } else if (key === 'delete') {
                  setDeleteTarget(record);
                }
              }}
              items={[
                { key: 'edit', label: '✏️ Edit' },
                { key: 'delete', label: '🗑️ Delete', danger: true },
              ]}
            />
          }
        >
          <Button>⋯</Button>
        </Dropdown>
      ),
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.userId.toLowerCase().includes(searchId.toLowerCase()) &&
      user.userName.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          ➕ Add User
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={() => { setSearchId(''); setSearchName(''); }}>
          🧹 ล้างการค้นหา
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input placeholder="Search by User ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        </Col>
        <Col span={12}>
          <Input placeholder="Search by User Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </Col>
      </Row>

      <Table columns={columns} dataSource={filteredUsers} pagination={false} scroll={{ x: 'max-content' }} />

      <Modal
        title="เพิ่มผู้ใช้งานใหม่"
        open={isModalOpen}
        onCancel={() => {
          form.resetFields();
          setIsModalOpen(false);
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={(values) => {
          const newUser: User = {
            key: Date.now().toString(),
            userId: `U${users.length + 1}`.padStart(4, '0'),
            userName: values.username,
            email: values.email,
            role: values.role,
            status: 'Active',
          };
          setUsers(prev => [...prev, newUser]);
          setIsModalOpen(false);
          form.resetFields();
        }}>
          <Form.Item label="Username*" name="username" rules={[{ required: true, message: 'กรุณากรอก Username' }]}> <Input /> </Form.Item>
          <Form.Item label="Role*" name="role" rules={[{ required: true, message: 'กรุณาเลือก Role' }]}> <Select placeholder="เลือก Role"> <Select.Option value="Admin">Admin</Select.Option> <Select.Option value="User">User</Select.Option> </Select> </Form.Item>
          <Form.Item label="Email*" name="email" rules={[{ required: true, message: 'กรุณากรอก Email' }, { type: 'email', message: 'รูปแบบ Email ไม่ถูกต้อง' }]}> <Input /> </Form.Item>
          <Form.Item label="Password*" name="password" rules={[{ required: true, message: 'กรุณากรอก Password' }]}> <Input.Password /> </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={() => { form.resetFields(); setIsModalOpen(false); }}>❌ ยกเลิก</Button>
            <Button type="primary" htmlType="submit">💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="แก้ไขข้อมูลผู้ใช้งาน"
        open={!!editTarget}
        onCancel={() => { setEditTarget(null); editForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={editForm} onFinish={(values) => {
          setUsers(prev => prev.map(user => (
            user.key === editTarget?.key ? { ...user, ...values, userName: values.userName } : user
          )));
          setEditTarget(null);
          editForm.resetFields();
        }}>
          <Form.Item label="Username*" name="userName" rules={[{ required: true, message: 'กรุณากรอก Username' }]}> <Input /> </Form.Item>
          <Form.Item label="Role*" name="role" rules={[{ required: true, message: 'กรุณาเลือก Role' }]}> <Select placeholder="เลือก Role"> <Select.Option value="Admin">Admin</Select.Option> <Select.Option value="User">User</Select.Option> </Select> </Form.Item>
          <Form.Item label="Email*" name="email" rules={[{ required: true, message: 'กรุณากรอก Email' }, { type: 'email', message: 'Email ไม่ถูกต้อง' }]}> <Input /> </Form.Item>
          <Form.Item label="Password*" name="password" rules={[{ required: true, message: 'กรุณากรอก Password' }]}> <Input.Password /> </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={() => { setEditTarget(null); editForm.resetFields(); }}>❌ ยกเลิก</Button>
            <Button type="primary" htmlType="submit">💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AddUser;