// src/pages/AddProject.tsx
import { useState } from 'react'
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
} from 'antd'
import { DeleteOutlined, EyeOutlined, MoreOutlined, PlusOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'
import { auth} from '@/services/firebase'
import {
  addProject,
  deleteProject,
  updateProject,
  getProjects,
  checkProjectIdExists,
} from '@/api/project'
import type { ProjectData, ProjectFormValues } from '@/types/project'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const AddProject: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [viewForm] = Form.useForm()
  const [searchId, setSearchId] = useState('')
  const [searchName, setSearchName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProjectData | null>(null)
  const [viewTarget, setViewTarget] = useState<ProjectData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const queryClient = useQueryClient()

  const { data: projectsData = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 1000 * 60 * 5,
  })

  const addProjectMutation = useMutation({
    mutationFn: addProject, // ✅ ใช้ฟังก์ชันที่คุณเขียนไว้ด้านบน
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('เพิ่มโปรเจกต์สำเร็จ');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error('ไม่สามารถเพิ่มโปรเจกต์ได้');
    },
  });


  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      message.success('ลบโปรเจกต์สำเร็จ')
      setDeleteTarget(null)
    },
    onError: () => {
      message.error('ไม่สามารถลบโปรเจกต์ได้')
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) => updateProject(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      message.success('อัปเดตโปรเจกต์สำเร็จ')
      setViewTarget(null)
      viewForm.resetFields()
      
    },
    onError: () => {
      message.error('ไม่สามารถอัปเดตโปรเจกต์ได้')
    },
  })

  

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    form.resetFields()
    
    setIsModalOpen(false)
  }

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      // เช็คว่า projectId ซ้ำหรือไม่
      const exists = await checkProjectIdExists(values.projectId);
      if (exists) {
        message.error('Project ID นี้ถูกใช้ไปแล้ว กรุณาใช้ ID อื่น');
        return;
      }

      const currentUser = auth.currentUser;
      const displayName = currentUser?.displayName || currentUser?.email || 'ไม่ทราบผู้ใช้';

      const formWithCreator = {
        ...values,
        createBy: displayName,
      };

      addProjectMutation.mutate(formWithCreator);
    } catch (error) {
      console.error('Error checking project ID:', error);
      message.error('เกิดข้อผิดพลาดในการตรวจสอบ Project ID');
    }
  };

  const handleUpdate = (values: ProjectFormValues) => {
    if (!viewTarget) return
    // const logoFile = viewFileList[0]?.originFileObj || null
    const logoFile = values.logo?.file || null
    updateProjectMutation.mutate({
      id: viewTarget.id,
      values: {
        projectId: values.projectId,
        projectName: values.projectName,
        logo: logoFile ? { file: logoFile } : undefined, 
      },
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteProjectMutation.mutate(deleteTarget.id)
  }

  const filteredData = projectsData.filter(
    (item) =>
      item.projectId.toLowerCase().includes(searchId.toLowerCase()) &&
      item.projectName.toLowerCase().includes(searchName.toLowerCase())
  )

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const columns = [
    { title: 'Project ID', dataIndex: 'projectId', key: 'projectId' },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName' },
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      render: (logo: string) => (logo ? <img src={logo} alt='logo' style={{ width: 40 }} /> : '—'),
    },
    { title: 'Create By', dataIndex: 'createBy', key: 'createBy' },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: ProjectData) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: (<><EyeOutlined /> View</>) },
              { key: 'delete', label: (<><DeleteOutlined /> Delete</>), danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'view') {
                setViewTarget(record)
                viewForm.setFieldsValue({
                  projectId: record.projectId,
                  projectName: record.projectName,
                  logo: {
                    file: record.logo, // หรือใช้ originFileObj ถ้ามี
                    name: 'logo.png',
                    url: record.logo,
                    uid: '-1',
                    status: 'done',
                  },
                })
              } else if (key === 'delete') {
                setDeleteTarget(record)
              }
            },
          }}
        >
          <Button><MoreOutlined /></Button>
        </Dropdown>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type='primary' onClick={handleOpenModal}>
          <PlusOutlined /> Add Project
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
            placeholder='Search by Project ID'
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </Col>
        <Col span={12}>
          <Input
            placeholder='Search by Project Name'
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
        title='เพิ่มโปรเจกต์ใหม่'
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <Form layout='vertical' form={form} onFinish={handleSubmit}>
          <Form.Item
            label='Project ID'
            name='projectId'
            rules={[
              { required: true, message: 'กรุณาระบุ Project ID' },
              {
                validator: async (_, value) => {
                  if (!value) return Promise.resolve();
                  const exists = await checkProjectIdExists(value); // 🔍 เรียกฟังก์ชันเช็ค
                  if (exists) {
                    return Promise.reject(new Error('Project ID นี้มีอยู่แล้ว กรุณาใช้ค่าอื่น'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Project Name*'
            name='projectName'
            rules={[{ required: true, message: 'กรุณาระบุ Project Name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label='Upload Logo' name='logo'>
            <Upload
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={handleCancel}>ยกเลิก</Button>
            <Button type='primary' htmlType='submit'>
              บันทึก
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title='ดู / แก้ไขโปรเจกต์'
        open={!!viewTarget}
        onCancel={() => {
          setViewTarget(null)
          viewForm.resetFields()

        }}
        footer={null}
        destroyOnHidden
      >
        <Form layout='vertical' form={viewForm} onFinish={handleUpdate}>
          <Form.Item
            label='Project ID*'
            name='projectId'
            rules={[{ required: true, message: 'กรุณาระบุ Project ID' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Project Name*'
            name='projectName'
            rules={[{ required: true, message: 'กรุณาระบุ Project Name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label='Upload Logo' name='logo'>
            <Upload
              
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 12, fontStyle: 'italic', color: '#888' }}>
            Create By: {viewTarget?.createBy || 'ไม่ทราบ'}
            <br />
            แก้ไขล่าสุด:{' '}
            {viewTarget?.updatedAt
              ? new Date(viewTarget.updatedAt.seconds * 1000).toLocaleString()
              : '-'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                setViewTarget(null)
                viewForm.resetFields()
              }}
            >
              ยกเลิก
            </Button>
            <Button type='primary' htmlType='submit'>
              บันทึก
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        footer={null}
        centered
        width={400} // ✅ ปรับขนาด modal ตรงนี้
      >
        <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
          ต้องการลบโปรเจกต์ <strong>{deleteTarget?.projectId}</strong> หรือไม่?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button type='primary' onClick={handleDelete}>Yes</Button>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>

    </div>
  )
}

export default AddProject
