//src/pages/ProjectChangeRequest/ProjectChangeRequestPrint/index.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Timestamp } from 'firebase/firestore';
import { Spin, Flex } from 'antd';

// API และ Component ที่เกี่ยวข้อง
import { getProjectChangeRequestById } from '@/api/projectChangeRequest';
import { ProjectChangeRequestPDF } from '@/components/ProjectChangeRequestPDF';
import logo from '/icons/Lucas_Strategy.png'; // แก้ไข path ของโลโก้ตามจริง

// Types
import type { ProjectChangeRequest_Firestore, ProjectChangeRequest_PDF } from '@/types/projectChangeRequest';

export default function ProjectChangeRequestPrint() {
  const { id } = useParams<{ id: string }>();
  const [sheet, setSheet] = useState<ProjectChangeRequest_PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Missing document ID');
      setLoading(false);
      return;
    }

    getProjectChangeRequestById(id)
      .then((data: ProjectChangeRequest_Firestore | null) => {
        if (!data) {
          setError('Document not found');
        } else {
          // ฟังก์ชันแปลง Timestamp เป็น Date object
          const convertToDate = (ts: Timestamp | Date | null | undefined): Date | undefined => {
            if (ts instanceof Timestamp) return ts.toDate();
            if (ts instanceof Date) return ts;
            return undefined;
          };

          // แปลงข้อมูลจาก Firestore Model เป็น PDF Model
          const processedData: ProjectChangeRequest_PDF = {
            ...data,
            date: convertToDate(data.date),
            createdAt: convertToDate(data.createdAt),
            updatedAt: convertToDate(data.updatedAt),
            customerInfo: data.customerInfo ? {
              ...data.customerInfo,
              date: convertToDate(data.customerInfo.date)
            } : undefined,
            serviceByInfo: data.serviceByInfo ? {
              ...data.serviceByInfo,
              date: convertToDate(data.serviceByInfo.date)
            } : undefined,
          };

          setSheet(processedData);
        }
      })
      .catch((err) => {
        console.error('Error fetching document:', err);
        setError('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ height: '100vh' }}>
        <Spin tip="Loading Document..." size="large" />
      </Flex>
    );
  }
  
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!sheet) return null;

  const fileName = `ChangeRequest-${sheet.jobCode || id}.pdf`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '8px 16px', 
        backgroundColor: '#f0f0f0', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <PDFDownloadLink
          document={<ProjectChangeRequestPDF sheet={sheet} logoSrc={logo} />}
          fileName={fileName}
          style={{
            textDecoration: 'none',
            padding: '6px 12px',
            color: '#fff',
            backgroundColor: '#1677ff',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          {({ loading: downloadLoading }) =>
            downloadLoading ? 'Preparing...' : `Download ${fileName}`
          }
        </PDFDownloadLink>
      </div>

      <div style={{ flex: 1 }}>
        <PDFViewer style={{ width: '100%', height: '100%' }} showToolbar={true}>
          <ProjectChangeRequestPDF sheet={sheet} logoSrc={logo} />
        </PDFViewer>
      </div>
    </div>
  );
}
