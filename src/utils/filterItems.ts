// src/utils/filterItems.ts
import dayjs from "dayjs";
import { getDateRange } from "./dateFilters";
import type { Issue } from "@/types/projectDetail"; // หรือ type อื่นๆ สำหรับแต่ละหน้า
import type { FilterValues } from "@/types/filter";

export function filterIssues(issues: Issue[], filters: FilterValues) {
  const [issueStart, issueEnd] = getDateRange(filters.issueDateFilter);
  const [startStart, startEnd] = getDateRange(filters.startDateFilter);
  const [dueStart, dueEnd] = getDateRange(filters.dueDateFilter);
  const [compStart, compEnd] = getDateRange(filters.completeDateFilter);

  return issues.filter(item => {
    const matchKeyword =
      (item.issueCode ?? '').toLowerCase().includes((filters.keyword ?? '').toLowerCase()) ||
      (item.title ?? '').toLowerCase().includes((filters.keyword ?? '').toLowerCase());

    const matchStatus =
      !filters.status || (item.status ?? '') === filters.status;

    const matchDeveloper =
      !filters.developer || (item.developer ?? '') === filters.developer;

    const matchBaTest =
      !filters.baTest || (item.baTest ?? '') === filters.baTest;

    // --- Filter วัน ---
    const matchIssueDate =
      !issueStart ||
      !issueEnd ||
      (item.issueDate &&
        dayjs(item.issueDate).isBetween(issueStart, issueEnd, "day", "[]"));

    const matchStartDate =
      !startStart ||
      !startEnd ||
      (item.startDate &&
        dayjs(item.startDate).isBetween(startStart, startEnd, "day", "[]"));

    const matchDueDate =
      !dueStart ||
      !dueEnd ||
      (item.dueDate &&
        dayjs(item.dueDate).isBetween(dueStart, dueEnd, "day", "[]"));

    const matchCompleteDate =
      !compStart ||
      !compEnd ||
      (item.completeDate &&
        dayjs(item.completeDate).isBetween(compStart, compEnd, "day", "[]"));

    return (
      matchKeyword &&
      matchStatus &&
      matchDeveloper &&
      matchBaTest &&
      matchIssueDate &&
      matchStartDate &&
      matchDueDate &&
      matchCompleteDate
    );
  });
}
