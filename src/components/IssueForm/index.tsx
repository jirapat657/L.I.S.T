// src/components/IssueForm/index.tsx
import React from 'react';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import type { IssueData } from '@/types/issue';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/api/user';


type Props = {
  issue: IssueData;
  form: any;
  disabled?: boolean;
};

const IssueForm: React.FC<Props> = ({ issue, form, disabled = true }) => {
  const safeDate = (date: any) =>
    date && date.toDate ? dayjs(date.toDate()) : null;

  const { data: users = [] } = useQuery({
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

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        issueCode: issue.issueCode,
        issueDate: safeDate(issue.issueDate),
        title: issue.title,
        description: issue.description,
        status: issue.status,
        startDate: safeDate(issue.startDate),
        dueDate: safeDate(issue.dueDate),
        completeDate: safeDate(issue.completeDate),
        developer: issue.developer,
        baTest: issue.baTest,
        remark: issue.remark,
        document: issue.document,
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Issue Code" name="issueCode">
            <Input disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Issue Date" name="issueDate">
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="Title" name="title">
            <Input disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} disabled={disabled}/>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Status" name="status">
            <Select disabled={disabled}>
              <Select.Option value="Open">Open</Select.Option>
              <Select.Option value="In Progress">In Progress</Select.Option>
              <Select.Option value="Closed">Closed</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Start Date" name="startDate">
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Due Date" name="dueDate">
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Complete Date" name="completeDate">
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Developer" name="developer">
                <Select
                showSearch
                placeholder="เลือก Developer"
                disabled={disabled}
                options={userOptions}
                />
            </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="BA/Test" name="baTest">
                <Select
                showSearch
                placeholder="เลือก BA/Test"
                disabled={disabled}
                options={userOptions}
                />
            </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Remark" name="remark">
            <Input.TextArea rows={4} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Additional Document" name="document">
            <Input.TextArea rows={4} disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default IssueForm;
