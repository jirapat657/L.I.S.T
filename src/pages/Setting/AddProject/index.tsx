// ✅ src/pages/AddProject.tsx
import { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Row,
  Col,
  Table,
  Dropdown,
  Menu,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';

interface Project {
  key: string;
  projectId: string;
  projectName: string;
  logo: string;
  createBy: string;
}

const initialProjects: Project[] = [
  {
    key: '1',
    projectId: 'PRJ-001',
    projectName: 'ระบบจัดการสินค้า',
    logo: '',
    createBy: 'คุณต้น',
  },
  {
    key: '2',
    projectId: 'PRJ-002',
    projectName: 'ระบบจองห้องประชุม',
    logo: '',
    createBy: 'คุณฝ้าย',
  },
];

const AddProject: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [viewTarget, setViewTarget] = useState<Project | null>(null);
  const [viewForm] = Form.useForm();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setProjects(prev => prev.filter(item => item.key !== deleteTarget.key));
      message.success('ลบโปรเจกต์เรียบร้อยแล้ว');
      setDeleteTarget(null);
    }
  };

  const handleSubmit = (values: any) => {
    const newProject: Project = {
      key: Date.now().toString(),
      projectId: values.projectId,
      projectName: values.projectName,
      logo: values.logo?.file?.name || '',
      createBy: 'คุณระบบ',
    };
    setProjects(prev => [...prev, newProject]);
    message.success('เพิ่มโปรเจกต์สำเร็จ');
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleUpdate = (values: any) => {
    if (viewTarget) {
      setProjects(prev =>
        prev.map(item =>
          item.key === viewTarget.key ? { ...item, ...values } : item
        )
      );
      message.success('บันทึกการแก้ไขโปรเจกต์แล้ว');
      setViewTarget(null);
      viewForm.resetFields();
    }
  };

  const columns = [
    { title: 'Project ID', dataIndex: 'projectId', key: 'projectId' },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName' },
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      render: (logo: string) => logo ? <img src={logo} alt="logo" style={{ width: 40 }} /> : '—',
    },
    { title: 'Create By', dataIndex: 'createBy', key: 'createBy' },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: Project) => (
        <Dropdown
          overlay={
            <Menu
              onClick={({ key }) => {
                if (key === 'view') {
                  setViewTarget(record);
                  viewForm.setFieldsValue(record);
                } else if (key === 'delete') {
                  setDeleteTarget(record);
                }
              }}
              items={[
                { key: 'view', label: '🔍 View' },
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

  const filteredData = projects.filter(
    (item) =>
      item.projectId.toLowerCase().includes(searchId.toLowerCase()) &&
      item.projectName.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" onClick={handleOpenModal}>➕ Add Project</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={() => { setSearchId(''); setSearchName(''); }}>🧹 ล้างการค้นหา</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input placeholder="Search by Project ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        </Col>
        <Col span={12}>
          <Input placeholder="Search by Project Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </Col>
      </Row>

      <Table columns={columns} dataSource={filteredData} pagination={false} scroll={{ x: 'max-content' }} />

      <Modal title="เพิ่มโปรเจกต์ใหม่" open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item label="Project ID*" name="projectId" rules={[{ required: true, message: 'กรุณาระบุ Project ID' }]}> <Input /> </Form.Item>
          <Form.Item label="Project Name*" name="projectName" rules={[{ required: true, message: 'กรุณาระบุ Project Name' }]}> <Input /> </Form.Item>
          <Form.Item label="Upload Logo" name="logo">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={handleCancel}>❌ ยกเลิก</Button>
            <Button type="primary" htmlType="submit">💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>

      <Modal open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} footer={null} centered>
        <p style={{ fontSize: 16, fontWeight: 'bold' }}>
          ต้องการลบโปรเจกต์ <strong>{deleteTarget?.projectId}</strong> หรือไม่?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button danger onClick={handleDelete}>✅ Yes</Button>
          <Button onClick={() => setDeleteTarget(null)}>❌ Cancel</Button>
        </div>
      </Modal>

      <Modal title="ดู / แก้ไขโปรเจกต์" open={!!viewTarget} onCancel={() => { setViewTarget(null); viewForm.resetFields(); }} footer={null} destroyOnClose>
        <Form layout="vertical" form={viewForm} onFinish={handleUpdate}>
          <Form.Item label="Project ID*" name="projectId" rules={[{ required: true, message: 'กรุณาระบุ Project ID' }]}> <Input /> </Form.Item>
          <Form.Item label="Project Name*" name="projectName" rules={[{ required: true, message: 'กรุณาระบุ Project Name' }]}> <Input /> </Form.Item>
          <Form.Item label="Upload Logo" name="logo">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 12, fontStyle: 'italic', color: '#888' }}>
            Create By: {viewTarget?.createBy || 'ไม่ทราบ'} <br />
            เวลา: {new Date().toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => { setViewTarget(null); viewForm.resetFields(); }}>❌ ยกเลิก</Button>
            <Button type="primary" htmlType="submit">💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AddProject;
