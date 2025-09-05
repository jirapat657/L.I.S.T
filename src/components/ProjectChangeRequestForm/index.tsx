// src/components/ProjectChangeRequestForm/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Table,
  Popconfirm,
  Divider,
  Checkbox,
  type FormInstance,
  message,
  Select,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';

// ---- ใช้ Type จากโฟลเดอร์ types ----
import type {
  ChangeRequestTask,
  ProjectChangeRequest_Firestore,
  ProjectChangeRequestDoc,
} from '@/types/projectChangeRequest';

// ---- External APIs/Types ----
import type { ProjectData } from '@/types/project';
import { getProjects } from '@/api/project';
import { getChangeRequestsByPrefix } from '@/api/projectChangeRequest';

// ---- Form Values (ค่าที่อยู่บนฟอร์ม ก่อนแปลงเป็น Firestore) ----
type FormValues = {
  projectId?: string;     // ใช้สำหรับ generate jobCode
  projectName?: string;   // เก็บชื่อไว้ใน Firestore
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

// =================== Subtable: Tasks ===================
const ChangeRequestTaskTable: React.FC<{
  tasks: ChangeRequestTask[];
  onUpdate: <K extends keyof ChangeRequestTask>(id: string, field: K, value: ChangeRequestTask[K]) => void;
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
      render: (_: unknown, record: ChangeRequestTask) => (
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

// =================== Main Form ===================
interface ProjectChangeRequestFormProps {
  initialValues?: Partial<ProjectChangeRequest_Firestore>;
  onFinish: (values: ProjectChangeRequest_Firestore) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  formInstance?: FormInstance<FormValues>;
  /** โหมดฟอร์ม: create จะ auto-generate jobCode, edit/duplicate จะไม่ gen ทับ */
  mode?: 'create' | 'edit' | 'duplicate';
}

const defaultInitialValues: Partial<ProjectChangeRequest_Firestore> = {};

const ProjectChangeRequestForm: React.FC<ProjectChangeRequestFormProps> = ({
  initialValues = defaultInitialValues,
  onFinish,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save',
  formInstance,
  mode = 'create',
}) => {
  const [form] = Form.useForm<FormValues>(formInstance);
  const [tasks, setTasks] = useState<ChangeRequestTask[]>([]);

  // ===== โหลดโปรเจกต์สำหรับ Select =====
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectData[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: p.projectName,
        value: p.projectId, // ใช้ projectId เป็นค่า
      })),
    [projects]
  );

  const idToName = useMemo(
    () => new Map(projects.map((p) => [p.projectId, p.projectName])),
    [projects]
  );

  // ===== Init form & tasks =====
  useEffect(() => {
    // Table tasks
    const initialTasks =
      initialValues.tasks?.map((task) => ({
        ...task,
        id: task.id || `temp-${Math.random()}`,
      })) || [];
    setTasks(initialTasks);

    // Form values (convert timestamps → dayjs)
    const processedValues: FormValues = {
      ...initialValues,
      date: initialValues.date ? dayjs((initialValues.date as Timestamp).toDate()) : undefined,
      chargeTypes: initialValues.chargeTypes || [],
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

    // ถ้ามี projectName แต่ยังไม่มี projectId ให้ลองจับคู่
    if (!processedValues.projectId && processedValues.projectName && projects.length) {
      const found = projects.find((p) => p.projectName === processedValues.projectName);
      if (found) processedValues.projectId = found.projectId;
    }

    form.resetFields();
    form.setFieldsValue(processedValues);

    // ให้วันนี้อัตโนมัติในโหมด create หากยังไม่มี date
    if (mode === 'create') {
      const current = form.getFieldValue('date');
      if (!current) form.setFieldsValue({ date: dayjs() });
    }
  }, [initialValues, projects, form, mode]);

  // ===== Watchers สำหรับ auto-generate jobCode =====
  const watchedProjectId = Form.useWatch<string | undefined>('projectId', form);
  const watchedDate = Form.useWatch<dayjs.Dayjs | undefined>('date', form);

  useEffect(() => {
    // สร้างเฉพาะตอน create เท่านั้น (edit/duplicate ไม่ gen ทับ)
    if (mode !== 'create') return;
    if (!watchedProjectId) return;

    const d = watchedDate || dayjs();
    const ddMMyyyy = d.format('DDMMYYYY');
    const prefix = `${watchedProjectId}-${ddMMyyyy}`; // {projectId}-{DDMMYYYY}

    (async () => {
      try {
        // Query เฉพาะ collection PCR
        const existing = await getChangeRequestsByPrefix(prefix);
        const maxRun = (existing || []).reduce((mx: number, doc: ProjectChangeRequestDoc) => {
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
  }, [watchedProjectId, watchedDate, mode, form]);

  // ===== Helpers =====
  function hasToDate(obj: unknown): obj is { toDate: () => Date } {
    return typeof obj === 'object' && obj !== null && 'toDate' in obj && typeof (obj as { toDate: unknown }).toDate === 'function';
  }

  const toTimestamp = (
    val: dayjs.Dayjs | Timestamp | Date | string | null | undefined
  ): Timestamp | null => {
    if (!val) return null;
    if (val instanceof Timestamp) return val;
    if (hasToDate(val)) return Timestamp.fromDate(val.toDate());
    return Timestamp.fromDate(new Date(val as string | Date));
  };

  // ===== Submit =====
  const handleFormSubmit = (values: FormValues) => {
    const payload: ProjectChangeRequest_Firestore = {
      id: initialValues.id || '',
      // เก็บชื่อไว้ใน Firestore ตามเดิม แต่ UI เลือกด้วย projectId
      projectName: values.projectName || (values.projectId ? idToName.get(values.projectId) || '' : ''),
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

  // ===== Tasks CRUD =====
  const handleAddTask = () =>
    setTasks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, sequence: '', description: '', requestedBy: '', approved: '' },
    ]);

  const handleUpdateTask = <K extends keyof ChangeRequestTask>(
    id: string,
    field: K,
    value: ChangeRequestTask[K]
  ) =>
    setTasks((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const handleDeleteTask = (id: string) =>
    setTasks((prev) => prev.filter((row) => row.id !== id));

  // watch สำหรับ Extra Charge
  const chargeTypes = Form.useWatch<('included' | 'free' | 'extra')[]>('chargeTypes', form);

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleFormSubmit}
      initialValues={{ date: dayjs(), chargeTypes: [] }}
    >
      {/* ซ่อน projectId เพื่อใช้ generate jobCode */}
      <Form.Item name="projectId" hidden>
        <Input />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          {/* Project Select: แสดงชื่อ (label) แต่เซ็ตทั้ง projectId+projectName */}
          <Form.Item
            label="Project"
            name="projectName"
            required
            tooltip="เลือกโปรเจกต์จาก LIMProjects (ระบบจะตั้งค่า projectId เพื่อสร้าง Job Code)"
          >
            <Select
              placeholder="Select project"
              options={projectOptions}
              loading={isProjectsLoading}
              showSearch
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
            label="Project Stage"
            name="projectStage"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter stage" />
          </Form.Item>
        </Col>

        {/* Job Code: auto-generate (create mode) */}
        <Col span={12}>
          <Form.Item label="Job Code" name="jobCode" rules={[{ required: true }]}>
            <Input placeholder="Will be generated from Project & Date" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
          </Form.Item>
        </Col>
      </Row>

      {/* Tasks */}
      <div style={{ textAlign: 'right', margin: '12px 0' }}>
        <Button onClick={handleAddTask}>
          <PlusOutlined /> Add Item
        </Button>
      </div>
      <ChangeRequestTaskTable tasks={tasks} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />

      {/* Remark */}
      <Form.Item name="remark" label="Remark">
        <Input.TextArea rows={4} placeholder="Enter any additional remarks or notes" />
      </Form.Item>

      {/* Charge Section */}
      <Form.Item style={{ marginBottom: 0 }}>
        <Row gutter={8} align="middle">
          <Col>
            <Form.Item name="chargeTypes" noStyle>
              <Checkbox.Group>
                <Row gutter={16}>
                  <Col>
                    <Checkbox value="included">Included in Agreement</Checkbox>
                  </Col>
                  <Col>
                    <Checkbox value="free">Free of Charge</Checkbox>
                  </Col>
                  <Col>
                    <Checkbox value="extra">Extra Charge</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
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

      {/* Parties */}
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

      {/* Footer */}
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

export default ProjectChangeRequestForm;
