// src/pages/ScopeOfWork/index.tsx
import { Table, Button, Modal, List, Typography, Dropdown, message, Form, Input, DatePicker, Upload, Select } from 'antd';
import type { MenuProps } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllScopes, deleteScopeById, updateScopeById, createScope } from '@/api/scope';
import { getProjects } from '@/api/project';
import { deleteFileFromStorage } from '@/utils/deleteFileFromStorage';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { ScopeData, FileData, ScopePayload, ScopeFormValues } from '@/types/scopeOfWork';
import { Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { formatFirestoreDate } from '@/utils/dateUtils';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';
import type { ProjectData } from '@/types/project';

const ScopeOfWork = () => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileData[]>([]);
  const [editingScope, setEditingScope] = useState<ScopeData | null>(null);
  const [form] = Form.useForm();
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [search, setSearch] = useState('');

  // ===== queries =====
  const { data: scopes = [], isLoading } = useQuery({
    queryKey: ['scopes'],
    queryFn: getAllScopes,
  });

  const { data: projects = [] } = useQuery<ProjectData[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const queryClient = useQueryClient();

  // ===== filter on table =====
  const filteredScopes = useMemo(
    () =>
      scopes.filter(scope =>
        scope.project?.toLowerCase().includes(search.toLowerCase())
      ),
    [scopes, search]
  );

  // ===== table columns =====
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
        if (record.files && record.files.length > 0) {
          return (
            <Typography.Link onClick={() => handleDescriptionClick(record.files)}>
              {desc}
            </Typography.Link>
          );
        }
        return <span style={{ cursor: 'not-allowed', opacity: 0.8 }}>{desc || 'No Description'}</span>;
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
                // map กลับเข้า select: เราไม่มี projectDocId ใน scope เดิม จึงใส่แค่ชื่อไว้
                // ถ้าคุณเก็บ projectDocId ใน scope ด้วย สามารถ set เพิ่มได้
                project: record.project,            // ชื่อ (เดิม)
                projectId: record.projectId,   // ✅ ใช้ตรง ๆ
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
            <Button><MoreOutlined /></Button>
          </Dropdown>
        );
      },
    },
  ];

  // ===== actions =====
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

  const handleFinish = async (values: ScopeFormValues & { projectId?: string }) => {
    const payload: ScopePayload & { projectId?: string } = {
      ...values,
      files: uploadFiles,
      docDate: values.docDate ? Timestamp.fromDate(values.docDate.toDate()) : null,
      createdAt: editingScope?.createdAt ?? Timestamp.now(),
    };

    try {
      if (editingScope?.id) {
        await updateScopeById(editingScope.id, payload);
        message.success('อัปเดตสำเร็จ');
      } else {
        await createScope(payload);
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

  // ===== auto-generate Doc.No. =====
  // ใช้ Form.useWatch เพื่อติดตามค่า projectId และ docDate
  const watchedProjectId: string | undefined = Form.useWatch('projectId', form);
  const watchedDocDate: Dayjs | null = Form.useWatch('docDate', form);

  useEffect(() => {
    // เงื่อนไข: generate ตอนสร้างใหม่เท่านั้น (ไม่ใช่โหมดแก้ไข)
    const isCreateMode = !editingScope?.id;

    // ถ้าอยากให้ "แก้ไขแล้ว regenerate ใหม่" เมื่อเปลี่ยนโปรเจกต์/เดือน ให้เอาคอมเมนต์บรรทัดต่อไปนี้ออก
    // const isCreateOrEditRegenerate = true;
    // if (!isCreateOrEditRegenerate) return;

    if (!isCreateMode) return;
    if (!watchedProjectId) return;

    const yyyymm = (watchedDocDate ? watchedDocDate : dayjs()).format('YYYYMM');
    const prefix = `SOW-${watchedProjectId}-${yyyymm}`;

    // หาเลขรันสูงสุดจาก scopes ที่มีอยู่ (filter ด้วย prefix)
    const filtered = scopes.filter((s) => s.docNo?.startsWith(prefix));
    const maxRun = filtered.reduce((mx, s) => {
      const m = s.docNo?.match(/(\d{3})$/);
      if (m) {
        const n = parseInt(m[1], 10);
        return n > mx ? n : mx;
      }
      return mx;
    }, 0);

    const nextRun = String(maxRun + 1).padStart(3, '0');
    const nextDocNo = `${prefix}${nextRun}`;

    // set ลง form
    // หมายเหตุ: ถ้าอยากจะ lock ไม่ให้ผู้ใช้พิมพ์ทับ ให้ทำ Input เป็น readOnly
    form.setFieldsValue({ docNo: nextDocNo });
  }, [watchedProjectId, watchedDocDate, scopes, form, editingScope?.id]);

  // ===== helper: options ของ Select Project =====
  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: p.projectName,
        value: p.projectId,     // ใช้ projectId เป็น value สำหรับ generate
        // ถ้าต้องการใช้ doc id ก็เก็บเพิ่มใน option object ไว้ได้
        _docId: p.id,
        _projectName: p.projectName,
      })),
    [projects]
  );

  // สร้าง mapping id → name
  const idToName = useMemo(
    () => new Map(projects.map(p => [p.projectId, p.projectName])),
    [projects]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingScope({
              id: '', docNo: '', docDate: null, docType: 'Scope of Work', project: '', projectId: '', 
              customer: '', description: '', remark: '', files: [], createdAt: Timestamp.now()
            });
            form.resetFields();
            setUploadFiles([]);
            // ค่าตั้งต้น docDate = วันนี้ (ถ้าต้องการ)
            form.setFieldsValue({ docType: 'Scope of Work', docDate: dayjs() });
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
          pageSize: 10,
          showTotal: (total) => <div style={{ position: 'absolute', left: '16px' }}>ทั้งหมด {total} รายการ</div>,
        }}
      />

      {/* modal เลือกไฟล์ */}
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

      {/* modal เพิ่ม/แก้ไข */}
      <Modal
        open={!!editingScope}
        onCancel={() => setEditingScope(null)}
        title={editingScope?.id ? (<><EditOutlined /> แก้ไข Scope</>) : (<><PlusOutlined /> เพิ่ม Scope</>)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ docType: 'Scope of Work' }}
        >
          {/* ซ่อน projectId ไว้ใช้ generate */}
          <Form.Item name="projectId" hidden><Input /></Form.Item>

          {/* Doc. No. จะถูก generate อัตโนมัติ */}
          <Form.Item name="docNo" label="Doc. No." rules={[{ required: true }]}>
            <Input readOnly />
          </Form.Item>

          <Form.Item name="docDate" label="Doc. Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="docType" label="Doc. Type" rules={[{ required: true }]}>
            <Select
              placeholder="เลือกประเภทเอกสาร"
              options={[
                { label: 'Scope of Work', value: 'Scope of Work' },
              ]}
            />
          </Form.Item>

          {/* Project Select: แสดงชื่อ แต่ค่าที่เก็บเพื่อ generate คือ projectId */}
          <Form.Item
            name="project"  // ⚠ ถ้าช่องนี้คือ Select ที่เก็บ projectId จริง ๆ แนะนำเปลี่ยนชื่อเป็น 'projectId'
            label="Project"
            required
            tooltip="เลือกโปรเจกต์จาก LIMProjects"
          >
            <Select
              placeholder="เลือกโปรเจกต์"
              options={projectOptions} // [{label: projectName, value: projectId}]
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value: string) => {
                // value คือ projectId
                form.setFieldsValue({
                  projectId: value,
                  project: idToName.get(value) ?? '', // ถ้าต้องการเก็บชื่อไว้ในอีก field
                });
              }}
            />
          </Form.Item>

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
