// src/pages/OtherDocument/index.tsx
import { Table, Button, Modal, List, Typography, Dropdown, message, Form, Input, DatePicker, Upload, Select, Row, Col } from 'antd';
import type { MenuProps } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getAllOtherDocuments, deleteOtherDocumentById, updateOtherDocumentById, createOtherDocument, getUniqueDocumentTypes } from '@/api/otherDocument';
import { getProjects } from '@/api/project';
import { deleteFileFromStorage } from '@/utils/deleteFileFromStorage';
import dayjs from 'dayjs';
import { useEffect, useState, useMemo } from 'react';
import type { OtherDocumentData, FileData, OtherDocumentPayload, OtherDocumentFormValues } from '@/types/otherDocument';
import type { ProjectData } from '@/types/project';
import { Timestamp } from 'firebase/firestore';
import { formatFirestoreDate } from '@/utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';

const OtherDocument = () => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileData[]>([]);
  const [editingDocument, setEditingDocument] = useState<OtherDocumentData | null>(null);
  const [form] = Form.useForm();
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [searchFileName, setSearchFileName] = useState('');
  const [searchProjectsName, setSearchProjectsName] = useState('');
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [isNewType, setIsNewType] = useState(false);

  const { data: otherDocuments = [], isLoading } = useQuery({
    queryKey: ['otherDocuments'],
    queryFn: getAllOtherDocuments,
  });

  const { data: projects = [] } = useQuery<ProjectData[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const queryClient = useQueryClient();

  // filter
  const filteredDocuments = otherDocuments.filter(document =>
    document.description.toLowerCase().includes(searchFileName.toLowerCase()) &&
    document.project.toLowerCase().includes(searchProjectsName.toLowerCase())
  );

  // docTypes
  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const types = await getUniqueDocumentTypes();
        setDocTypes(types);
      } catch (err) {
        console.error('Error fetching document types:', err);
        message.error('เกิดข้อผิดพลาดในการดึงประเภทเอกสาร');
      }
    };
    fetchDocTypes();
  }, []);

  // project options
  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: p.projectName,
        value: p.projectId,
      })),
    [projects]
  );
  const idToName = useMemo(() => new Map(projects.map(p => [p.projectId, p.projectName])), [projects]);
  const nameToId = useMemo(() => new Map(projects.map(p => [p.projectName, p.projectId])), [projects]);
  const toDayjs = (val: Timestamp | Date | null | undefined) => {
    if (!val) return null;

    if (val instanceof Date) {
      return dayjs(val);
    }

    // ถ้าเป็น Firestore Timestamp
    if (typeof val === 'object' && val !== null && 'toDate' in val) {
      return dayjs((val as Timestamp).toDate());
    }

    return null;
  };
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
      title: 'Added By',
      dataIndex: 'createBy',
      render: (createBy: string) => createBy || 'ไม่ทราบผู้ใช้',
    },
    {
      title: '',
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
                projectId: record.projectId || (record.project ? nameToId.get(record.project) : undefined),
                project: record.project,
                docDate: toDayjs(record.docDate),
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

  const handleCustomUpload = async ({ file, onSuccess, onError }: UploadRequestOption) => {
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
    mutationFn: createOtherDocument,
    onSuccess: () => {
      message.success('เพิ่มข้อมูลสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['otherDocuments'] });
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    },
  });

  const { mutate: updateDocument } = useMutation<void, Error, { id: string, payload: OtherDocumentPayload }>({
    mutationFn: ({ id, payload }) => updateOtherDocumentById(id, payload),
    onSuccess: () => {
      message.success('อัปเดตสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['otherDocuments'] });
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    },
  });

  const handleFinish = async (values: OtherDocumentFormValues & { projectId?: string }) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const displayName = currentUser?.displayName || currentUser?.email || 'ไม่ทราบผู้ใช้';

    const docType = isNewType ? values.newType : values.docType;
    if (!docType || docType.trim() === '') {
      message.error('กรุณากรอกประเภทเอกสาร');
      return;
    }

    const payload: OtherDocumentPayload & { projectId?: string } = {
      ...values,
      files: uploadFiles,
      docDate: values.docDate ? Timestamp.fromDate(values.docDate.toDate()) : null,
      createdAt: editingDocument?.createdAt ?? Timestamp.now(),
      createBy: displayName,
      remark: values.remark || null,
      docType,
      projectId: values.projectId ?? null,
    };

    if (editingDocument?.id) {
      updateDocument({ id: editingDocument.id, payload });
    } else {
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
            form.setFieldsValue({ docDate: dayjs() });
          }}
        >
          <PlusOutlined /> Add Other Document
        </Button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          onClick={() => {
            setSearchFileName('');
            setSearchProjectsName('');
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
          {/* ซ่อน projectId */}
          <Form.Item name="projectId" hidden><Input /></Form.Item>

          <Form.Item
            name="project"
            label="Project"
            required
            tooltip="เลือกโปรเจกต์จาก LIMProjects"
          >
            <Select
              placeholder="เลือกโปรเจกต์"
              options={projectOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value: string) => {
                form.setFieldsValue({
                  projectId: value,
                  project: idToName.get(value) ?? '',
                });
              }}
            />
          </Form.Item>

          <Form.Item name="docDate" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
          </Form.Item>

          <Form.Item name="docType" label="Type" rules={[{ required: true }]}>
            <Select
              placeholder="เลือกประเภทเอกสาร"
              onChange={(value) => {
                if (value === 'เพิ่มประเภทใหม่') {
                  setIsNewType(true);
                } else {
                  setIsNewType(false);
                }
              }}
            >
              {docTypes.map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
              <Select.Option value="เพิ่มประเภทใหม่" style={{ color: '#1890FF', fontWeight: 'bold' }}>
                <PlusOutlined /> Add
              </Select.Option>
            </Select>
          </Form.Item>

          {isNewType && (
            <Form.Item name="newType" label="New Type" rules={[{ required: true }]}>
              <Input name="newType" placeholder="กรอกประเภทใหม่" autoFocus />
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
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OtherDocument;
