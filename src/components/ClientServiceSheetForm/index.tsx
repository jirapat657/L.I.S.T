//src/components/ClientServiceSheetForm/index.tsx
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Select,
  Table,
  Dropdown,
  Popconfirm,
  Checkbox,
  Divider,
  type FormInstance,
} from 'antd';
import { PlusOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import type {
  ServiceTask,
  ClientServiceSheetData,
} from '@/types/clientServiceSheet';

/* --------------------------------------------- */
/* Props Interface                      */
/* --------------------------------------------- */
interface ClientServiceSheetFormProps {
  initialValues?: Partial<ClientServiceSheetData>;
  onFinish: (values: ClientServiceSheetData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  formInstance?: FormInstance;
}

/* --------------------------------------------- */
/* Local types & Options                 */
/* --------------------------------------------- */
type ChargeFlag = 'included' | 'free' | 'extra';
type ChargeType = ChargeFlag[];

// ตัวอย่าง Options สามารถดึงมาจากที่อื่นได้
const typeOptions = [
  { label: 'Installation', value: 'Installation' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Repair', value: 'Repair' },
  { label: 'Onsite Service', value: 'Onsite Service' },
];
const statusOptions = [
  { label: 'Complete', value: 'Complete' },
  { label: 'Follow up', value: 'Follow up' },
];
const userOptions = [
  { label: 'Tech A', value: 'Tech A' },
  { label: 'Tech B', value: 'Tech B' },
  { label: 'Support', value: 'Support' },
];

/* --------------------------------------------- */
/* Subtable Component                */
/* --------------------------------------------- */
const ServiceTaskTable: React.FC<{
  tasks: ServiceTask[];
  onUpdate: (id: string, field: keyof ServiceTask, value: any) => void;
  onDelete: (id: string) => void;
  userOptions: { label: string; value: string }[];
}> = ({ tasks, onUpdate, onDelete, userOptions }) => {
  const columns = [
    {
      title: 'No.',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: 'Task Description',
      dataIndex: 'description',
      render: (text: string, record: ServiceTask) => (
        <Input
          value={text}
          onChange={(e) => onUpdate(record.id, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (text: string, record: ServiceTask) => (
        <Select
          value={text}
          options={typeOptions}
          onChange={(value) => onUpdate(record.id, 'type', value)}
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
          onChange={(value) => onUpdate(record.id, 'status', value)}
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
          onChange={(value) => onUpdate(record.id, 'serviceBy', value)}
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
      align: 'center' as const,
      render: (_: any, record: ServiceTask) => (
        <Popconfirm
          title="Delete this task?"
          onConfirm={() => onDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];
  return (
    <Table
      columns={columns}
      dataSource={tasks}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

// [เพิ่ม] สร้าง object ว่างเปล่าคงที่ไว้นอก Component
const defaultInitialValues = {};

/* --------------------------------------------- */
/* Main Form Component               */
/* --------------------------------------------- */
const ClientServiceSheetForm: React.FC<ClientServiceSheetFormProps> = ({
  // [แก้ไข] ให้ default value อ้างอิงจากตัวแปรคงที่
  initialValues = defaultInitialValues,
  onFinish,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save',
  formInstance,
}) => {
  const [form] = Form.useForm(formInstance);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);

  useEffect(() => {
    const initialTasks =
      initialValues.tasks?.map((task) => ({
        ...task,
        id: task.id || `temp-${Math.random()}`,
      })) || [];
    setTasks(initialTasks);

    const processedValues = {
      ...initialValues,
      date: initialValues.date
        ? dayjs((initialValues.date as Timestamp).toDate())
        : null,
      customerInfo: {
        ...initialValues.customerInfo,
        date: initialValues.customerInfo?.date
          ? dayjs((initialValues.customerInfo.date as Timestamp).toDate())
          : null,
      },
      serviceByInfo: {
        ...initialValues.serviceByInfo,
        date: initialValues.serviceByInfo?.date
          ? dayjs((initialValues.serviceByInfo.date as Timestamp).toDate())
          : null,
      },
    };
    form.setFieldsValue(processedValues);
  }, [initialValues, form]);

  /* ---------- Handlers สำหรับตาราง Tasks ---------- */
  const handleAddTask = () =>
    setTasks((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        description: '',
        type: '',
        status: '',
        serviceBy: '',
      },
    ]);
  const handleUpdateTask = (
    id: string,
    field: keyof ServiceTask,
    value: any
  ) =>
    setTasks((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  const handleDeleteTask = (id: string) =>
    setTasks((prev) => prev.filter((row) => row.id !== id));

  // Helper สำหรับแปลงข้อมูลวันที่กลับเป็น Timestamp ก่อนส่งเข้า DB
  const toTimestamp = (val: any): Timestamp | null => {
    if (!val) return null;
    if (val.toDate) return Timestamp.fromDate(val.toDate()); // dayjs object
    return Timestamp.fromDate(new Date(val));
  };

  // เมื่อกดปุ่ม Submit หลักของฟอร์ม
  const handleFormSubmit = (values: any) => {
    // [แก้ไข] ตรวจสอบและแปลงข้อมูลก่อนสร้าง payload
    const payload: ClientServiceSheetData = {
      projectName: values.projectName,
      serviceLocation: values.serviceLocation,
      startTime: values.startTime,
      endTime: values.endTime,
      jobCode: values.jobCode , // แปลงค่า `undefined` ของฟิลด์อื่นๆ เป็น `null`
      date: toTimestamp(values.date) ?? Timestamp.now(),
      user: values.user,
      totalHours: Number(values.totalHours) || 0,
      chargeTypes: values.chargeTypes || [],
      extraChargeDescription: values.extraChargeDescription || null,
      remark: values.remark || null,
      tasks,
      // สร้าง object ของ customerInfo และ serviceByInfo ขึ้นมาใหม่
      // เพื่อตรวจสอบและแปลงค่า `undefined` เป็น `null` ในแต่ละฟิลด์
      customerInfo: {
        company: values.customerInfo?.company || null,
        name: values.customerInfo?.name || null,
        date: toTimestamp(values.customerInfo?.date),
        signature: values.customerInfo?.signature || null,
      },
      serviceByInfo: {
        company: values.serviceByInfo?.company || null,
        name: values.serviceByInfo?.name || null,
        date: toTimestamp(values.serviceByInfo?.date),
        signature: values.serviceByInfo?.signature || null,
      },
    };
    
    onFinish(payload);
  };

  // ใช้สำหรับซ่อน/แสดงช่องกรอก "Extra Charge"
  const chargeTypes = Form.useWatch<ChargeType>('chargeTypes', form);

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleFormSubmit}
      initialValues={{
        date: dayjs(),
        chargeTypes: [],
        customerInfo: {},
        serviceByInfo: {},
        remark: '',
        ...initialValues,
      }}
    >
      {/* ----- Base fields ----- */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Project Name"
            name="projectName"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Service Location"
            name="serviceLocation"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter service location" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Start Time"
            name="startTime"
            rules={[{ required: true }]}
          >
            <Input type="time" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="End Time"
            name="endTime"
            rules={[{ required: true }]}
          >
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
            <Select showSearch options={userOptions} placeholder="Select user" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Total Hours"
            name="totalHours"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter total hours" type="number" min={0} />
          </Form.Item>
        </Col>
      </Row>

      {/* ----- Charge section ----- */}
      <Divider orientation="left">Charge</Divider>
      <Form.Item label="Charge Types" style={{ marginBottom: 0 }}>
        <Row gutter={8} align="middle">
          <Col>
            <Form.Item name="chargeTypes" noStyle>
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
              <Form.Item name="extraChargeDescription" noStyle>
                <Input placeholder="Describe the extra charge" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form.Item>

      {/* ----- Tasks section ----- */}
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

      {/* ----- Remark section ----- */}
      <Divider orientation="left">Remark</Divider>
      <Form.Item name="remark" label="Additional Notes">
        <Input.TextArea
          rows={4}
          placeholder="Enter any additional remarks or notes"
        />
      </Form.Item>

      {/* ----- Signatures section ----- */}
      <Divider orientation="left">Signatures</Divider>
      <Row gutter={24}>
        <Col span={12}>
          <Divider>Customer</Divider>
          <Form.Item label="Company" name={['customerInfo', 'company']}>
            <Input placeholder="Customer company" />
          </Form.Item>
          <Form.Item label="Name" name={['customerInfo', 'name']}>
            <Input placeholder="Customer name" />
          </Form.Item>
          <Form.Item label="Date" name={['customerInfo', 'date']}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
          </Form.Item>
          <Form.Item label="Signature" name={['customerInfo', 'signature']}>
            <Input placeholder="Signature (text or reference)" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Divider>Service By</Divider>
          <Form.Item label="Company" name={['serviceByInfo', 'company']}>
            <Input placeholder="Service company" />
          </Form.Item>
          <Form.Item label="Name" name={['serviceByInfo', 'name']}>
            <Input placeholder="Service person name" />
          </Form.Item>
          <Form.Item label="Date" name={['serviceByInfo', 'date']}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
          </Form.Item>
          <Form.Item label="Signature" name={['serviceByInfo', 'signature']}>
            <Input placeholder="Signature (text or reference)" />
          </Form.Item>
        </Col>
      </Row>

      {/* ----- Footer Buttons ----- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 24,
        }}
      >
        <Button htmlType="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {submitButtonText}
        </Button>
      </div>
    </Form>
  );
};

export default ClientServiceSheetForm;