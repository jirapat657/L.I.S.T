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
  type UploadFile,
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
  const pageSize = 20
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [logoRemoved, setLogoRemoved] = useState(false);  // true ถ้าผู้ใช้กดลบ


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
      setLogoFileList([]);   // <- เพิ่มตรงนี้ (add)
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
      setLogoFileList([]);   // <- เพิ่มตรงนี้ (add)
      
    },
    onError: () => {
      message.error('ไม่สามารถอัปเดตโปรเจกต์ได้')
    },
  })

  

  const handleOpenModal = () => {
    setLogoFileList([]);    // <- เพิ่มบรรทัดนี้!
    setIsModalOpen(true);
    setLogoRemoved(false); 
  }

  const handleCancel = () => {
    form.resetFields();
    setLogoFileList([]);    // <- เพิ่มตรงนี้!
    setIsModalOpen(false);
  }

  const handleSubmit = async (values: ProjectFormValues) => {
    const exists = await checkProjectIdExists(values.projectId);
    if (exists) {
      message.error('Project ID นี้มีอยู่แล้ว กรุณาระบุรหัสอื่น');
      return;
    }
    const currentUser = auth.currentUser;
    const displayName = currentUser?.displayName || currentUser?.email || 'ไม่ทราบผู้ใช้';

    // Map logoFileList เป็น object { file: File } ตามที่ api ต้องการ
    let logo: { file: File } | undefined = undefined;
    if (logoFileList.length && logoFileList[0].originFileObj) {
      logo = { file: logoFileList[0].originFileObj as File };
    }

    // ส่งเข้า mutation แบบนี้เท่านั้น!
    addProjectMutation.mutate({
      projectId: values.projectId,
      projectName: values.projectName,
      logo,  // ต้องเป็น object { file: File } หรือ undefined
      createBy: displayName,
      modifiedBy: displayName, // เพิ่ม modifiedBy ให้ตรงกับ createBy
    });
  };

  // ...ใน handleUpdate เพิ่มเติมแบบ async
  const handleUpdate = async (values: ProjectFormValues) => {
    if (!viewTarget) return;

    // กำหนดค่า logo ตามสถานะ
    let logoValue: { file: File } | string | null;
    
    if (logoRemoved) {
      // ผู้ใช้กดลบโลโก้
      logoValue = null;
    } else if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
      // อัปโหลดไฟล์ใหม่
      logoValue = { file: logoFileList[0].originFileObj };
    } else {
      // ไม่เปลี่ยนแปลงโลโก้ - ส่ง URL เดิมไป
      logoValue = viewTarget.logo || null;
    }

    updateProjectMutation.mutate({
      id: viewTarget.id,
      values: {
        projectId: values.projectId,
        projectName: values.projectName,
        logo: logoValue,
        modifiedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'ไม่ทราบผู้ใช้',
      },
    });

    setLogoRemoved(false);
  };

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
                // แปลง logo เป็น fileList ถ้ามี
                setLogoFileList(
                  record.logo
                    ? [
                        {
                          uid: '-1',
                          name: 'logo.png',
                          status: 'done',
                          url: record.logo,
                        },
                      ]
                    : []
                );
                viewForm.setFieldsValue({
                  projectId: record.projectId,
                  projectName: record.projectName,
                  logo: undefined, // ปล่อยว่างให้ antd upload คุมเอง
                });
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
          <SyncOutlined /> Clear Search
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
              // showTotal={(total) => `หน้า ${currentPage} / ${Math.ceil(total / pageSize)}`}
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
                    return Promise.reject(new Error('Project ID นี้มีอยู่แล้ว กรุณาระบุรหัสอื่น'));
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
              listType="picture"
              fileList={logoFileList}
              onChange={({ fileList }) => setLogoFileList(fileList)}
              // ถ้าคลิก preview ให้เปิดภาพเต็ม
              onPreview={(file) => window.open(file.url || file.thumbUrl, '_blank')}
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
          setLogoFileList([]);
          setLogoRemoved(false); 
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
              listType="picture"
              fileList={logoFileList}
              onChange={({ fileList }) => setLogoFileList(fileList)}
              onPreview={(file) => window.open(file.url || file.thumbUrl, '_blank')}
              onRemove={() => {
                setLogoFileList([]);       // ลบออกจาก preview
                setLogoRemoved(true);      // จำว่า "ผู้ใช้ต้องการลบโลโก้เดิม"
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 12, fontStyle: 'italic', color: '#888' }}>
            Create By: {viewTarget?.createBy || 'ไม่ทราบ'}, {viewTarget?.createdAt ? new Date(viewTarget.createdAt.seconds * 1000).toLocaleString() : '-'}
            <br />
            Modified By: {viewTarget?.modifiedBy || 'ไม่ทราบ'}, {viewTarget?.updatedAt ? new Date(viewTarget.updatedAt.seconds * 1000).toLocaleString() : '-'}
            
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                setViewTarget(null)
                viewForm.resetFields()
                setLogoFileList([]);
                setLogoRemoved(false); 
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