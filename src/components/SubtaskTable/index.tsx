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
  subtasks: Subtask[];
  userOptions: { label: string; value: string }[];
  onUpdate: (id: string, field: keyof Subtask, value: any) => void;
  onDelete: (id: string) => void;
  onView: (subtask: Subtask) => void;
  onDuplicate: (subtask: Subtask) => void;
  readOnly?: boolean;
}

const SubtaskTable: React.FC<SubtaskTableProps> = ({
  subtasks,
  userOptions,
  onUpdate,
  onDelete,
  onView,
  onDuplicate,
  readOnly = false,
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
      render: (text: string, record: Subtask) =>
        readOnly ? (
          <span>{text}</span>
        ) : (
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
      render: (value: any, record: Subtask) =>
        readOnly ? (
          value?.toDate ? (
            <span>{dayjs(value.toDate()).format('DD/MM/YY')}</span>
          ) : (
            '-'
          )
        ) : (
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
      render: (text: string, record: Subtask) =>
        readOnly ? (
          <span>{text}</span>
        ) : (
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
      render: (text: string, record: Subtask) =>
        readOnly ? (
          <span>{text}</span>
        ) : (
          <Input
            value={text}
            onChange={(e) => onUpdate(record.id, 'remark', e.target.value)}
          />
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_: any, record: Subtask) => {
        const items: MenuProps['items'] = [];

        items.push({
            key: 'view',
            label: (
            <div onClick={() => onView(record)}>
                <EyeOutlined /> View
            </div>
            ),
        });

        if (!readOnly) {
            items.push({
            key: 'duplicate',
            label: (
                <div onClick={() => onDuplicate(record)}>
                <PlusOutlined /> Duplicate
                </div>
            ),
            });

            items.push({
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
            });
        }

        return (
            <Dropdown menu={{ items }} trigger={['click']}>
            <Button>
                <MoreOutlined />
            </Button>
            </Dropdown>
        );
        },

    },
  ];

  return (
    <Table
      columns={columns as any}
      dataSource={subtasks}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default SubtaskTable;
