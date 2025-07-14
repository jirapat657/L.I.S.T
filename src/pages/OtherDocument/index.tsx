// src/pages/OtherDocument/index.tsx
import { Table, Button, Modal, List, Typography, Dropdown, message, Form, Input, DatePicker, Upload, Select, Pagination, Row, Col } from 'antd';
import type { MenuProps } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllOtherDocuments, deleteOtherDocumentById, updateOtherDocumentById, createOtherDocument, getUniqueDocumentTypes } from '@/api/otherDocument';
import { deleteFileFromStorage } from '@/utils/deleteFileFromStorage';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import type { OtherDocumentData, FileData, OtherDocumentPayload, OtherDocumentFormValues } from '@/types/otherDocument';
import { Timestamp } from 'firebase/firestore';
import { formatFirestoreDate } from '@/utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';
import { useMutation } from '@tanstack/react-query';

const OtherDocument = () => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileData[]>([]);
  const [editingDocument, setEditingDocument] = useState<OtherDocumentData | null>(null);
  const [form] = Form.useForm();
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [searchFileName, setSearchFileName] = useState('');
  const [searchProjectsName, setSearchProjectsName] = useState('');
  const [docTypes, setDocTypes] = useState<string[]>([]);  // สถานะสำหรับเก็บประเภทเอกสาร
      const [isNewType, setIsNewType] = useState(false);  // ใช้สำหรับควบคุมการแสดงช่องกรอกประเภทใหม่

  const { data: otherDocuments = [], isLoading } = useQuery({
    queryKey: ['otherDocuments'],
    queryFn: getAllOtherDocuments,
  });

  const queryClient = useQueryClient();

  const filteredDocuments = otherDocuments.filter(document =>
    document.description.toLowerCase().includes(searchFileName.toLowerCase()) &&
    document.project.toLowerCase().includes(searchProjectsName.toLowerCase())
  );

    useEffect(() => {
        const fetchDocTypes = async () => {
        try {
            const types = await getUniqueDocumentTypes();  // ดึงประเภทเอกสารที่ไม่ซ้ำ
            setDocTypes(types);
        } catch (err) {
            console.error('Error fetching document types:', err);
            message.error('เกิดข้อผิดพลาดในการดึงประเภทเอกสาร');
        }
        };

        fetchDocTypes();
    }, []);

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'files',
      render: (files: FileData[], record: OtherDocumentData) => {
        const { description } = record;

        if (files.length === 0) {
          return <span style={{ cursor: 'not-allowed' }}>{description || 'No File'}</span>;
        }

        if (files.length === 1) {
          return (
            <Typography.Link onClick={() => window.open(files[0].url, '_blank')}>
              {description || 'No Description'}
            </Typography.Link>
          );
        }

        return (
          <Typography.Link onClick={() => {
            setCurrentFiles(files);
            setFileModalOpen(true);
          }}>
            {description || 'No Description'}
          </Typography.Link>
        );
      },
    },
    {
      title: 'Upload Date',
      dataIndex: 'docDate',
      render: (val: Timestamp | Date | null | undefined) => formatFirestoreDate(val),
    },
    { title: 'Project', dataIndex: 'project' },
    {
        title: 'Added By',  // คอลัมน์ใหม่ที่เพิ่มขึ้น
        dataIndex: 'createBy',  // ดึงข้อมูลจาก field createBy ใน Firestore
        render: (createBy: string) => createBy || 'ไม่ทราบผู้ใช้',  // หาก createBy มีค่า, แสดงชื่อผู้ใช้
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_: unknown, record: OtherDocumentData) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            label: (<><EyeOutlined /> View/Edit</>),
            onClick: () => {
              setEditingDocument(record);
              setUploadFiles(record.files || []);
              form.setFieldsValue({
                ...record,
                docDate: record.docDate ? dayjs(record.docDate.toDate()) : null,
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
            <Button ><MoreOutlined /></Button>
          </Dropdown>
        );
      },
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await deleteOtherDocumentById(id);
      message.success('ลบสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['otherDocuments'] });
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
    const storageRef = ref(storage, `otherDocuments/${uniqueName}`);

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

    const { mutate: createDocument } = useMutation<void, Error, OtherDocumentPayload>({
    mutationFn: createOtherDocument, // ใช้ฟังก์ชันการสร้างเอกสาร
    onSuccess: () => {
        message.success('เพิ่มข้อมูลสำเร็จ');
        queryClient.invalidateQueries({ queryKey: ['otherDocuments'] });
    },
    onError: () => {
        message.error('เกิดข้อผิดพลาดในการบันทึก');
    },
    });

    const { mutate: updateDocument } = useMutation<void, Error, { id: string, payload: OtherDocumentPayload }>({
    mutationFn: ({ id, payload }) => updateOtherDocumentById(id, payload), // เรียกใช้ฟังก์ชันการอัปเดตเอกสาร
    onSuccess: () => {
        message.success('อัปเดตสำเร็จ');
        queryClient.invalidateQueries({ queryKey: ['otherDocuments'] });
    },
    onError: () => {
        message.error('เกิดข้อผิดพลาดในการบันทึก');
    },
    });

  const handleFinish = async (values: OtherDocumentFormValues) => {
    const auth = getAuth();  // ดึงข้อมูลจาก Firebase Authentication
    const currentUser = auth.currentUser;  // ดึงข้อมูลผู้ใช้ที่เข้าสู่ระบบ
    const displayName = currentUser?.displayName || currentUser?.email || 'ไม่ทราบผู้ใช้';  // ใช้ displayName หรือ email

   // ถ้าผู้ใช้เลือก "เพิ่มประเภทใหม่" และกรอกประเภทใหม่
    const docType = isNewType ? values.newType : values.docType;  // ใช้ `newType` ถ้าผู้ใช้กรอกประเภทใหม่

   // ตรวจสอบว่า `docType` มีค่า และไม่เป็น undefined หรือ null
    if (!docType || docType.trim() === '') {
        message.error('กรุณากรอกประเภทเอกสาร');
        return;
    }

    const payload: OtherDocumentPayload = {
        ...values,
        files: uploadFiles,
        // ตรวจสอบว่า docDate เป็น Date ของ JavaScript หรือ Firebase Timestamp
        docDate: values.docDate  ? Timestamp.fromDate(values.docDate.toDate()) : null,  // แปลง Date เป็น Timestamp
        createdAt: editingDocument?.createdAt ?? Timestamp.now(),
        createBy: displayName,  // เก็บชื่อผู้ที่เพิ่มเอกสาร
        remark: values.remark || null,  // ถ้า remark เป็น undefined, ให้เป็น null แทน
        docType,  // ใช้ docType ที่กรอก
    };

    if (editingDocument?.id) {
        // อัปเดตเอกสาร
        updateDocument({ id: editingDocument.id, payload });
    } else {
        // สร้างเอกสารใหม่
        createDocument(payload);
    }

    setEditingDocument(null);
    setUploadFiles([]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingDocument({
              id: '', docNo: '', docDate: null, docType: '', project: '', customer: '',
              description: '', remark: '', files: [], createdAt: Timestamp.now()
            });
            form.resetFields();
            setUploadFiles([]);
          }}
        >
          <PlusOutlined /> Add Other Document
        </Button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          onClick={() => {
            setSearchFileName('')
            setSearchProjectsName('')
          }}
        >
          <SyncOutlined /> Clear Search
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input
            placeholder='Search by File Name'
            value={searchFileName}
            onChange={(e) => setSearchFileName(e.target.value)}
          />
        </Col>
        <Col span={12}>
          <Input
            placeholder='Search by Project Name'
            value={searchProjectsName}
            onChange={(e) => setSearchProjectsName(e.target.value)}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredDocuments}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={false} // ❗ ปิด pagination ของ Table
        footer={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
            <div>ทั้งหมด {filteredDocuments.length} รายการ</div>
            <Pagination
              showSizeChanger={false}
            />
          </div>
        )}
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
        open={!!editingDocument}
        onCancel={() => setEditingDocument(null)}
        title={editingDocument?.id ? (<><EditOutlined /> แก้ไข Document</>) : (<><PlusOutlined /> เพิ่ม Document</>)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ docType: 'Other Document' }}
        >
          <Form.Item name="project" label="Project" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="docDate" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/></Form.Item>
         <Form.Item name="docType" label="Type" rules={[{ required: true }]}>
          {/* ถ้าเลือกเพิ่มประเภทใหม่จะให้แสดง Input */}
          <Select
            placeholder="เลือกประเภทเอกสาร"
            onChange={(value) => {
              if (value === 'เพิ่มประเภทใหม่') {
                setIsNewType(true);  // เปลี่ยนให้กรอกประเภทใหม่
              } else {
                setIsNewType(false);  // กลับไปเลือกประเภทที่มี
              }
            }}
          >
            {docTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {type}
              </Select.Option>
            ))}
            <Select.Option value="เพิ่มประเภทใหม่" style={{ color: '#1890FF', fontWeight: 'bold' }}><PlusOutlined></PlusOutlined> Add</Select.Option> {/* เพิ่มตัวเลือกเพื่อให้กรอกประเภทใหม่ */}
          </Select>
        </Form.Item>

        {/* แสดงช่องกรอกประเภทใหม่เมื่อผู้ใช้เลือก "เพิ่มประเภทใหม่" */}
        {isNewType && (
          <Form.Item name="newType" label="New Type" rules={[{ required: true }]}>
            <Input
              name="newType"
              placeholder="กรอกประเภทใหม่"
              autoFocus
            />
          </Form.Item>
        )}
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={1} /></Form.Item>
          <Form.Item name="remark" label="Remark"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item label="Upload Files">
            <Upload
              customRequest={handleCustomUpload}
              listType="text"
              showUploadList={false}
              multiple
            >
              <Button icon={<UploadOutlined />}>Upload</Button>
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
    </div>
  );
};

export default OtherDocument;
