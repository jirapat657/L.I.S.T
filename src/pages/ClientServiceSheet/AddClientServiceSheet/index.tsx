// src/pages/AddClientServiceSheet/index.tsx

import React, { useState } from 'react'
import {
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Select,
  message,
  Table,
  Dropdown,
  Popconfirm,
  Checkbox,   
  Divider,
} from 'antd'
import { PlusOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Timestamp } from 'firebase/firestore'
import type { ServiceTask, ClientServiceSheetData } from '@/types/clientServiceSheet'
import { addClientServiceSheet } from '@/api/clientServiceSheet'

/* --------------------------------------------- */
/* Local types for new sections (UI-only for now) */
/* --------------------------------------------- */
type ChargeFlag = 'included' | 'free' | 'extra'
type ChargeType = ChargeFlag[]  // ✅ เลือกได้หลายอัน


/* --------------------------------------------- */
/* Options                                       */
/* --------------------------------------------- */
const typeOptions = [
  { label: 'Installation', value: 'Installation' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Repair', value: 'Repair' },
]

const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
]

// mock user options
const userOptions = [
  { label: 'Alice', value: 'Alice' },
  { label: 'Bob', value: 'Bob' },
]

/* --------------------------------------------- */
/* Subtable component                            */
/* --------------------------------------------- */
const ServiceTaskTable: React.FC<{
  tasks: ServiceTask[]
  onUpdate: (id: string, field: keyof ServiceTask, value: any) => void
  onDelete: (id: string) => void
  userOptions: { label: string; value: string }[]
}> = ({ tasks, onUpdate, onDelete, userOptions }) => {
  const columns = [
    {
      title: 'No.',
      render: (_: any, __: any, index: number) => tasks.length - index,
      width: 60,
    },
    {
      title: 'Task Description',
      dataIndex: 'description',
      render: (text: string, record: ServiceTask) => (
        <Input
          value={text}
          onChange={e => onUpdate(record.id, 'description', e.target.value)}
        />
      ),
      width: 240,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (text: string, record: ServiceTask) => (
        <Select
          value={text}
          options={typeOptions}
          onChange={value => onUpdate(record.id, 'type', value)}
          style={{ width: 160 }}
          placeholder="Select type"
        />
      ),
      width: 170,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text: string, record: ServiceTask) => (
        <Select
          value={text}
          options={statusOptions}
          onChange={value => onUpdate(record.id, 'status', value)}
          style={{ width: 160 }}
          placeholder="Select status"
        />
      ),
      width: 170,
    },
    {
      title: 'Service By',
      dataIndex: 'serviceBy',
      render: (text: string, record: ServiceTask) => (
        <Select
          value={text}
          options={userOptions}
          onChange={value => onUpdate(record.id, 'serviceBy', value)}
          style={{ width: 180 }}
          showSearch
          placeholder="Select user"
        />
      ),
      width: 190,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: ServiceTask) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'delete',
                label: (
                  <Popconfirm
                    title="Delete this task?"
                    onConfirm={() => onDelete(record.id)}
                    okText="Delete"
                    cancelText="Cancel"
                  >
                    <span style={{ color: 'red' }}>
                      <DeleteOutlined /> Delete
                    </span>
                  </Popconfirm>
                ),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button>
            <MoreOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={tasks}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
      style={{ marginTop: 16 }}
    />
  )
}

/* --------------------------------------------- */
/* Main Page                                     */
/* --------------------------------------------- */
const AddClientServiceSheet: React.FC = () => {
  const [form] = Form.useForm()
  const [tasks, setTasks] = useState<ServiceTask[]>([])

  /* ---------- Subtasks handlers ---------- */
  const handleAddTask = () => {
    setTasks(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        type: '',
        status: '',
        serviceBy: '',
      },
    ])
  }

  const handleUpdateTask = (
    id: string,
    field: keyof ServiceTask,
    value: any
  ) => {
    setTasks(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(row => row.id !== id))
  }

  /* helper สำหรับแปลงวัน */
  const toTimestamp = (val: any): Timestamp | null => {
    if (!val) return null
    if (val instanceof Timestamp) return val
    if (val instanceof Date) return Timestamp.fromDate(val)
    if (typeof val === 'string') return Timestamp.fromDate(new Date(val))
    if (val.toDate) return Timestamp.fromDate(val.toDate()) // dayjs หรือ object ที่มี toDate
    return null
  }

  /* ---------- Submit ---------- */
  const onFinish = async (values: any) => {

    // validate charge types - เปลี่ยนจาก required เป็น optional
    const hasExtra = values.chargeTypes?.includes('extra') || false
    if (hasExtra && !values.extraChargeDescription) {
      message.error('Please fill Extra Charge description')
      return
    }

    try {
      const payload = {
        projectName: values.projectName,
        serviceLocation: values.serviceLocation,
        startTime: values.startTime,
        endTime: values.endTime,
        jobCode: values.jobCode,
        date: toTimestamp(values.date) ?? Timestamp.now(),
        user: values.user,
        totalHours: Number(values.totalHours) || 0, // default 0 ถ้าไม่กรอก

        chargeTypes: values.chargeTypes || [],
        extraChargeDescription: values.extraChargeDescription || null, // ใช้ null แทน undefined
        remark: values.remark || null,

        tasks,

        customerInfo: values.customerInfo ? {
          company: values.customerInfo.company || null,
          name: values.customerInfo.name || null,
          date: values.customerInfo.date ? toTimestamp(values.customerInfo.date) : null,
          signature: values.customerInfo.signature || null,
        } : null, // ใช้ null แทน undefined
          
        serviceByInfo: values.serviceByInfo ? {
          company: values.serviceByInfo.company || null,
          name: values.serviceByInfo.name || null,
          date: values.serviceByInfo.date ? toTimestamp(values.serviceByInfo.date) : null,
          signature: values.serviceByInfo.signature || null,
        } : null,
      };

      await addClientServiceSheet(payload);
      message.success('Service Sheet Added!');
      form.resetFields();
      setTasks([]);
    } catch (err: any) {
      message.error(err?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const chargeTypes = Form.useWatch<ChargeType>('chargeTypes', form)

  return (
    <div>
      <h2>Add Client Service Sheet</h2>
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        initialValues={{
          date: dayjs(),
          chargeTypes: [],
          customerInfo: {}, // เพิ่ม default object ว่าง
          serviceByInfo: {}, // เพิ่ม default object ว่าง
          remark: '', // กำหนดค่าว่างเริ่มต้น  
        }}
      >
        {/* Base fields */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Project Name" name="projectName" rules={[{ required: true }]}>
              <Input placeholder="Enter project name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Service Location" name="serviceLocation" rules={[{ required: true }]}>
              <Input placeholder="Enter service location" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Start Time" name="startTime" rules={[{ required: true }]}>
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="End Time" name="endTime" rules={[{ required: true }]}>
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Job Code" name="jobCode" rules={[{ required: true }]}>
              <Input placeholder="Enter job code" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="User" name="user" rules={[{ required: true }]}>
              <Select
                showSearch
                options={userOptions}
                placeholder="Select user"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Total Hours" name="totalHours" rules={[{ required: true }]}>
              <Input placeholder="Enter total hours" type="number" min={0} />
            </Form.Item>
          </Col>
        </Row>

        {/* Charge section - เปลี่ยนเป็นไม่บังคับ */}
        <Divider orientation="left">Charge</Divider>
        <Form.Item
          label="Charge Types"
          style={{ marginBottom: 0 }}
        >
          <Row gutter={8} align="middle">
            <Col>
              <Form.Item
                name="chargeTypes"
                noStyle
              >
                <Checkbox.Group
                  options={[
                    { label: 'Included in Agreement', value: 'included' },
                    { label: 'Free of Charge', value: 'free' },
                    { label: 'Extra Charge', value: 'extra' },
                  ]}
                />
              </Form.Item>
            </Col>

            {chargeTypes?.includes('extra') && (
              <Col flex="auto">
                <Form.Item
                  name="extraChargeDescription"
                  noStyle
                >
                  <Input placeholder="Describe the extra charge" />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form.Item>

        {/* Tasks - ยังคง required ตามเดิม */}
        <Divider orientation="left">Service Tasks</Divider>
        <div style={{ textAlign: 'right', margin: '12px 0' }}>
          <Button onClick={handleAddTask}>
            <PlusOutlined /> Add Task
          </Button>
        </div>
        <ServiceTaskTable
          tasks={tasks}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          userOptions={userOptions}
        />

        {/* เพิ่มส่วน Remark ใหม่ */}
        <Divider orientation="left">Remark</Divider>
        <Form.Item
          name="remark"
          label="Additional Notes"
        >
          <Input.TextArea rows={4} placeholder="Enter any additional remarks or notes" />
        </Form.Item>

        {/* Parties section - เปลี่ยนเป็นไม่บังคับ */}
        <Divider orientation="left">Signatures</Divider>
        <Row gutter={24}>
          <Col span={12}>
            <Divider>Customer</Divider>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  label="Company"
                  name={['customerInfo', 'company']}
                >
                  <Input placeholder="Customer company" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Name"
                  name={['customerInfo', 'name']}
                >
                  <Input placeholder="Customer name" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Date"
                  name={['customerInfo', 'date']}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Signature"
                  name={['customerInfo', 'signature']}
                >
                  <Input placeholder="Signature (text or reference)" />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          <Col span={12}>
            <Divider>Service By</Divider>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  label="Company"
                  name={['serviceByInfo', 'company']}
                >
                  <Input placeholder="Service company" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Name"
                  name={['serviceByInfo', 'name']}
                >
                  <Input placeholder="Service person name" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Date"
                  name={['serviceByInfo', 'date']}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Signature"
                  name={['serviceByInfo', 'signature']}
                >
                  <Input placeholder="Signature (text or reference)" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button htmlType="button" onClick={() => form.resetFields()}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default AddClientServiceSheet
