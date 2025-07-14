import type { FormInstance } from "antd";
import type { Dayjs } from "dayjs";

export interface FilterValues {
  keyword?: string;
  status?: string;
  developer?: string;
  baTest?: string;
  issueDateFilter: DateFilterValue;
  startDateFilter: DateFilterValue;
  dueDateFilter: DateFilterValue;
  completeDateFilter: DateFilterValue;
}

export interface DateFilterValue {
  type: string;
  value?: Dayjs | [Dayjs | null, Dayjs | null] | null;
}

export type OptionType = { 
  label: string; 
  value: string;
  disabled?: boolean; // เพิ่ม property disabled ที่อาจใช้ใน Select options
};

export interface SearchFormProps {
  onSearch: (values: FilterValues) => void;
  filters: FilterValues;
  handleFilterChange: <K extends keyof FilterValues>(field: K, value: FilterValues[K]) => void;
  initialValues?: Partial<FilterValues>; // ใช้ Partial เพราะ initialValues อาจไม่ต้องมีทุก field
  statusOptions?: OptionType[];
  developerOptions?: OptionType[];
  baTestOptions?: OptionType[];
  form?: FormInstance; // เพิ่ม prop สำหรับ Form instance
}

