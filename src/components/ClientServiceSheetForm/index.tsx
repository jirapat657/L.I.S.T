// src/components/ClientServiceSheetForm/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
  Divider,
  type FormInstance,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';

// Types
import type {
  ServiceTask,
  ClientServiceSheet_Firestore,
} from '@/types/clientServiceSheet';
import type { ProjectData } from '@/types/project';

// APIs
import { getProjects } from '@/api/project';
import { getServiceSheetsByPrefix, type ClientServiceSheetDoc } from '@/api/clientServiceSheet';

/* --------------------------------------------- */
/* Props Interface                               */
/* --------------------------------------------- */
interface ClientServiceSheetFormProps {
  initialValues?: Partial<ClientServiceSheet_Firestore>;
  onFinish: (values: ClientServiceSheet_Firestore) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  formInstance?: FormInstance;

  mode?: 'create' | 'edit' | 'duplicate'; // ✅ เพิ่ม
}

/* --------------------------------------------- */
/* Local types & Options                         */
/* --------------------------------------------- */
type ChargeType = ('included' | 'free' | 'extra')[];

type FormValues = {
  // เพิ่ม projectId สำหรับ select และใช้ generate jobCode
  projectId?: string;
  projectName?: string;

  serviceLocation?: string;
  startTime?: string;
  endTime?: string;
  jobCode?: string;
  date?: dayjs.Dayjs;
  user?: string;
  totalHours?: number | string;
  chargeTypes?: ChargeType;
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

const typeOptions = [
  { label: 'I', value: 'I' },
  { label: 'T', value: 'T' },
  { label: 'O', value: 'O' },
];
const statusOptions = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
];

/* --------------------------------------------- */
/* Subtable Component                            */
/* --------------------------------------------- */
const ServiceTaskTable: React.FC<{
  tasks: ServiceTask[];
  onUpdate: (id: string, field: keyof ServiceTask, value: ServiceTask[keyof ServiceTask]) => void;
  onDelete: (id: string) => void;
}> = ({ tasks, onUpdate, onDelete }) => {
  const columns = [
    {
      title: 'No.',
      render: (_: unknown, __: unknown, index: number) => index + 1,
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
        <Input
          value={text}
          onChange={(e) => onUpdate(record.id, 'serviceBy', e.target.value)}
          placeholder="Enter service person"
        />
      ),
      width: 190,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: ServiceTask) => (
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

const defaultInitialValues: Partial<ClientServiceSheet_Firestore> = {};

/* --------------------------------------------- */
/* Main Form Component                           */
/* --------------------------------------------- */
const ClientServiceSheetForm: React.FC<ClientServiceSheetFormProps> = ({
  initialValues = defaultInitialValues,
  onFinish,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save',
  formInstance,
}) => {
  const [form] = Form.useForm(formInstance);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);

  // ===== Projects for Select =====
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectData[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // options + mapping
  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: p.projectName,
        value: p.projectId, // ใช้ projectId เป็นค่า
        _docId: p.id,
        _projectName: p.projectName,
      })),
    [projects]
  );
  const idToName = useMemo(() => new Map(projects.map(p => [p.projectId, p.projectName])), [projects]);

  // ===== Init form/tables =====
  const isEditing = Boolean(initialValues?.id);

  useEffect(() => {
    const initialTasks =
      initialValues.tasks?.map((task) => ({
        ...task,
        id: task.id || `temp-${Math.random()}`,
      })) || [];
    setTasks(initialTasks);

    const processedValues: FormValues = {
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


    // ถ้า initialValues มี projectName ให้ลองจับคู่ projectId อัตโนมัติจากชื่อ (ถ้าชื่อตรง)
    if (!processedValues.projectId && processedValues.projectName && projects.length) {
      const found = projects.find(p => p.projectName === processedValues.projectName);
      if (found) {
        processedValues.projectId = found.projectId;
      }
    }

    form.resetFields();
    form.setFieldsValue(processedValues);
  }, [initialValues, projects, form]);

  // ===== Date & Project watcher สำหรับ auto-generate jobCode =====
  const watchedProjectId = Form.useWatch<string | undefined>('projectId', form);
  const watchedDate = Form.useWatch<dayjs.Dayjs | undefined>('date', form);

  useEffect(() => {
    // สร้างเฉพาะตอน "สร้างใหม่" เท่านั้น เพื่อไม่ไปแก้ไขเลขในโหมดแก้ไข
    if (isEditing) return;
    if (!watchedProjectId) return;

    const d = watchedDate || dayjs();
    const ddMMyyyy = d.format('DDMMYYYY');
    const prefix = `${watchedProjectId}-${ddMMyyyy}`; // {projectId}-{DDMMYYYY}

    (async () => {
      try {
        // ดึงเอกสารทั้งหมดที่มี jobCode prefix ตรงกัน แล้วหาเลขรันสูงสุด
        const existing = await getServiceSheetsByPrefix(prefix); // ให้ API นี้ return เฉพาะ fields ที่มี jobCode
        const maxRun = (existing || []).reduce((mx: number, doc: ClientServiceSheetDoc) => {
          const m = String(doc.jobCode || '').match(/-(\d{3})$/);
          if (m) {
            const n = parseInt(m[1], 10);
            return n > mx ? n : mx;
          }
          return mx;
        }, 0);

        const nextRun = String(maxRun + 1).padStart(3, '0');
        const nextCode = `${prefix}-${nextRun}`;
        form.setFieldsValue({ jobCode: nextCode });
      } catch (err) {
        console.error('generate jobCode failed', err);
        message.error('ไม่สามารถสร้างเลขเอกสารอัตโนมัติได้');
      }
    })();
  }, [watchedProjectId, watchedDate, isEditing, form]);

  // ===== Task CRUD =====
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
    value: ServiceTask[keyof ServiceTask]
  ) =>
    setTasks((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  const handleDeleteTask = (id: string) =>
    setTasks((prev) => prev.filter((row) => row.id !== id));

  // ===== helpers =====
  function hasToDate(obj: unknown): obj is { toDate: () => Date } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'toDate' in obj &&
      typeof (obj as { toDate: unknown }).toDate === 'function'
    );
  }

  const toTimestamp = (
    val: dayjs.Dayjs | Timestamp | Date | string | null | undefined
  ): Timestamp | null => {
    if (!val) return null;
    if (val instanceof Timestamp) return val;
    if (hasToDate(val)) {
      return Timestamp.fromDate(val.toDate());
    }
    return Timestamp.fromDate(new Date(val as string | Date));
  };

  // ===== Submit =====
  const handleFormSubmit = (values: FormValues) => {
    const payload: ClientServiceSheet_Firestore = {
      id: initialValues.id || '',
      // เก็บชื่อไว้ใน Firestore แบบเดิม แต่ UI ใช้ projectId ในการเลือก
      projectName: values.projectName || (values.projectId ? (idToName.get(values.projectId) || '') : ''),
      serviceLocation: values.serviceLocation || '',
      startTime: values.startTime || '',
      endTime: values.endTime || '',
      jobCode: values.jobCode || '', // ได้จาก auto-generate
      extraChargeDescription: values.extraChargeDescription || '',
      remark: values.remark || '',
      tasks,
      date: toTimestamp(values.date) || null,
      user: values.user || '',
      totalHours: Number(values.totalHours) || 0,
      chargeTypes: values.chargeTypes || [],
      customerInfo: {
        company: values.customerInfo?.company || '',
        name: values.customerInfo?.name || '',
        date: toTimestamp(values.customerInfo?.date) || null,
        signature: values.customerInfo?.signature || '',
      },
      serviceByInfo: {
        company: values.serviceByInfo?.company || '',
        name: values.serviceByInfo?.name || '',
        date: toTimestamp(values.serviceByInfo?.date) || null,
        signature: values.serviceByInfo?.signature || '',
      },
    };

    onFinish(payload);
  };

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
      }}
    >
      {/* ซ่อน projectId สำหรับ generate jobCode */}
      <Form.Item name="projectId" hidden><Input /></Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          {/* Project Select: แสดงชื่อแต่เก็บ projectId */}
          <Form.Item
            label="Project"
            name="projectName" // เก็บชื่อในฟิลด์นี้ (ตาม type เดิมใน Firestore)
            required
            tooltip="เลือกโปรเจกต์จาก LIMProjects (จะตั้งค่า projectId ซ่อนให้เพื่อสร้าง Job Code)"
          >
            <Select
              placeholder="Select project"
              options={projectOptions}
              loading={isProjectsLoading}
              showSearch
              // ใช้ labelInValue เพื่อให้เราได้ทั้ง label และ value แล้ว map กลับ
              labelInValue
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(opt) => {
                // opt = { label: projectName, value: projectId }
                form.setFieldsValue({
                  projectId: opt?.value,
                  projectName: opt?.label,
                });
              }}
            />
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

        {/* Job Code: readOnly, auto-generate */}
        <Col span={12}>
          <Form.Item label="Job Code" name="jobCode" rules={[{ required: true }]}>
            <Input  placeholder="Will be generated from Project & Date" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="User" name="user" rules={[{ required: true }]}>
            <Input placeholder="Enter user name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Total Hours" name="totalHours">
            <Input placeholder="Enter total hours" type="number" min={0} />
          </Form.Item>
        </Col>
      </Row>

      {/* ----- Tasks section ----- */}
      <div style={{ textAlign: 'right', margin: '12px 0' }}>
        <Button onClick={handleAddTask}>
          <PlusOutlined /> Add Task
        </Button>
      </div>
      <ServiceTaskTable
        tasks={tasks}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* ----- Remark ----- */}
      <Form.Item name="remark" label="Remark">
        <Input.TextArea rows={4} placeholder="Enter any additional remarks or notes" />
      </Form.Item>

      {/* Type / Status legend */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <h3>Type Code</h3>
          <p>I = Implementation</p>
          <p>T = Training</p>
          <p>O = Onsite Service</p>
        </Col>
        <Col span={12}>
          <h3>Status Code</h3>
          <p>0 = Complete</p>
          <p>1 = Follow Up</p>
        </Col>
      </Row>

      {/* ----- Charge section ----- */}
      <Form.Item style={{ marginBottom: 0 }}>
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
              <Form.Item name="extraChargeDescription" rules={[{ required: true }]} noStyle>
                <Input placeholder="Describe the extra charge" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form.Item>

      {/* ----- Signatures ----- */}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
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
