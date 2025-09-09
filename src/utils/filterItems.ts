// src/utils/filterItems.ts
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import { getDateRange } from "./dateFilters";
import type { Issue } from "@/types/projectDetail";
import type { FilterValues } from "@/types/filter";

function getDayjsDate(d: Date | string | { toDate: () => Date }  | null) {
  if (!d) return null;
  if (typeof d === "object" && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return dayjs((d as { toDate: () => Date }).toDate());
  }
  if (typeof d === "string" || d instanceof Date) {
    return dayjs(d);
  }
  return null;
}

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

    // Date filters
    const issueDate = getDayjsDate(item.issueDate);
    const matchIssueDate =
      (!issueStart && !issueEnd) ||
      (
        issueDate &&
        (
          (!issueStart || issueDate.isSameOrAfter(issueStart, "day")) &&
          (!issueEnd   || issueDate.isSameOrBefore(issueEnd, "day"))
        )
      );

    const startDate = getDayjsDate(item.startDate);
    const matchStartDate =
      (!startStart && !startEnd) ||
      (
        startDate &&
        (
          (!startStart || startDate.isSameOrAfter(startStart, "day")) &&
          (!startEnd   || startDate.isSameOrBefore(startEnd, "day"))
        )
      );

    const dueDate = getDayjsDate(item.dueDate);
    const matchDueDate =
      (!dueStart && !dueEnd) ||
      (
        dueDate &&
        (
          (!dueStart || dueDate.isSameOrAfter(dueStart, "day")) &&
          (!dueEnd   || dueDate.isSameOrBefore(dueEnd, "day"))
        )
      );

    const completeDate = getDayjsDate(item.completeDate);
    const matchCompleteDate =
      (!compStart && !compEnd) ||
      (
        completeDate &&
        (
          (!compStart || completeDate.isSameOrAfter(compStart, "day")) &&
          (!compEnd   || completeDate.isSameOrBefore(compEnd, "day"))
        )
      );

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
