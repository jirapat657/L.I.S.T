import type dayjs from "dayjs";

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
   value?: dayjs.Dayjs | [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

type OptionType = { label: string; value: string };

export interface SearchFormProps {
  onSearch: (values: FilterValues) => void;
  filters: FilterValues;
  handleFilterChange: <K extends keyof FilterValues>(field: K, value: FilterValues[K]) => void;
  initialValues?: FilterValues;
  statusOptions?: OptionType[];
  developerOptions?: OptionType[];
  baTestOptions?: OptionType[];
}