// src/hooks/useIssuesWithProjectName.ts
import { useEffect, useState, useCallback } from 'react';
import { getAllIssues } from '@/api/issue';
import { getProjects } from '@/api/project';
import type { IssueData } from '@/types/issue';

type IssueWithProjectName = IssueData & { projectName: string };

export function useIssuesWithProjectName() {
  const [data, setData] = useState<IssueWithProjectName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // เปลี่ยนเป็น useCallback เพื่อป้องกันการสร้างฟังก์ชันใหม่ทุกครั้ง
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [issues, projects] = await Promise.all([
        getAllIssues(),
        getProjects()
      ]);
      const projectMap = Object.fromEntries(projects.map(p => [p.id, p.projectName]));
      setData(
        issues.map(issue => ({
          ...issue,
          projectName: projectMap[issue.projectId] || 'Unknown'
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // เพิ่ม refetch function ใน return value
  return { 
    data, 
    loading, 
    error,
    refetch: fetchData // เพิ่มบรรทัดนี้
  };
}