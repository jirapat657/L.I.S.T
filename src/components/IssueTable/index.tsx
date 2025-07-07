// src/components/IssueTable.tsx
import { Table, Tooltip, Button, Dropdown } from 'antd';
import { EyeOutlined, EditOutlined, CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { formatTimestamp } from '@/utils/dateUtils';
import type { Issue } from '@/types/projectDetail';
import type { MenuProps } from 'antd';
import type { Timestamp } from 'firebase/firestore';
import { useState } from 'react';

interface IssueTableProps {
  issues: Issue[];
  onDelete: (id: string) => void;
  loading?: boolean;
  onView?: (issueId: string, projectId: string) => void;
  onEdit?: (issueId: string, projectId: string) => void;
  onDuplicate?: (issueId: string, projectId: string) => void;
}

const IssueTable: React.FC<IssueTableProps> = ({ issues, onDelete, loading, onView, onEdit, onDuplicate }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 100;

  const columns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      render: (_: unknown, __: unknown, index: number) => issues.length - ((currentPage - 1) * pageSize + index),
    },
    { title: 'Issue Code', dataIndex: 'issueCode', key: 'issueCode' },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (timestamp: Timestamp | string | null | undefined) =>
        formatTimestamp(timestamp),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) =>
        text ? (
          <Tooltip title={text}>
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 250, // ปรับความกว้างตามที่ต้องการ
              }}
            >
              {text}
            </div>
          </Tooltip>
        ) : null,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) =>
        text ? (
          <Tooltip title={text}>
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 250, // ปรับความกว้างตามที่ต้องการ
              }}
            >
              {text}
            </div>
          </Tooltip>
        ) : null,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const getColor = (status: string) => {
          switch (status) {
            case 'Complete':
              return '#006B3F';
            case 'Inprogress':
              return '#FF8C00';
            case 'Cancel':
              return '#C20000';
            default:
              return '#292B2C';
          }
        };

        return <span style={{ color: getColor(status) }}>{status}</span>;
      },
    },
    {
          title: 'Start Date',
          dataIndex: 'startDate',
          key: 'startDate',
          render: (timestamp: Timestamp | string | null | undefined) =>
            formatTimestamp(timestamp),
        },
        {
          title: 'Due Date',
          dataIndex: 'dueDate',
          key: 'dueDate',
          render: (timestamp: Timestamp | string | null | undefined) =>
            formatTimestamp(timestamp),
        },
        {
          title: 'Complete Date',
          dataIndex: 'completeDate',
          key: 'completeDate',
          render: (timestamp: Timestamp | string | null | undefined) =>
            formatTimestamp(timestamp),
        },
        {
          title: 'On/Late Time',
          dataIndex: 'onLateTime',
          key: 'onLateTime',
          render: (value: string) => {
            const isOnTime = value.startsWith('On Time');
            const isLateTime = value.startsWith('Late Time');
            const color = isOnTime ? '#009B63' : isLateTime ? '#FC0A18' : undefined;
    
            return <span style={{ color }}>{value}</span>;
          },
        },
        { title: 'Developer', dataIndex: 'developer', key: 'developer' },
        { title: 'BA/Test', dataIndex: 'baTest', key: 'baTest' },
        { title: 'Remark', dataIndex: 'remark', key: 'remark' },
        { title: 'Additional Document', dataIndex: 'document', key: 'document' },
    // ...columns ที่เหลือ
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: Issue) => {
        const items: MenuProps['items'] = [
          { key: 'view', label: (<><EyeOutlined /> View</>) ,onClick: () => onView?.(record.id, record.projectId)}, 
          { key: 'edit', label: (<><EditOutlined /> Edit</>), onClick: () => onEdit?.(record.id, record.projectId) },
          { key: 'duplicate', label: (<><CopyOutlined /> Duplicate</>), onClick: () => onDuplicate?.(record.id, record.projectId) },
          { key: 'delete', label: (<><DeleteOutlined /> Delete</>), danger: true, onClick: () => onDelete(record.id) },
        ];
        return (
          <Dropdown
            menu={{
              items,
            }}
            trigger={['click']}
          >
            <Button><MoreOutlined /></Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={issues}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize,
        onChange: (page) => setCurrentPage(page),
      }}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default IssueTable;
