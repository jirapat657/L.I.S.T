// 📁 hooks/useGenerateIssueCode.ts
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/project';
import { getIssuesByProjectId } from '@/api/issue';
import dayjs from 'dayjs';
import type { FormInstance } from 'antd';
import { getIssuesByProjectCode } from '@/api/issue'; // ✅ ใช้ตัวใหม่

export const useGenerateIssueCode = (
  projectDocId: string | undefined,
  form: FormInstance
) => {
  // ดึง projects ทั้งหมด
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const currentProject = projects.find((p) => p.id === projectDocId);
  const projectCode = currentProject?.projectId;

  // ดึง issues ที่ projectId ตรงกัน
  const {
    data: issues = [],
    isLoading: isLoadingIssues,
    isError: isIssueError,
    } = useQuery({
    queryKey: ['issuesByProjectCode', projectCode],
    queryFn: () => getIssuesByProjectCode(projectCode!),
    enabled: !!projectCode,
    });

  useEffect(() => {
    if (!projectCode || isLoadingIssues || isIssueError) {
        console.log("⛔ ยังโหลดไม่เสร็จหรือ projectCode หาย");
        return;
    }

    const now = dayjs();
    const month = now.format('MM');
    const year = now.format('YYYY');
    const prefix = `${projectCode}-${month}${year}-`;

    console.log("📍 projectCode:", projectCode);
    console.log("📅 เดือน/ปี:", `${month}/${year}`);
    console.log("🔐 prefix ที่ใช้:", prefix);

    console.log("📦 issueCodes ทั้งหมด:", issues.map(i => i.issueCode));

    // กรองเฉพาะ issue ที่ตรงเดือนและปีนี้
    const filtered = issues.filter((issue) =>
        issue.issueCode?.startsWith(prefix)
    );

    console.log("🧪 filtered issueCodes:", filtered.map(i => i.issueCode));

    const maxRunning = filtered.reduce((max, issue) => {
        const match = issue.issueCode?.match(/-(\d{3})$/); // ดักแค่เลขท้ายพอ เพราะ prefix กรองแล้ว
        if (match) {
        const run = parseInt(match[1], 10);
        return run > max ? run : max;
        }
        console.log("⚠️ issue ไม่ match regex:", issue.issueCode);
        return max;
    }, 0);

    console.log("🧮 maxRunning:", maxRunning);

    const nextRun = String(maxRunning + 1).padStart(3, '0');
    const issueCode = `${prefix}${nextRun}`;

    console.log("✅ issueCode ที่จะเซ็ตใน form:", issueCode);

    form.setFieldsValue({ issueCode });
    }, [projectCode, isLoadingIssues, isIssueError, issues, form]);

};
