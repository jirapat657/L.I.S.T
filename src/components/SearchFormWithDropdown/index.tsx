// src/components/SearchFormWithDropdown/index.tsx

import React, { useRef, useState } from "react";
import { Button, Dropdown, Form, Input, Select, DatePicker, Row, Col } from "antd";
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
}

const issueDateFilterOptions = [
  { label: "เดือนปัจจุบัน", value: "thisMonth" },
  { label: "เดือนก่อน", value: "customMonth" },
  { label: "ปีปัจจุบัน", value: "thisYear" },
  { label: "ปีก่อน", value: "customYear" },
  { label: "เลือกช่วงวันที่", value: "customRange" },
];

const { RangePicker } = DatePicker;

// Helper สำหรับแต่ละ field
function DateFilterRow({
  label,
  filter,
  onChange,
}: {
  label: string;
  filter: DateFilterValue;
  onChange: (filter: DateFilterValue) => void;
}) {
  return (
    <Row gutter={8} style={{ marginBottom: 8 }}>
      <Col span={12}>
        <Form.Item label={label} style={{ marginBottom: 0 }}>
          <Select
            style={{ width: "100%" }}
            value={filter?.type ?? ""}
            options={issueDateFilterOptions}
            onChange={(type) => onChange({ type, value: undefined })}
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
              onChange={(v) => onChange({ type: "customMonth", value: v })}
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
              onChange={(v) => onChange({ type: "customYear", value: v })}
              placeholder="เลือกปี"
              allowClear
            />
          </Form.Item>
        )}
        {filter?.type === "customRange" && (
          <Form.Item label=" ">
            <RangePicker
              style={{ width: "100%" }}
               value={
                  // ตรวจสอบว่าค่า filter.value เป็น array ที่มี 2 element หรือไม่
                  Array.isArray(filter.value) && filter.value.length === 2
                    ? filter.value
                    : null
                }
              format="DD/MM/YY"
              onChange={(v) =>
                onChange({ type: "customRange", value: v })
              }
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
}) => {
  const [form] = Form.useForm();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false); // <--- เพิ่ม state

  const handleFinish = () => {
    onSearch(filters);
    setOpen(false); // <--- ปิดเมนูเมื่อกดค้นหา
  };

  const emptyFilters: FilterValues = {
    keyword: undefined,
    status: undefined,
    developer: undefined,
    baTest: undefined,
    issueDateFilter: { type: "", value: undefined },
    startDateFilter: { type: "", value: undefined },
    dueDateFilter: { type: "", value: undefined },
    completeDateFilter: { type: "", value: undefined }
  };

  const handleReset = () => {
    form.resetFields();
    handleFilterChange("issueDateFilter", { type: "", value: undefined });
    handleFilterChange("startDateFilter", { type: "", value: undefined });
    handleFilterChange("dueDateFilter", { type: "", value: undefined });
    handleFilterChange("completeDateFilter", { type: "", value: undefined });
    handleFilterChange("keyword", undefined);
    handleFilterChange("status", undefined);
    handleFilterChange("developer", undefined);
    handleFilterChange("baTest", undefined);

    onSearch(emptyFilters); // ส่งค่า reset ที่ตรง type
  };

  const menu = (
    <div
      style={{
        padding: 16,
        width: 750,
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
      >
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={24}>
            <Form.Item label="ค้นหา" name="keyword" style={{ marginBottom: 0 }}>
              <Input
                placeholder="Issue Code / Title"
                value={filters.keyword}
                onChange={(e) =>
                  handleFilterChange("keyword", e.target.value)
                }
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={13}>
            <Form.Item label="Status" name="status" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Select Status"
                options={statusOptions}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
              />
            </Form.Item>
          </Col>
          <Col span={13}>
            <Form.Item label="Developer" name="developer" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Select Developer"
                options={developerOptions}
                value={filters.developer}
                onChange={(value) =>
                  handleFilterChange("developer", value)
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={13}>
            <Form.Item label="BA/Test" name="baTest" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Select BA/Test"
                options={baTestOptions}
                value={filters.baTest}
                onChange={(value) =>
                  handleFilterChange("baTest", value)
                }
              />
            </Form.Item>
          </Col>
        </Row>
        {/* ช่องวันแต่ละอัน */}
        <DateFilterRow
          label="Issue Date"
          filter={filters.issueDateFilter}
          onChange={(val) => handleFilterChange("issueDateFilter", val)}
        />
        <DateFilterRow
          label="Start Date"
          filter={filters.startDateFilter}
          onChange={(val) => handleFilterChange("startDateFilter", val)}
        />
        <DateFilterRow
          label="Due Date"
          filter={filters.dueDateFilter}
          onChange={(val) => handleFilterChange("dueDateFilter", val)}
        />
        <DateFilterRow
          label="Complete Date"
          filter={filters.completeDateFilter}
          onChange={(val) => handleFilterChange("completeDateFilter", val)}
        />
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button type="primary" style={{ boxShadow: '0 2px 0 #d9d9d9',border: '1px solid #d9d9d9',color: 'rgba(0, 0, 0, 0.88)',backgroundColor: '#ffffff',marginRight: 8, height: '32px' }} onClick={handleReset}><SyncOutlined /> Clear Search</Button>
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
      onOpenChange={setOpen} // <--- เพิ่ม
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
