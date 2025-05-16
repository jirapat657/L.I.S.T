//template AddIssueForm
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, DatePicker, Button, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';

interface FormValues {
  issueCode: string;
  issueDate?: Dayjs;
  title?: string;
  description?: string;
  status?: string;
  startDate?: Dayjs;
  dueDate?: Dayjs;
  completeDate?: Dayjs;
  onLateTime?: string;
  developer?: string;
  baTest?: string;
  remark?: string;
  document?: string;
}

const AddIssueForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const onFinish = (values: FormValues) => {
    console.log('ค่าที่ส่ง:', values);
    // TODO: ส่งข้อมูลไปยัง backend
    navigate(`/projects/${id}`);
  };

  return (
    <div>
      <h2>เพิ่ม Issue ใหม่ในโปรเจกต์ #{id}</h2>

      <Form layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Issue Code" name="issueCode" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Issue Date" name="issueDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Title" name="title">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Description" name="description">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Status" name="status">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Due Date" name="dueDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Complete Date" name="completeDate">
              <DatePicker format="DD/MM/YY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="On/Late Time" name="onLateTime">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Developer" name="developer">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="BA/Test" name="baTest">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Remark" name="remark">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Additional Document" name="document">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* ปุ่มบันทึก/ยกเลิก */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => navigate(`/projects/${id}`)}>❌ ยกเลิก</Button>
          <Button type="primary" htmlType="submit">💾 บันทึก</Button>
        </div>
      </Form>
    </div>
  );
};

export default AddIssueForm;
