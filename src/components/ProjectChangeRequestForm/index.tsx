//src/components/ProjectChangeRequestForm/index.tsx
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
  Popconfirm,
  Divider,
  Checkbox, // [เพิ่ม] Import Checkbox
  type FormInstance,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

// --- Placeholder Types (กรุณาแทนที่ด้วย Type จริงจาก src/types) ---
type ChangeRequestTask = {
  id: string;
  sequence?: string;
  description?: string;
  requestedBy?: string;
  approved?: string;
};

type PartyInfo = {
  company?: string;
  name?: string;
  date?: Timestamp | null;
  signature?: string;
};

// [แก้ไข] เพิ่มฟิลด์สำหรับ Charge Section
type ProjectChangeRequest_Firestore = {
  id: string;
  projectName?: string;
  projectStage?: string;
  jobCode?: string;
  date?: Timestamp | null;
  tasks?: ChangeRequestTask[];
  chargeTypes?: ('included' | 'free' | 'extra')[];
  extraChargeDescription?: string;
  remark?: string;
  customerInfo?: PartyInfo;
  serviceByInfo?: PartyInfo;
};
// --- สิ้นสุดส่วนของ Placeholder ---

interface ProjectChangeRequestFormProps {
  initialValues?: Partial<ProjectChangeRequest_Firestore>;
  onFinish: (values: ProjectChangeRequest_Firestore) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  formInstance?: FormInstance;
}

// [แก้ไข] เพิ่มฟิลด์สำหรับ Charge Section
type FormValues = {
  projectName?: string;
  projectStage?: string;
  jobCode?: string;
  date?: dayjs.Dayjs;
  chargeTypes?: ('included' | 'free' | 'extra')[];
  extraChargeDescription?: string;
  remark?: string;
  customerInfo?: {
    company?: string;
    name?: string;
    date?: dayjs.Dayjs;
    signature?: string;
  };
  serviceByInfo?: {
    company?: string;
    name?: string;
    date?: dayjs.Dayjs;
    signature?: string;
  };
};

// --- Placeholder Options (กรุณาแทนที่ด้วยข้อมูลจริง) ---
const projectStageOptions = [
  { label: 'Initiation', value: 'Initiation' },
  { label: 'Planning', value: 'Planning' },
  { label: 'Execution', value: 'Execution' },
  { label: 'Closing', value: 'Closing' },
];
// ---

const ChangeRequestTaskTable: React.FC<{
  tasks: ChangeRequestTask[];
  onUpdate: (id: string, field: keyof ChangeRequestTask, value: any) => void;
  onDelete: (id: string) => void;
}> = ({ tasks, onUpdate, onDelete }) => {
  const columns = [
    {
      title: 'Seq.',
      dataIndex: 'sequence',
      width: 80,
      render: (text: string, record: ChangeRequestTask) => (
        <Input
          value={text}
          onChange={(e) => onUpdate(record.id, 'sequence', e.target.value)}
          placeholder="Seq."
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (text: string, record: ChangeRequestTask) => (
        <Input.TextArea
          value={text}
          onChange={(e) => onUpdate(record.id, 'description', e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      width: 200,
      render: (text: string, record: ChangeRequestTask) => (
        <Input.TextArea
          value={text}
          onChange={(e) => onUpdate(record.id, 'requestedBy', e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder="Enter requester"
        />
      ),
    },
    {
      title: 'Approved',
      dataIndex: 'approved',
      width: 200,
      render: (text: string, record: ChangeRequestTask) => (
        <Input.TextArea
          value={text}
          onChange={(e) => onUpdate(record.id, 'approved', e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder="Enter approver"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: ChangeRequestTask) => (
        <Popconfirm
          title="Delete this item?"
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

const defaultInitialValues: Partial<ProjectChangeRequest_Firestore> = {};

const ProjectChangeRequestForm: React.FC<ProjectChangeRequestFormProps> = ({
  initialValues = defaultInitialValues,
  onFinish,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save',
  formInstance,
}) => {
  const [form] = Form.useForm(formInstance);
  const [tasks, setTasks] = useState<ChangeRequestTask[]>([]);

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
        : undefined,
      customerInfo: {
        ...initialValues.customerInfo,
        date: initialValues.customerInfo?.date
          ? dayjs((initialValues.customerInfo.date as Timestamp).toDate())
          : undefined,
      },
      serviceByInfo: {
        ...initialValues.serviceByInfo,
        date: initialValues.serviceByInfo?.date
          ? dayjs((initialValues.serviceByInfo.date as Timestamp).toDate())
          : undefined,
      },
    };
    form.resetFields();
    form.setFieldsValue(processedValues);
  }, [initialValues, form]);

  const handleAddTask = () =>
    setTasks((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        sequence: '',
        description: '',
        requestedBy: '',
        approved: '',
      },
    ]);

  const handleUpdateTask = (
    id: string,
    field: keyof ChangeRequestTask,
    value: any
  ) =>
    setTasks((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );

  const handleDeleteTask = (id: string) =>
    setTasks((prev) => prev.filter((row) => row.id !== id));

  const toTimestamp = (val: any): Timestamp | null => {
    if (!val) return null;
    if (val instanceof Timestamp) return val;
    if (val.toDate) return Timestamp.fromDate(val.toDate());
    return Timestamp.fromDate(new Date(val));
  };

  const handleFormSubmit = (values: FormValues) => {
    // [แก้ไข] เพิ่มฟิลด์ใหม่เข้าไปใน payload
    const payload: ProjectChangeRequest_Firestore = {
      id: initialValues.id || '',
      projectName: values.projectName || '',
      projectStage: values.projectStage || '',
      jobCode: values.jobCode || '',
      date: toTimestamp(values.date),
      tasks,
      chargeTypes: values.chargeTypes || [],
      extraChargeDescription: values.extraChargeDescription || '',
      remark: values.remark || '',
      customerInfo: {
        company: values.customerInfo?.company || '',
        name: values.customerInfo?.name || '',
        date: toTimestamp(values.customerInfo?.date),
        signature: values.customerInfo?.signature || '',
      },
      serviceByInfo: {
        company: values.serviceByInfo?.company || '',
        name: values.serviceByInfo?.name || '',
        date: toTimestamp(values.serviceByInfo?.date),
        signature: values.serviceByInfo?.signature || '',
      },
    };
    onFinish(payload);
  };
  
  // [เพิ่ม] ใช้ useWatch เพื่อติดตามค่าของ Checkbox
  const chargeTypes = Form.useWatch('chargeTypes', form);

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleFormSubmit}
      initialValues={{ date: dayjs(), chargeTypes: [] }}
    >
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
            label="Project Stage"
            name="projectStage"
            rules={[{ required: true }]}
          >
            <Select options={projectStageOptions} placeholder="Select stage" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Job Code" name="jobCode">
            <Input placeholder="Enter job code" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Change Request Items</Divider>
      <div style={{ textAlign: 'right', margin: '12px 0' }}>
        <Button onClick={handleAddTask}>
          <PlusOutlined /> Add Item
        </Button>
      </div>
      <ChangeRequestTaskTable
        tasks={tasks}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <Divider orientation="left">Remark</Divider>
      <Form.Item name="remark" label="Additional Notes">
        <Input.TextArea
          rows={4}
          placeholder="Enter any additional remarks or notes"
        />
      </Form.Item>

      {/* Charge Section */}
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

export default ProjectChangeRequestForm;