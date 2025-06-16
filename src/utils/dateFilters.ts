import dayjs from "dayjs";
import type { DateFilterValue } from "@/types/filter";

export function getDateRange(dateFilter: DateFilterValue): [dayjs.Dayjs | null, dayjs.Dayjs | null] {
  if (!dateFilter || !dateFilter.type || dateFilter.type === "") {
    return [null, null];
  }
  if (dateFilter.type === "thisMonth") {
    return [dayjs().startOf("month"), dayjs().endOf("month")];
  }
  if (dateFilter.type === "thisYear") {
    return [dayjs().startOf("year"), dayjs().endOf("year")];
  }
  // ====== แก้ตรงนี้ ======
  if (dateFilter.type === "customMonth" && dateFilter.value && !Array.isArray(dateFilter.value)) {
    const m = dayjs(dateFilter.value);
    return [m.startOf("month"), m.endOf("month")];
  }
  if (dateFilter.type === "customYear" && dateFilter.value && !Array.isArray(dateFilter.value)) {
    const y = dayjs(dateFilter.value);
    return [y.startOf("year"), y.endOf("year")];
  }
  if (dateFilter.type === "customRange" && Array.isArray(dateFilter.value) && dateFilter.value.length === 2) {
    return dateFilter.value as [dayjs.Dayjs | null, dayjs.Dayjs | null];
  }
  return [null, null];
}
