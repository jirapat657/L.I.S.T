// src/pages/Support/index.tsx
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getDocs, collection, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import IssueTable from '@/components/IssueTable';
import type { Issue } from '@/types/projectDetail';
import { useNavigate } from 'react-router-dom';

const Support: React.FC = () => {
    const COLLECTION_NAME = 'LIMIssues';
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllIssues = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'LIMIssues'),
          orderBy('createdAt', 'desc')
        );
        const qSnap = await getDocs(q);
        const issuesArray = qSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Issue, 'id'>),
        }));
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
    // ใช้ projectId ที่ดึงมาจาก Firestore ในแต่ละแถว
    navigate(`/projects/${projectId}/view/${issueId}`); // ใช้ projectId แทนใน URL
  };

  const handleEdit = (issueId: string, projectId: string) => {
    // ใช้ projectId ที่ดึงมาจาก Firestore ในแต่ละแถว
    navigate(`/projects/${projectId}/edit/${issueId}`); // ใช้ projectId แทนใน URL
  };

  const handleDuplicate = (issueId: string, projectId: string) => {
    // ใช้ projectId ที่ดึงมาจาก Firestore ในแต่ละแถว
    navigate(`/projects/${projectId}/duplicate/${issueId}`); // ใช้ projectId แทนใน URL
  };

  return (
    <div>
      <IssueTable 
        issues={issues} 
        onDelete={handleDelete} 
        loading={loading}
        onView={handleView}
        onEdit={handleEdit} // ส่ง handleEdit เข้าไปใน IssueTable
        onDuplicate={handleDuplicate} // ส่ง handleDuplicate เข้าไปใน IssueTable
      />
    </div>
  );
};

export default Support;



