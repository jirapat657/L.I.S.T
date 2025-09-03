// src/api/dashboard.ts
import type { IssueData } from '@/types/issue';
import type { ProjectData } from '@/types/project';
import { getAllProjects } from './project';
import { getAllIssues } from './issue';

// ฟังก์ชันใหม่เพื่อดึงข้อมูล Issues พร้อมชื่อโปรเจกต์
export const getAllIssuesWithProjectNames = async (): Promise<IssueData[]> => {
  const projects: ProjectData[] = await getAllProjects();
  const issues: IssueData[] = await getAllIssues();

  return issues.map(issue => {
    const project: ProjectData | undefined = projects.find(p => p.id === issue.projectId);
    return {
      ...issue,
      projectName: project?.projectName || 'Unknown Project',
    };
  });
};
