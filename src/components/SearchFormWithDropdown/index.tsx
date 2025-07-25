// src/components/SearchFormWithDropdown/index.tsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Form, Input, Select, DatePicker, Row, Col, type FormInstance } from "antd";
import { SearchOutlined, SyncOutlined } from "@ant-design/icons";
import type { DateFilterValue, FilterValues } from "@/types/filter";

type OptionType = { label: string; value: string };

interface SearchFormProps {
  onSearch: (values: FilterValues) => void;
  filters: FilterValues;
  handleFilterChange: <K extends keyof FilterValues>(field: K, value: FilterValues[K]) => void;
  initialValues?: FilterValues;
  statusOptions?: OptionType[];
  developerOptions?: OptionType[];
  baTestOptions?: OptionType[];
  form?: FormInstance;
  isProjectSearchEnabled?: boolean;  
  projectOptions?: OptionType[];
  handleReset?: () => void; // เพิ่ม handleReset ที่รับฟังก์ชันจาก parent
}

const issueDateFilterOptions = [
  { label: "เดือนปัจจุบัน", value: "thisMonth" },
  { label: "เดือนก่อน", value: "customMonth" },
  { label: "ปีปัจจุบัน", value: "thisYear" },
  { label: "ปีก่อน", value: "customYear" },
  { label: "เลือกช่วงวันที่", value: "customRange" },
];

const { RangePicker } = DatePicker;

function DateFilterRow({
  label,
  filter,
  onChange,
  onAutoSearch,
}: {
  label: string;
  filter: DateFilterValue;
  onChange: (filter: DateFilterValue) => void;
  onAutoSearch?: () => void;
}) {
  return (
    <Row gutter={8} style={{ marginBottom: 8 }}>
      <Col span={12}>
        <Form.Item label={label} style={{ marginBottom: 0 }}>
          <Select
            style={{ width: "100%" }}
            value={filter?.type ?? ""}
            options={issueDateFilterOptions}
            onChange={(type) => {
              onChange({ type, value: undefined });
              onAutoSearch?.(); // 👈 trigger search
            }}
            placeholder="เลือกวิธีค้นหา"
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        {filter?.type === "customMonth" && (
          <Form.Item label=" ">
            <DatePicker
              picker="month"
              style={{ width: "100%" }}
              value={filter.value || null}
              onChange={(v) => {
                onChange({ type: "customMonth", value: v });
                onAutoSearch?.(); // 👈 trigger search
              }}
              placeholder="เลือกเดือน"
              allowClear
            />
          </Form.Item>
        )}
        {filter?.type === "customYear" && (
          <Form.Item label=" ">
            <DatePicker
              picker="year"
              style={{ width: "100%" }}
              value={filter.value || null}
              onChange={(v) => {
                onChange({ type: "customYear", value: v });
                onAutoSearch?.();
              }}
              placeholder="เลือกปี"
              allowClear
            />
          </Form.Item>
        )}
        {filter?.type === "customRange" && (
          <Form.Item label=" ">
            <RangePicker
              style={{ width: "100%" }}
              value={Array.isArray(filter.value) && filter.value.length === 2 ? filter.value : null}
              format="DD/MM/YY"
              onChange={(v) => {
                onChange({ type: "customRange", value: v });
                onAutoSearch?.();
              }}
              allowClear
            />
          </Form.Item>
        )}
      </Col>
    </Row>
  );
}

const SearchFormWithDropdown: React.FC<SearchFormProps> = ({
  onSearch,
  initialValues,
  filters,
  handleFilterChange,
  statusOptions = [],
  developerOptions = [],
  baTestOptions = [],
  form: propForm,
  isProjectSearchEnabled = true,  // กำหนดค่าเริ่มต้นเป็น true
  projectOptions = [], // Set default empty array here
  handleReset  // รับฟังก์ชัน handleReset จาก parent
}) => {
  const [form] = Form.useForm(propForm);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // Sync form values when filters change
  useEffect(() => {
    form.setFieldsValue({
      keyword: filters.keyword,
      status: filters.status,
      developer: filters.developer,
      baTest: filters.baTest,
      projectName: filters.projectName, // Add projectName to synced fields
      // Date fields are handled separately in DateFilterRow
    });
  }, [filters, form]);

  // ฟังก์ชันที่จะทำงานทุกครั้งที่มีการเปลี่ยนแปลงในฟอร์ม
  const handleFormChange = (changedValues: Partial<FilterValues>) => {
    // เมื่อมีการเปลี่ยนแปลงค่าในฟอร์ม จะเรียก onSearch ทันที
    onSearch({
      ...filters,
      ...changedValues,  // อัปเดตค่า filters ด้วยค่าที่เปลี่ยนแปลง
    });
  };

  const handleFinish = () => {
    onSearch(filters);
    setOpen(false);
  };

  // ฟังก์ชันสำหรับรีเซ็ตค่าฟอร์มจาก parent
  const handleClearSearch = () => {
    if (handleReset) {
      handleReset();  // เรียกฟังก์ชัน handleReset จาก parent
    }
  };

  const menu = (
    <div
      style={{
        padding: 16,
        width: 350,
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
        onValuesChange={(_, values) => handleFormChange(values)}  // ฟังก์ชันที่จะทำงานทันทีเมื่อมีการเปลี่ยนแปลงค่า
      >
        {isProjectSearchEnabled && (
          <Row gutter={16} style={{ marginBottom: 8 }}>
            <Col span={24}>
              <Form.Item label="Project Name" name="projectName" style={{ marginBottom: 0 }}>
                <Select
                  showSearch
                  allowClear
                  placeholder="Select Project"
                  onChange={(value) => {
                    handleFilterChange("projectName", value); // อัปเดต state filter
                    onSearch({ ...filters, projectName: value }); // ค้นหาโดยอัตโนมัติ
                  }}
                  options={projectOptions}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={24}>
            <Form.Item label="ค้นหา" name="keyword" style={{ marginBottom: 0 }}>
              <Input
                placeholder="Issue Code / Title"
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Status" name="status" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Select Status" 
                options={[
                  { label: 'All', value: '' }, // เพิ่ม option "All"
                  ...statusOptions.filter(opt => opt.value !== '') // ใช้ค่าจาก props แต่ไม่เอา value ว่างถ้ามี
                ]}
                onChange={(value) => handleFilterChange("status", value)}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Developer" name="developer" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Select Developer"
                options={developerOptions}
                onChange={(value) => handleFilterChange("developer", value)}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={24}>
            <Form.Item label="BA/Test" name="baTest" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Select BA/Test"
                options={baTestOptions}
                onChange={(value) => handleFilterChange("baTest", value)}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <DateFilterRow
          label="Issue Date"
          filter={filters.issueDateFilter}
          
          onChange={(val) => {
            handleFilterChange("issueDateFilter", val);
            onSearch({ ...filters, issueDateFilter: val });
          }}
        />
        <DateFilterRow
          label="Start Date"
          filter={filters.startDateFilter}

          onChange={(val) => {
            handleFilterChange("startDateFilter", val);
            onSearch({ ...filters, startDateFilter: val });
          }}
        />
        <DateFilterRow
          label="Due Date"
          filter={filters.dueDateFilter}
          
          onChange={(val) => {
            handleFilterChange("dueDateFilter", val);
            onSearch({ ...filters, dueDateFilter: val });
          }}
        />
        <DateFilterRow
          label="Complete Date"
          filter={filters.completeDateFilter}
          
          onChange={(val) => {
            handleFilterChange("completeDateFilter", val);
            onSearch({ ...filters, completeDateFilter: val });
          }}
        />
        
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button 
            type="primary" 
            style={{ 
              boxShadow: '0 2px 0 #d9d9d9',
              border: '1px solid #d9d9d9',
              color: 'rgba(0, 0, 0, 0.88)',
              backgroundColor: '#ffffff',
              marginRight: 8, 
              height: '32px' 
            }} 
            onClick={handleClearSearch}
          >
            <SyncOutlined /> Clear Search
          </Button>
          <Button type="primary" htmlType="submit" style={{ height: '32px' }}>
            <SearchOutlined/> ค้นหา
          </Button>
        </div>
      </Form>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => menu}
      trigger={["click"]}
      placement="bottomRight"
      arrow
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        icon={<SearchOutlined />}
        ref={btnRef}
        type="primary"
        style={{ borderRadius: "50%" }}
      />
    </Dropdown>
  );
};

export default SearchFormWithDropdown;