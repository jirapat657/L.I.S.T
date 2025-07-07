// src/pages/Setting/AddUser/index.tsx
import { useState } from 'react'
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
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { httpsCallable } from 'firebase/functions'
import type { UserData, UserFormValues } from '@/types/users'
import { useAuth } from '@/hooks/useAuth'
import { getUsers } from '@/api/user'
import { functions } from '@/services/firebase'

const createUser = httpsCallable(functions, 'createUser')
const deleteUser = httpsCallable(functions, 'deleteUser')
const updateUserStatus = httpsCallable(functions, 'updateUserStatus')
const updateUserProfile = httpsCallable(functions, 'updateUserProfile')
const updateUserEmail = httpsCallable(functions, 'updateUserEmail')
const updateUserPassword = httpsCallable(functions, 'updateUserPassword')
const updateUserDisplayName = httpsCallable(functions, 'updateUserDisplayName')

const { Option } = Select

const AddUserPage = () => {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchId, setSearchId] = useState('')
  const [searchName, setSearchName] = useState('')
  const pageSize = 20
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null)

  const { currentUser } = useAuth()

  // 3. query รายชื่อ user ทั้งหมด
  const { data: users = [] } = useQuery<UserData[]>({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: !!currentUser,
  })

  // MUTATION สำหรับสร้าง user
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      return await createUser(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('สร้างบัญชีผู้ใช้สำเร็จ')
      setIsModalOpen(false)
      form.resetFields()
      setEditTarget(null)
    },
    onError: (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code: string }
        message.error(
          err.code === 'auth/email-already-in-use'
            ? 'อีเมลนี้ถูกใช้งานแล้ว'
            : 'ไม่สามารถสร้างบัญชีผู้ใช้ได้'
        )
      } else {
        message.error('เกิดข้อผิดพลาดที่ไม่รู้จัก')
      }
    },
  })

  // MUTATION สำหรับอัปเดต user
  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      values,
      editTarget,
    }: {
      id: string
      values: UserFormValues
      editTarget: UserData
    }) => {
      // 1. Update Firestore profile
      await updateUserProfile({
        uid: id,
        profileData: {
          userName: values.userName,
          role: values.role,
          jobPosition: values.jobPosition,
        },
      })

      // 1.1 Update displayName ใน Auth ถ้า userName เปลี่ยน
      if (values.userName !== editTarget.userName) {
        await updateUserDisplayName({
          uid: id,
          newDisplayName: values.userName,
        })
      }

      // 2. Update email ถ้า email เปลี่ยน
      if (values.email !== editTarget.email) {
        await updateUserEmail({
          uid: id,
          newEmail: values.email,
        })
      }

      // 3. Update password ถ้ามีการกรอก
      if (values.newPassword && values.newPassword.length > 0) {
        await updateUserPassword({
          uid: id,
          newPassword: values.newPassword,
        })
      }
      return true
    },
    onSuccess: () => {
      message.success('อัปเดตข้อมูลผู้ใช้สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsModalOpen(false)
      form.resetFields()
      setEditTarget(null)
    },
    onError: (err) => {
      console.error('Error updating user:', err)
      message.error('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้')
    },
  })

  // 6. ฟังก์ชันการลบผู้ใช้
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteUser({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('ลบบัญชีสำเร็จ')
      setDeleteTarget(null)
    },
    onError: () => message.error('ไม่สามารถลบได้'),
  })

  // 7. ฟังก์ชันการเปลี่ยนสถานะผู้ใช้
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) => {
      return await updateUserStatus({ id, status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: () => message.error('ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้'),
  })

  const handleOpenModal = () => {
    form.resetFields()
    setEditTarget(null)
    setIsModalOpen(true)
  }

  const handleEdit = (record: UserData) => {
    setEditTarget(record)
    form.setFieldsValue({
      userName: record.userName,
      email: record.email,
      role: record.role,
      jobPosition: record.jobPosition,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (values: UserFormValues) => {
    if (!editTarget) {
      const maxId = Math.max(0, ...users.map((u) => parseInt(u.userId?.split('-')[1] || '0')))
      const nextId = `LC-${(maxId + 1).toString().padStart(6, '0')}`

      createUserMutation.mutate({
        ...values,
        userId: nextId,
        status: 'Active',
      })
    } else {
      const id = editTarget.uid || editTarget.id
      updateUserMutation.mutate({ id, values, editTarget })
    }
  }

  const handleToggleStatus = (record: UserData) => {
    const newStatus = record.status === 'Active' ? 'Inactive' : 'Active'
    toggleStatusMutation.mutate({ id: record.id, status: newStatus })
  }

  const handleDelete = (record: UserData) => {
    deleteUserMutation.mutate(record.id)
  }

  const filteredData = users
    .filter(
      (item) =>
        item.userId?.toLowerCase().includes(searchId.toLowerCase()) &&
        item.userName?.toLowerCase().includes(searchName.toLowerCase())
    )
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
              {
                key: 'edit',
                label: (
                  <>
                    <EditOutlined /> Edit
                  </>
                ),
              },
              {
                key: 'delete',
                label: (
                  <>
                    <DeleteOutlined /> Delete
                  </>
                ),
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') handleEdit(record)
              if (key === 'delete') setDeleteTarget(record)
            },
          }}
        >
          <Button>
            <MoreOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ]

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
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
          setEditTarget(null)
        }}
        footer={null}
        destroyOnHidden
      >
        <Form layout='vertical' form={form} onFinish={handleSubmit}>
          <Form.Item label='User Name' name='userName' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label='Role' name='role' rules={[{ required: true }]}>
            <Select>
              <Option value='Admin'>Admin</Option>
              <Option value='Staff'>Staff</Option>
            </Select>
          </Form.Item>
          <Form.Item label='Job Position' name='jobPosition' rules={[{ required: true }]}>
            <Select>
              <Option value='Developer'>Developer</Option>
              <Option value='Business Analyst'>Business Analyst</Option>
              <Option value='Project Coordinator'>Project Coordinator</Option>
              <Option value='Project Manager'>Project Manager</Option>
              <Option value='Project Owner'>Project Owner</Option>
              <Option value='UX/UI Designer'>UX/UI Designer</Option>
              <Option value='Tester'>Tester</Option>
            </Select>
          </Form.Item>
          <Form.Item label='Email' name='email'
            rules={[
              { required: true, type: 'email', message: 'กรุณากรอกอีเมลที่ถูกต้อง' },
              {
                async validator(_, value) {
                  if (!value) return Promise.resolve();
                  const isDuplicate = users.some(
                    (u) =>
                      u.email === value &&
                      (!editTarget || u.id !== editTarget.id)
                  );
                  if (isDuplicate) {
                    return Promise.reject('อีเมลนี้ถูกใช้งานแล้ว');
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <Input />
          </Form.Item>
          {!editTarget && (
            <Form.Item
              label='Password'
              name='password'
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editTarget && (
            <Form.Item label='New Password' name='newPassword'>
              <Input.Password placeholder='Leave blank to keep old password' />
            </Form.Item>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={() => {
              setIsModalOpen(false)
              form.resetFields()
              setEditTarget(null)
            }}>ยกเลิก</Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={createUserMutation.isPending || updateUserMutation.isPending}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
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
  )
}

export default AddUserPage
