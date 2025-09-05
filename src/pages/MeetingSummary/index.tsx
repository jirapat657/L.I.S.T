// src/pages/MeetingSummary/index.tsx
import { Table, Button, Modal, List, Typography, Dropdown, message, Form, Input, DatePicker, Upload, Row, Col, Select, TimePicker } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllMeetingSummaries, deleteMeetingSummaryById, updateMeetingSummaryById, createMeetingSummary as createMeetingSummaryApi } from '@/api/meetingSummary';
import { deleteFileFromStorage } from '@/utils/deleteFileFromStorage';
import { useState } from 'react';
import type { MeetingSummaryData, FileData, MeetingSummaryPayload, MeetingSummaryFormValues } from '@/types/meetingSummary';
import { Timestamp } from 'firebase/firestore';
import { formatFirestoreDate } from '@/utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getUsers } from '@/api/user';  // import ฟังก์ชันการดึงข้อมูลผู้ใช้
import type { UserData } from '@/types/users';

const MeetingSummary = () => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileData[]>([]);
  const [editingMeetingSummary, setEditingMeetingSummary] = useState<MeetingSummaryData | null>(null);
  const [form] = Form.useForm();
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [searchMeetingNo, setSearchMeetingNo] = useState('');

  // ดึงข้อมูลผู้ใช้ทั้งหมดจาก Firestore
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserData[]>({
    queryKey: ['users'],
    queryFn: getUsers,
    // คุณสามารถตั้งการ retry หรือการกำหนดเวลา timeout ได้
  });

  // ดึงข้อมูล meetingSummaries โดยระบุประเภทให้ชัดเจน
  const { data: meetingSummaries = [], isLoading } = useQuery<MeetingSummaryData[]>({
    queryKey: ['meetingSummaries'],
    queryFn: getAllMeetingSummaries,
  });

  const queryClient = useQueryClient();

  const filteredMeetingSummaries = meetingSummaries.filter(meeting =>
    meeting.meetingNo.toLowerCase().includes(searchMeetingNo.toLowerCase())
  );

  // ฟังก์ชันแปลงUID เป็นชื่อ
  const getAttendeeNames = (attendeeIds: string[]) => {
    if (!attendeeIds || !users.length) return '-';
    
    return attendeeIds
      .map(id => {
        const user = users.find(u => u.id === id);
        return user ? user.userName : '';
      })
      .filter(name => name) // กรองชื่อที่ว่างออก
      .join(', '); // รวมชื่อด้วย comma
  };

  const columns = [
    {
      title: 'Meeting Date',
      dataIndex: 'meetingDate',
      render: (val: Timestamp | Date | null | undefined) => formatFirestoreDate(val),
    },
    { title: 'Meeting No.', dataIndex: 'meetingNo' },
    {
      title: 'Meeting Time',
      dataIndex: 'meetingTime',
      render: (val: string | Timestamp | null | undefined) => {
        if (!val) return '-';

        if (val instanceof Timestamp) {
          return dayjs(val.toDate()).format('HH:mm');
        }

        return val; // กรณีเป็น string
      },
    },
    { 
      title: 'Attendees', 
      dataIndex: 'attendees',
      render: (attendees: string[]) => getAttendeeNames(attendees),
    },
    {
        title: 'Meeting Topic',
        dataIndex: 'meetingTopic',
        render: (meetingTopic: string, record: MeetingSummaryData) => {
            // ตรวจสอบว่า record.files ไม่เป็น undefined และมีค่าอย่างน้อย 1 ไฟล์
            const hasFiles = Array.isArray(record.files) && record.files.length > 0;

            if (hasFiles) {
            // ถ้ามีไฟล์เดียวจะดาวน์โหลดเลย
            if (record.files && record.files.length === 1) {
                return (
                <Typography.Link href={record.files[0].url} target="_blank" rel="noopener noreferrer">
                    {meetingTopic}
                </Typography.Link>
                );
            } else if (record.files && record.files.length > 1) {
                // ถ้ามีหลายไฟล์ จะเปิด Modal ให้เลือก
                return (
                <Typography.Link onClick={() => {
                    setCurrentFiles(record.files || []); // ตรวจสอบไฟล์ที่ถูกอัปโหลด
                    setFileModalOpen(true);
                }}>
                    {meetingTopic}
                </Typography.Link>
                );
            }
            } else {
            return <span>{meetingTopic}</span>;
            }
        },
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: MeetingSummaryData) => {
        const items = [
          {
            key: 'view',
            label: (<><EyeOutlined /> View</>),
            onClick: () => {
              setEditingMeetingSummary(record);
              setUploadFiles(record.files || []);
              form.setFieldsValue({
                ...record,
                meetingDate: record.meetingDate ? dayjs(record.meetingDate.toDate()) : null,
                meetingTime: record.meetingTime ? dayjs(record.meetingTime.toDate()) : null, // ✅ แปลง Timestamp -> Dayjs
              });
            },
          },
          {
            key: 'delete',
            label: (<><DeleteOutlined /> Delete</>),
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button><MoreOutlined /></Button>
          </Dropdown>
        );
      },
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await deleteMeetingSummaryById(id);
      message.success('ลบสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['meetingSummaries'] });
    } catch (err) {
      console.error('ลบไม่สำเร็จ', err);
      message.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleRemoveFile = async (url: string) => {
    try {
      await deleteFileFromStorage(url);
      setUploadFiles((prev) => prev.filter((file) => file.url !== url));
      message.success('ลบไฟล์แล้ว');
    } catch (err) {
      console.error('ลบไฟล์ไม่สำเร็จ', err);
      message.error('ลบไฟล์ไม่สำเร็จ');
    }
  };

  const handleCustomUpload = async ({
    file,
    onSuccess,
    onError,
  }: UploadRequestOption) => {
    const storage = getStorage();
    const uniqueName = `${uuidv4()}-${(file as RcFile).name}`;
    const storageRef = ref(storage, `meetingSummaries/${uniqueName}`);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file as File);
      uploadTask.on(
        'state_changed',
        undefined,
        (error) => {
          onError?.(error as Error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newFile = { name: (file as RcFile).name, url: downloadURL };
          setUploadFiles((prev) => [...prev, newFile]);
          onSuccess?.(null, file);
        }
      );
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const { mutate: createMeetingSummary } = useMutation<void, Error, MeetingSummaryPayload>({
    mutationFn: createMeetingSummaryApi,
    onSuccess: () => {
      message.success('เพิ่มข้อมูลสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['meetingSummaries'] });
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    },
  });

  const { mutate: updateMeetingSummary } = useMutation<void, Error, { id: string, payload: MeetingSummaryPayload }>({
    mutationFn: ({ id, payload }) => updateMeetingSummaryById(id, payload),
    onSuccess: () => {
      message.success('อัปเดตสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['meetingSummaries'] });
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    },
  });

  const handleFinish = async (values: MeetingSummaryFormValues) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const displayName = currentUser?.displayName || currentUser?.email || 'ไม่ทราบผู้ใช้';

    const payload: MeetingSummaryPayload = {
      meetingDate: Timestamp.fromDate(dayjs(values.meetingDate).toDate()),
      meetingNo: values.meetingNo,
      meetingTime: Timestamp.fromDate(values.meetingTime.toDate()),
      attendees: values.attendees || '',
      meetingTopic: values.meetingTopic || 'Meeting',
      noteTaker: values.noteTaker || '',
      remark: values.remark || null,
      files: uploadFiles || [],
      createdAt: editingMeetingSummary?.createdAt ?? Timestamp.now(),
      createdBy: displayName
    };

    if (editingMeetingSummary?.id) {
      updateMeetingSummary({ id: editingMeetingSummary.id, payload });
    } else {
      createMeetingSummary(payload);
    }

    setEditingMeetingSummary(null);
    setUploadFiles([]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingMeetingSummary({
              id: '', meetingNo: '', meetingDate: Timestamp.now(), meetingTime: '', attendees: '',
              meetingTopic: '', noteTaker: '', remark: '', files: [], createdAt: Timestamp.now(),
              meetingChannel: '', meetingPlace: '', createdBy: ''
            });
            form.resetFields();
            setUploadFiles([]);
          }}
        >
          <PlusOutlined /> Add Meeting Summary
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input
            placeholder='Search by Meeting No.'
            value={searchMeetingNo}
            onChange={(e) => setSearchMeetingNo(e.target.value)}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredMeetingSummaries}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize :10,
          showTotal: (total) => <div style={{ position: 'absolute', left: '16px' }}>ทั้งหมด {total} รายการ</div>,
        }}
      />

      <Modal
        open={fileModalOpen}
        onCancel={() => setFileModalOpen(false)}
        title="เลือกไฟล์ที่ต้องการดาวน์โหลด"
        footer={null}
      >
        <List
          dataSource={currentFiles}
          renderItem={(file) => (
            <List.Item key={file.url}>
              <Typography.Link href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name}
              </Typography.Link>
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        open={!!editingMeetingSummary}
        onCancel={() => setEditingMeetingSummary(null)}
        title={editingMeetingSummary?.id ? (<><EditOutlined /> แก้ไข Meeting Summary</>) : (<><PlusOutlined /> เพิ่ม Meeting Summary</>)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ 
            meetingTopic: 'Meeting',
            meetingDate: dayjs(), // ตั้งค่าเริ่มต้นเป็นวันปัจจุบัน
            meetingTime: editingMeetingSummary?.meetingTime 
              ? dayjs(editingMeetingSummary.meetingTime, 'HH:mm')
              : undefined
         }}
        >
          <Form.Item name="meetingDate" label="Meeting Date" rules={[{ required: true }]}>
            <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"  // กำหนดรูปแบบวันที่เป็น DD/MM/YYYY
            />
            </Form.Item>
          <Form.Item name="meetingNo" label="Meeting No." rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item
            name="meetingTime"
            label="Meeting Time"
            rules={[{ required: true, message: 'กรุณาเลือกเวลา' }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item name="meetingChannel" label="Meeting Channel">
            <Select defaultValue="Online">
                <Select.Option value="Online">Online</Select.Option>
                <Select.Option value="Onsite">Onsite</Select.Option>
                <Select.Option value="Hybrid">Hybrid</Select.Option>
            </Select>
            </Form.Item>

          <Form.Item name="meetingPlace" label="Meeting Place/Platform"><Input /></Form.Item>
          <Form.Item name="meetingTopic" label="Meeting Topic"><Input /></Form.Item>
          {/* Dropdown สำหรับ Note Taker */}
            <Form.Item name="noteTaker" label="Note Taker" >
            <Select
                placeholder="Select Note Taker"
                loading={loadingUsers}
                options={users.map(user => ({ label: user.userName, value: user.id }))}
            />
            </Form.Item>
          {/* Dropdown สำหรับ Attendees */}
            <Form.Item name="attendees" label="Attendees" >
            <Select
                mode="multiple"
                placeholder="Select Attendees"
                loading={loadingUsers}
                options={users.map(user => ({ label: user.userName, value: user.id }))}
            />
            </Form.Item>
          <Form.Item name="remark" label="Remark"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="Upload Files">
            <Upload
              customRequest={handleCustomUpload}
              listType="text"
              showUploadList={false}
              multiple
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
            <List
              size="small"
              bordered
              dataSource={uploadFiles}
              style={{ marginTop: 12 }}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFile(file.url)}
                    />,
                  ]}
                >
                  {file.name}
                </List.Item>
              )}
            />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary" block>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={fileModalOpen}
        onCancel={() => setFileModalOpen(false)}
        title="เลือกไฟล์ที่ต้องการดาวน์โหลด"
        footer={null}
        >
        <List
            dataSource={currentFiles}
            renderItem={(file) => (
            <List.Item key={file.url}>
                <Typography.Link href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name}
                </Typography.Link>
            </List.Item>
            )}
        />
        </Modal>

    </div>
  );
};

export default MeetingSummary;
