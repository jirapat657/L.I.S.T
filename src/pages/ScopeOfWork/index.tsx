// src/pages/ScopeOfWork/index.tsx
import { Table, Button, Modal, List, Typography, Dropdown, message, Form, Input, DatePicker, Upload, Select } from 'antd';
import type { MenuProps } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllScopes, deleteScopeById, updateScopeById, createScope } from '@/api/scope';
import { deleteFileFromStorage } from '@/utils/deleteFileFromStorage';
import dayjs from 'dayjs';
import { useState } from 'react';
import type { ScopeData, FileData, ScopePayload, ScopeFormValues } from '@/types/scopeOfWork';
import { Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { formatFirestoreDate } from '@/utils/dateUtils';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';

const ScopeOfWork = () => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileData[]>([]);
  const [editingScope, setEditingScope] = useState<ScopeData | null>(null);
  const [form] = Form.useForm();
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [search, setSearch] = useState('');

  const { data: scopes = [], isLoading } = useQuery({
    queryKey: ['scopes'],
    queryFn: getAllScopes,
  });

  const queryClient = useQueryClient();

  const filteredScopes = scopes.filter(scope =>
    scope.project.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Doc.Date',
      dataIndex: 'docDate',
      render: (val: Timestamp | Date | null | undefined) => formatFirestoreDate(val),
    },
    { title: 'Doc.No.', dataIndex: 'docNo' },
    { title: 'Project', dataIndex: 'project' },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (desc: string, record: ScopeData) => {
        // ถ้ามีไฟล์ให้กดได้, ถ้าไม่มีไฟล์ให้เป็นข้อความปกติ
        if (record.files && record.files.length > 0) {
          return (
            <Typography.Link onClick={() => handleDescriptionClick(record.files)}>
              {desc}
            </Typography.Link>
          );
        }
        // ไม่มีไฟล์ → เป็นข้อความสีจางและคลิกไม่ได้
        return <span style={{  cursor: 'not-allowed' }}>{desc || 'No Description'}</span>;
      },
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: ScopeData) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            label: (<><EyeOutlined /> View/Edit</>),
            onClick: () => {
              setEditingScope(record);
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

  const handleDescriptionClick = (files?: FileData[]) => {
    if (!files || files.length === 0) return;
    if (files.length === 1) {
      window.open(files[0].url, '_blank');
    } else {
      setCurrentFiles(files);
      setFileModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScopeById(id);
      message.success('ลบสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['scopes'] });
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
    const storageRef = ref(storage, `scope-files/${uniqueName}`);

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

  const handleFinish = async (values: ScopeFormValues) => {
    const payload: ScopePayload = {
      ...values,
      files: uploadFiles,
      docDate: values.docDate ? Timestamp.fromDate(values.docDate.toDate()) : null,
      createdAt: editingScope?.createdAt ?? Timestamp.now(), // ✅ สำคัญ
    };

    try {
      if (editingScope?.id) {
        await updateScopeById(editingScope.id, payload);
        message.success('อัปเดตสำเร็จ');
      } else {
        await createScope(payload); // ✅ เพิ่มส่วนนี้เพื่อสร้างใหม่
        message.success('เพิ่มข้อมูลสำเร็จ');
      }

      setEditingScope(null);
      setUploadFiles([]);
      queryClient.invalidateQueries({ queryKey: ['scopes'] });
    } catch (err) {
      console.error('บันทึกล้มเหลว', err);
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingScope({
              id: '', docNo: '', docDate: null, docType: '', project: '', customer: '',
              description: '', remark: '', files: [], createdAt: Timestamp.now()
            });
            form.resetFields();
            setUploadFiles([]);
          }}
        >
          <PlusOutlined /> Add SOW
        </Button>
      </div>

      <Input
        placeholder="Project Name"
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />

      <Table
        columns={columns}
        dataSource={filteredScopes}
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
        open={!!editingScope}
        onCancel={() => setEditingScope(null)}
        title={editingScope?.id ? (<><EditOutlined /> แก้ไข Scope</>) : (<><PlusOutlined /> เพิ่ม Scope</>)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ docType: 'Scope of work' }}
        >
          <Form.Item name="docNo" label="Doc. No." rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="docDate" label="Doc. Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/></Form.Item>
          <Form.Item name="docType" label="Doc. Type" rules={[{ required: true }]}>
            <Select
              placeholder="เลือกประเภทเอกสาร"
              options={[
                { label: 'Scope of Work', value: 'Scope of Work' },
              ]}
            />
          </Form.Item>
          <Form.Item name="project" label="Project" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="customer" label="Customer" rules={[{ required: true }]}><Input /></Form.Item>
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

export default ScopeOfWork;
