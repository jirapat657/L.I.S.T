import type { FilterValues } from "@/types/filter";
import type dayjs from "dayjs";

export const defaultFilters: FilterValues = {
  keyword: undefined,
  status: undefined,
  developer: undefined,
  baTest: undefined,
  issueDateFilter: { type: "", value: undefined },
  startDateFilter: { type: "", value: undefined },
  dueDateFilter: { type: "", value: undefined },
  completeDateFilter: { type: "", value: undefined },
};

export const statusOptions = [
  { label: "Awaiting", value: "Awaiting" },
  { label: "Inprogress", value: "Inprogress" },
  { label: "Complete", value: "Complete" },
  { label: "Cancel", value: "Cancel" },
];

export type DatePickerValue = dayjs.Dayjs | null;
export type RangePickerValue = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
// developerOptions, baTestOptions แนะนำให้ดึงจาก API หรือ generate ผ่านฟังก์ชันกลาง
