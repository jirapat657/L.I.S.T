import { Form, Input, DatePicker, Button, Upload, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';

interface ScopeFormValues {
  documentName: string;
  projectName: string;
  documentDate?: Dayjs;
  documentNumber?: string;
  optional: string;
  documentType: string;
  description?: string;
  upload?: UploadFile[];
}

const AddScopeOfWork = () => {
  const [form] = Form.useForm<ScopeFormValues>();
  const navigate = useNavigate();

  const onFinish = (values: ScopeFormValues) => {
    console.log('ส่งข้อมูล:', values);
    navigate('/scope'); // กลับไปหน้า Scope of Work
  };

  return (
    <div>
      <h2>เพิ่ม Scope of Work</h2>

      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Document Name*" name="documentName" rules={[{ required: true }]}> <Input /> </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Project Name*" name="projectName" rules={[{ required: true }]}> <Input /> </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Document Date" name="documentDate">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Document Number" name="documentNumber"> <Input /> </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Optional*" name="optional" rules={[{ required: true }]}> <Input /> </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Document Type*" name="documentType" rules={[{ required: true }]}> <Input /> </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Upload Files" name="upload">
              <Upload beforeUpload={() => false} multiple>
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => navigate('/scope')}>❌ ยกเลิก</Button>
          <Button type="primary" htmlType="submit">💾 บันทึก</Button>
        </div>
      </Form>
    </div>
  );
};

export default AddScopeOfWork;
