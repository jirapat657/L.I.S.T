// src/pages/Projects/AddIssueForm/index.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Select,
  message,
  Divider,
  Dropdown,
  Menu,
  Table,
  Modal
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getAllUsers } from '@/api/user';
import { Timestamp } from 'firebase/firestore';
import { addIssue } from '@/api/issue';
import type { FormValues, RowData} from '@/types/issue';
import { useQuery } from '@tanstack/react-query';
import { calculateOnLateTime } from '@/utils/dateUtils';
import { DeleteOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';

const AddIssueForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<RowData[]>([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [detailInput, setDetailInput] = useState('');

  const statusOptions = ['Awaiting', 'Inprogress', 'Complete', 'Cancel'];

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });
  const userOptions = React.useMemo(() => {
    const uniqueUsers = users.filter(
      (user, index, self) =>
        index === self.findIndex((u) => u.userName === user.userName)
    );
    return uniqueUsers.map((user) => ({
      value: user.userName,
      label: user.userName,
    }));
  }, [users]);

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error loading users</div>;

  const handleAddRow = () => {
    const newRow: RowData = {
      key: `${Date.now()}`,
      details: '',
      showFull: false,
      date: dayjs(),
      status: 'Awaiting',
    };
    setData((prev) => [...prev, newRow]);
  };

  const handleChange = (key: string, field: keyof RowData, value: any) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.key === key) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'details' && value.trim()) {
            updatedRow.showFull = true;
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleViewDetails = (record: RowData) => {
    setEditingKey(record.key);
    setDetailInput(record.details);
    setDetailModalOpen(true);
  };

  const handleUpdateDetail = () => {
    if (!editingKey) return;

    setData((prev) =>
      prev.map((row) =>
        row.key === editingKey ? { ...row, details: detailInput, showFull: true } : row
      )
    );
    setDetailModalOpen(false);
  };


  const handleDelete = (key: string) => {
    setData((prev) => prev.filter((row) => row.key !== key));
    message.success('ลบแถวแล้ว');
  };

  const onFinish = async () => {
    const values = form.getFieldsValue(); // ✅ ดึงค่าล่าสุดทั้งหมด
    try {
      const { startDate, dueDate, completeDate, ...rest } = values;

      const onLateTime = calculateOnLateTime(completeDate, dueDate); // ✅ ใช้ยูทิลฟังก์ชัน

      const issuePayload = {
        ...rest,
        projectId: id!,
        issueDate: values.issueDate ? Timestamp.fromDate(values.issueDate.toDate()) : Timestamp.now(),
        startDate: startDate ? Timestamp.fromDate(startDate.toDate()) : null,
        dueDate: dueDate ? Timestamp.fromDate(dueDate.toDate()) : null,
        completeDate: completeDate ? Timestamp.fromDate(completeDate.toDate()) : null,
        onLateTime,
        createdAt: Timestamp.now(),
      };

      const subtasks = data
        .filter((row) => row.details.trim()) // ✅ เฉพาะ row ที่มี details
        .map((row) => ({
          details: row.details,
          date: row.date ? Timestamp.fromDate(row.date.toDate()) : null,
          completeDate: row.completeDate ? Timestamp.fromDate(row.completeDate.toDate()) : null,
          baTest: row.baTest,
          status: row.status,
          remark: row.remark,
        }));

      await addIssue(issuePayload, subtasks);
      message.success('เพิ่ม Issue สำเร็จ');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error adding issue:', error);
      message.error('เกิดข้อผิดพลาดในการเพิ่ม Issue');
    }
  };

  const columns = [
    {
      title: 'No.',
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: (value: Dayjs, record: RowData) => (
        <DatePicker value={value} onChange={(date) => handleChange(record.key, 'date', date)} />
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (text: string, record: RowData) => (
        <Input
          value={text}
          placeholder="Enter detail"
          onChange={(e) => handleChange(record.key, 'details', e.target.value)}
        />
      ),
    },
    {
      title: 'Complete Date',
      dataIndex: 'completeDate',
      render: (_: any, record: RowData) =>
        record.details ? (
          <DatePicker
            value={record.completeDate}
            onChange={(date) => handleChange(record.key, 'completeDate', date)}
          />
        ) : null,
    },
    {
      title: 'BA/Test',
      dataIndex: 'baTest',
      render: (_: any, record: RowData) =>
        record.details ? (
          <Select
            value={record.baTest}
            onChange={(val) => handleChange(record.key, 'baTest', val)}
            options={userOptions}
            style={{ width: 120 }}
          />
        ) : null,
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      render: (_: any, record: RowData) =>
        record.details ? (
          <Input
            value={record.remark}
            onChange={(e) => handleChange(record.key, 'remark', e.target.value)}
          />
        ) : null,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_: any, record: RowData) =>
        record.details ? (
          <Select
            value={record.status}
            onChange={(val) => handleChange(record.key, 'status', val)}
            options={statusOptions.map((s) => ({ label: s, value: s }))}
            style={{ width: 120 }}
          />
        ) : null,
    },
    {
      title: '',
      render: (_: any, record: RowData) => (
        <Dropdown
          overlay={
            <Menu
              onClick={({ key }) => {
                if (key === 'delete') handleDelete(record.key);
                else if (key === 'view') handleViewDetails(record);
              }}
              items={[
                { key: 'view', label: (<><EyeOutlined /> View</>) },
                { key: 'delete', label: (<><DeleteOutlined /> Delete</>), danger: true },
              ]}
            />
          }
          trigger={['click']}
        >
          <Button size="small"><MoreOutlined /></Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <h2>เพิ่ม Issue ใหม่ในโปรเจกต์ #{id}</h2>

      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        initialValues={{ issueDate: dayjs() }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Issue Code" name="issueCode" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Issue Date" name="issueDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Title" name="title" ><Input /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Description" name="description" ><Input.TextArea rows={4}/></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Status" name="status" rules={[{ required: true }]} initialValue="Awaiting">
              <Select placeholder="เลือกสถานะ"
              onChange={(value) => {
                const now = dayjs();
                if (value === 'Inprogress') {
                  form.setFieldsValue({ startDate: now });
                } else if (value === 'Complete') {
                  form.setFieldsValue({ completeDate: now });
                }
              }}>
                {statusOptions.map((s) => (
                  <Select.Option key={s} value={s}>{s}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Start Date" name="startDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Due Date" name="dueDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Complete Date" name="completeDate" ><DatePicker format="DD/MM/YY" style={{ width: '100%' }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Developer" name="developer" >
              <Select showSearch placeholder="เลือก Developer" options={userOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="BA/Test" name="baTest" >
              <Select showSearch placeholder="เลือก BA/Test" options={userOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Remark" name="remark" ><Input.TextArea rows={4} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Additional Document" name="document" ><Input.TextArea rows={4}/></Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Child Work Item</Divider>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Button onClick={handleAddRow}><PlusOutlined /> Add Subtask</Button>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="key"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
        <Modal
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          onOk={handleUpdateDetail}
          title="แก้ไขรายละเอียด Subtask"
          width="80%" // ✅ เต็มหน้าจอเกือบสุด
          bodyStyle={{ height: '60vh' }} // ✅ เพิ่มความสูง
        >
          <Input.TextArea
            rows={15}
            value={detailInput}
            onChange={(e) => setDetailInput(e.target.value)}
            style={{ height: '100%' }}
          />
        </Modal>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => navigate(`/projects/${id}`)}>ยกเลิก</Button>
          <Button type="primary" htmlType="submit">บันทึก</Button>
        </div>
      </Form>
    </div>
  );
};

export default AddIssueForm;
