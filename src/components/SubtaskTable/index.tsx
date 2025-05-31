// src/components/SubtaskTable/index.tsx
import React from 'react';
import {
  Table,
  Input,
  DatePicker,
  Select,
  Dropdown,
  Button,
  Popconfirm,
} from 'antd';
import { DeleteOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { Subtask } from '@/types/issue';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';



interface SubtaskTableProps {
  subtasks: Subtask[]; // ✅ คาดว่าถูก sort มาแล้ว (newest → oldest)
  userOptions: { label: string; value: string }[];
  onUpdate: (id: string, field: keyof Subtask, value: any) => void;
  onDelete: (id: string) => void;
  onView: (subtask: Subtask) => void;
  onDuplicate: (subtask: Subtask) => void; // ✅ ใหม่
}

const SubtaskTable: React.FC<SubtaskTableProps> = ({
  subtasks,
  userOptions,
  onUpdate,
  onDelete,
  onView,
onDuplicate,
}) => {
  const columns = [
    {
      title: 'No.',
      render: (_: any, __: any, index: number) => subtasks.length - index,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: (value: any) =>
        value?.toDate ? dayjs(value.toDate()).format('DD/MM/YY') : '-',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (text: string, record: Subtask) => (
        <Input.TextArea
          rows={1}
          value={text}
          onChange={(e) => onUpdate(record.id, 'details', e.target.value)}
        />
      ),
    },
    {
      title: 'Complete Date',
      dataIndex: 'completeDate',
      render: (value: any, record: Subtask) => (
        <DatePicker
          format="DD/MM/YY"
          value={
            value
              ? value instanceof Timestamp
                ? dayjs(value.toDate())
                : dayjs(value)
              : null
          }
          onChange={(date) =>
            onUpdate(
              record.id,
              'completeDate',
              date ? Timestamp.fromDate(date.toDate()) : null
            )
          }
        />
      ),
    },
    {
      title: 'BA/Test',
      dataIndex: 'baTest',
      render: (text: string, record: Subtask) => (
        <Select
          value={text}
          onChange={(val) => onUpdate(record.id, 'baTest', val)}
          showSearch
          style={{ width: 150 }}
          options={userOptions}
          placeholder="เลือก BA/Test"
        />
      ),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      render: (text: string, record: Subtask) => (
        <Input
          value={text}
          onChange={(e) => onUpdate(record.id, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text: string, record: Subtask) => (
        <Select
          value={text}
          onChange={(val) => onUpdate(record.id, 'status', val)}
          style={{ width: 120 }}
          options={[
            { label: 'Awaiting', value: 'Awaiting' },
            { label: 'Complete', value: 'Complete' },
            { label: 'Fail', value: 'Fail' },
          ]}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Subtask) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            label: (
              <>
                <EyeOutlined /> View
              </>
            ),
            onClick: () => onView(record),
          },
          {
            key: 'duplicate',
            label: (
                <span>
                <PlusOutlined /> Duplicate
                </span>
            ),
            onClick: () => onDuplicate(record), // ✅ ต้องอยู่ใน scope ที่รู้จัก onDuplicate
            },

          {
            key: 'delete',
            label: (
              <Popconfirm
                title="ยืนยันการลบ Subtask นี้?"
                onConfirm={() => onDelete(record.id)}
                okText="ลบ"
                cancelText="ยกเลิก"
              >
                <DeleteOutlined /> Delete
              </Popconfirm>
            ),
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button >
              <MoreOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={subtasks}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default SubtaskTable;
