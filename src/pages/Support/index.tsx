// src/pages/Support/index.tsx

import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getDocs, collection, orderBy, query, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import IssueTable from '@/components/IssueTable';
import type { Issue } from '@/types/projectDetail';
import { useNavigate } from 'react-router-dom';
import SearchFormWithDropdown from '@/components/SearchFormWithDropdown';

import { statusOptions, defaultFilters } from '@/constants/searchFilters';
import { filterIssues } from '@/utils/filterItems';
import { useTableSearch } from '@/components/useTableSearch';

import { getUsers } from '@/api/user';
import { useQuery } from '@tanstack/react-query';
import { getDeveloperOptions, getBATestOptions } from '@/utils/userOptions';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

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
  const [isSearching, setIsSearching] = useState(false); // เพิ่มสถานะ isSearching เพื่อควบคุมการกรองข้อมูล
  const navigate = useNavigate();

  // Custom hook สำหรับ filter state
  const {
    filters,
    handleFilterChange,
  } = useTableSearch(defaultFilters);

  // ดึง user สำหรับ dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  const developerOptions = getDeveloperOptions(users);
  const baTestOptions = getBATestOptions(users);

  // ดึงข้อมูล
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
        setIssues(issuesArray); // แสดงข้อมูลทั้งหมดที่ไม่ได้กรอง
      } catch (error) {
        console.error(error);
        message.error('Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    fetchAllIssues();
  }, []); // ทำงานแค่ครั้งแรกที่โหลดหน้า

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

  const handleView = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/view/${issueId}`);
  };

  const handleEdit = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/edit/${issueId}`);
  };

  const handleDuplicate = (issueId: string, projectId: string) => {
    navigate(`/projects/${projectId}/duplicate/${issueId}`);
  };

  // === FILTER DATA ===
  // กรองข้อมูลเมื่อผู้ใช้กดค้นหา
  const filteredData = isSearching ? filterIssues(issues, filters) : issues; // ตรวจสอบว่า isSearching เป็นจริงหรือไม่

  // ฟังก์ชันสำหรับการค้นหาหรือกรองข้อมูล
  const handleSearch = () => {
    setIsSearching(true); // ตั้งค่า isSearching เป็น true เพื่อกรองข้อมูล
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        <SearchFormWithDropdown
          onSearch={handleSearch} // ส่งฟังก์ชัน handleSearch ไปที่ SearchFormWithDropdown
          filters={filters}
          handleFilterChange={handleFilterChange}
          statusOptions={statusOptions}
          developerOptions={developerOptions}
          baTestOptions={baTestOptions}
          setIsSearching={setIsSearching} // ส่ง setIsSearching เป็น prop
        />
      </div>
      <IssueTable 
        issues={filteredData} // กรองข้อมูลหรือลบกรองข้อมูลตาม isSearching
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
