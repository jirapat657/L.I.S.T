// src/pages/AddProject.tsx
import { useEffect, useState } from 'react';
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
  message,
  Pagination,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined } from '@ant-design/icons';
import { auth } from '@/services/firebase';
import {
  addProject,
  deleteProject,
  listenToProjects,
  updateProject,
  type ProjectData,
} from '@/api/project';

const AddProject: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [viewFileList, setViewFileList] = useState<UploadFile[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<ProjectData | null>(null);
  const [viewTarget, setViewTarget] = useState<ProjectData | null>(null);
  const [viewForm] = Form.useForm();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const unsubscribe = listenToProjects(setProjects);
    return () => unsubscribe();
  }, []);

  const getNextProjectId = (): string => {
    const sorted = [...projects].sort((a, b) => a.projectId.localeCompare(b.projectId));
    let max = 0;
    for (const p of sorted) {
      const match = p.projectId.match(/GG-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > max) max = num;
      }
    }
    const nextNum = (max + 1).toString().padStart(2, '0');
    return `GG-${nextNum}`;
  };

  const handleOpenModal = () => {
    form.setFieldsValue({ projectId: getNextProjectId() });
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setIsModalOpen(false);
  };

  const handleSubmit = async (values: any) => {
    try {
      const logoFile = fileList[0]?.originFileObj || null;
      const currentUser = auth.currentUser;
      const displayName = currentUser?.displayName || currentUser?.email || 'ไม่ทราบผู้ใช้';

      await addProject({
        projectId: values.projectId,
        projectName: values.projectName,
        logo: logoFile,
        createBy: displayName,
      });

      message.success('เพิ่มโปรเจกต์สำเร็จ');
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถเพิ่มโปรเจกต์ได้');
    }
  };

  const handleUpdate = async (values: any) => {
    if (!viewTarget) return;
    try {
      const logoFile = viewFileList[0]?.originFileObj || null;
      await updateProject(viewTarget.id, {
        projectId: values.projectId,
        projectName: values.projectName,
        logo: logoFile,
      });
      message.success('อัปเดตโปรเจกต์สำเร็จ');
      setViewTarget(null);
      viewForm.resetFields();
      setViewFileList([]);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถอัปเดตได้');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      message.success('ลบโปรเจกต์สำเร็จ');
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถลบโปรเจกต์ได้');
    }
  };

  const filteredData = projects.filter(
    (item) =>
      item.projectId.toLowerCase().includes(searchId.toLowerCase()) &&
      item.projectName.toLowerCase().includes(searchName.toLowerCase())
  );

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { title: 'Project ID', dataIndex: 'projectId', key: 'projectId' },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName' },
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      render: (logo: string) => (logo ? <img src={logo} alt="logo" style={{ width: 40 }} /> : '—'),
    },
    { title: 'Create By', dataIndex: 'createBy', key: 'createBy' },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: ProjectData) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: '🔍 View' },
              { key: 'delete', label: '🗑️ Delete', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'view') {
                setViewTarget(record);
                viewForm.setFieldsValue({
                  projectId: record.projectId,
                  projectName: record.projectName,
                });
                setViewFileList(
                  record.logo
                    ? [{ uid: '-1', name: 'logo.png', status: 'done', url: record.logo }]
                    : []
                );
              } else if (key === 'delete') {
                setDeleteTarget(record);
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

      <Modal title="เพิ่มโปรเจกต์ใหม่" open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnHidden>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item label="Project ID*" name="projectId" rules={[{ required: true, message: 'กรุณาระบุ Project ID' }]}><Input /></Form.Item>
          <Form.Item label="Project Name*" name="projectName" rules={[{ required: true, message: 'กรุณาระบุ Project Name' }]}><Input /></Form.Item>
          <Form.Item label="Upload Logo" name="logo">
            <Upload fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={handleCancel}>❌ ยกเลิก</Button>
            <Button type="primary" htmlType="submit">💾 บันทึก</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="ดู / แก้ไขโปรเจกต์" open={!!viewTarget} onCancel={() => {
        setViewTarget(null);
        viewForm.resetFields();
        setViewFileList([]);
      }} footer={null} destroyOnHidden>
        <Form layout="vertical" form={viewForm} onFinish={handleUpdate}>
          <Form.Item label="Project ID*" name="projectId" rules={[{ required: true, message: 'กรุณาระบุ Project ID' }]}><Input /></Form.Item>
          <Form.Item label="Project Name*" name="projectName" rules={[{ required: true, message: 'กรุณาระบุ Project Name' }]}><Input /></Form.Item>
          <Form.Item label="Upload Logo" name="logo">
            <Upload fileList={viewFileList} onChange={({ fileList }) => setViewFileList(fileList)} beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 12, fontStyle: 'italic', color: '#888' }}>
            Create By: {viewTarget?.createBy || 'ไม่ทราบ'}<br />
            แก้ไขล่าสุด: {viewTarget?.editedAt ? new Date(viewTarget.editedAt.seconds * 1000).toLocaleString() : '-'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => {
              setViewTarget(null);
              viewForm.resetFields();
              setViewFileList([]);
            }}>❌ ยกเลิก</Button>
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
    </div>
  );
};

export default AddProject;
