// src/pages/Support/index.tsx
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getDocs, collection, orderBy, query, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import IssueTable from '@/components/IssueTable';
import type { Issue } from '@/types/projectDetail';
import { useNavigate } from 'react-router-dom';
import SearchFormWithDropdown from '@/components/SearchFormWithDropdown';
import { defaultFilters } from '@/constants/searchFilters';
import { filterIssues } from '@/utils/filterItems';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { FilterValues } from '@/types/filter';

dayjs.extend(isBetween);

type IssueWithDateString = Issue & {
  issueDate?: string;
  startDate?: string;
  dueDate?: string;
  completeDate?: string;
};

const COLLECTION_NAME = 'LIMIssues';

const Support: React.FC = () => {
  const [issues, setIssues] = useState<IssueWithDateString[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const navigate = useNavigate();

  // ดึงข้อมูล issues จาก Firestore
  useEffect(() => {
    const fetchAllIssues = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          orderBy('createdAt', 'desc')
        );
        const qSnap = await getDocs(q);
        const issuesArray = qSnap.docs.map((docSnap) => {
          const data = docSnap.data();

          // แปลงวันที่เป็น string (YYYY-MM-DD)
          const parseDate = (d: Timestamp | string | null | undefined): string => {
            if (d && typeof d === 'object' && 'toDate' in d) {
              return d.toDate().toISOString().slice(0, 10);
            }
            return typeof d === "string" ? d : "";
          };

          return {
            id: docSnap.id,
            ...(data as Omit<Issue, 'id'>),
            issueDate: parseDate(data.issueDate),
            startDate: parseDate(data.startDate),
            dueDate: parseDate(data.dueDate),
            completeDate: parseDate(data.completeDate),
          };
        });
        setIssues(issuesArray);
      } catch (error) {
        console.error(error);
        message.error('Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    fetchAllIssues();
  }, []);

  // ฟังก์ชันลบ issue
  const handleDelete = async (issueId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, issueId));
      setIssues((prev) => prev.filter((item) => item.id !== issueId));
      message.success('Deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('Failed to delete');
    }
  };

  // ฟังก์ชันดูรายละเอียด issue
  const handleView = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/view/${issueId}`);
  };

  // ฟังก์ชันแก้ไข issue
  const handleEdit = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/edit/${issueId}`);
  };

  // ฟังก์ชันทำซ้ำ issue
  const handleDuplicate = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/duplicate/${issueId}`);
  };

  // ฟังก์ชันค้นหา
  const handleSearch = (searchFilters: FilterValues) => {
    setFilters(searchFilters);
    setIsSearching(true);
  };

  return (
    <div>
      <div style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        alignItems: "center", 
        marginBottom: 16 
      }}>
        <SearchFormWithDropdown
          onSearch={handleSearch}
          filters={filters}
        />
      </div>
      <IssueTable 
        issues={isSearching ? filterIssues(issues, filters) : issues}
        onDelete={handleDelete}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
};

export default Support;