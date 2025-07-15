// src/components/IssueForm/index.tsx
import React from 'react';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import type { RuleObject } from 'antd/es/form';
import type { IssueData } from '@/types/issue';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/api/user';
import type { FormInstance } from 'antd/es/form';
import { safeDate } from '@/utils/dateUtils';
import { priorityOptions, typeOptions } from '@/pages/Projects/AddIssueForm/helper';
import { getBATestOptions, getDeveloperOptions } from '@/utils/userOptions';
import { statusOptions } from '@/constants/searchFilters';

type Props = {
  issue: IssueData;
  form: FormInstance;
  disabled?: boolean;
};

const IssueForm: React.FC<Props> = ({ issue, form, disabled = true }) => {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const developerOptions = React.useMemo(() => getDeveloperOptions(users), [users]);
  const baTestOptions = React.useMemo(() => getBATestOptions(users), [users]);

  const validateStartDate = (_: RuleObject, value: dayjs.Dayjs) => {
    const dueDate = form.getFieldValue('dueDate');
    if (value && dueDate && value.isAfter(dueDate)) {
      return Promise.reject(new Error('Start Date must be before or equal to Due Date'));
    }
    return Promise.resolve();
  };

  const validateDueDate = (_: RuleObject, value: dayjs.Dayjs) => {
    const startDate = form.getFieldValue('startDate');
    if (value && startDate && value.isBefore(startDate)) {
      return Promise.reject(new Error('Due Date must be after or equal to Start Date'));
    }
    return Promise.resolve();
  };

  const validateCompleteDate = (_: RuleObject, value: dayjs.Dayjs) => {
    const startDate = form.getFieldValue('startDate');
    if (value && startDate && value.isBefore(startDate)) {
      return Promise.reject(new Error('Complete Date must be after or equal to Start Date'));
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        issueCode: issue.issueCode,
        issueDate: safeDate(issue.issueDate),
        title: issue.title,
        description: issue.description,
        type: issue.type,           
        priority: issue.priority,
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
          <Form.Item label="Issue Code" name="issueCode" rules={[{ required: true }]}>
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

        <Col span={12}>
          <Form.Item label="Type" name="type">
            <Select disabled={disabled} showSearch placeholder="Select Type" options={typeOptions} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Priority" name="priority">
            <Select disabled={disabled} showSearch placeholder="Select Priority" options={priorityOptions} />
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
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select 
              disabled={disabled} 
              options={statusOptions}
              onChange={(value) => {
                const now = dayjs();
                if (value === 'Inprogress') {
                  form.setFieldsValue({ startDate: now });
                } else if (value === 'Complete') {
                  form.setFieldsValue({ completeDate: now });
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item 
            label="Start Date" 
            name="startDate"
            rules={[
              { validator: validateStartDate },
            ]}
          >
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
              onChange={() => {
                form.validateFields(['dueDate', 'completeDate']);
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item 
            label="Due Date" 
            name="dueDate"
            rules={[
              { validator: validateDueDate },
            ]}
          >
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
              onChange={() => {
                form.validateFields(['startDate']);
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item 
            label="Complete Date" 
            name="completeDate"
            rules={[
              { validator: validateCompleteDate },
            ]}
          >
            <DatePicker
              format="DD/MM/YY"
              disabled={disabled}
              style={{ width: '100%' }}
              onChange={() => {
                form.validateFields(['startDate']);
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Developer" name="developer">
            <Select
              showSearch
              placeholder="Select Developer"
              disabled={disabled}
              options={developerOptions}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="BA/Test" name="baTest">
            <Select
              showSearch
              placeholder="Select BA/Test"
              disabled={disabled}
              options={baTestOptions}
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