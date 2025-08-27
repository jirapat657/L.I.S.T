// src/pages/ClientServiceSheet/ServiceSheetPrint/index.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Timestamp } from 'firebase/firestore';

import { getClientServiceSheetById } from '@/api/clientServiceSheet';
import { ServiceSheetPDF } from '@/components/ServiceSheetPDF';
import logo from '/icons/Lucas_Strategy.png';

// นำเข้า Type ทั้งสองรูปแบบที่เราได้สร้างไว้
import type { ClientServiceSheet_Firestore, ClientServiceSheet_PDF } from '@/types/clientServiceSheet';

export default function ServiceSheetPrint() {
  const { id } = useParams<{ id: string }>();
  // State `sheet` จะใช้ Type สำหรับ PDF โดยเฉพาะ
  const [sheet, setSheet] = useState<ClientServiceSheet_PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Missing service sheet ID');
      setLoading(false);
      return;
    }

    // getClientServiceSheetById จะ return ข้อมูลในรูปแบบ Firestore
    getClientServiceSheetById(id)
      .then((data: ClientServiceSheet_Firestore | null) => {
        if (!data) {
          setError('Service sheet not found');
        } else {
          // ฟังก์ชันสำหรับแปลง Timestamp หรือค่าวันที่อื่นๆ ให้เป็น Date object
          const convertToDate = (ts: Timestamp | Date | string | null | undefined): Date | undefined => {
            if (ts instanceof Timestamp) {
              return ts.toDate();
            }
            if (ts instanceof Date) {
              return ts;
            }
            // สามารถเพิ่มการจัดการ string date ได้หากจำเป็น
            // if (typeof ts === 'string') {
            //   return new Date(ts);
            // }
            return undefined;
          };

          // --- ทำการแปลงข้อมูลจาก Firestore Model เป็น PDF Model ---
          const processedData: ClientServiceSheet_PDF = {
            ...data,
            date: convertToDate(data.date), // แปลง Timestamp เป็น Date
            customerInfo: data.customerInfo ? {
              ...data.customerInfo,
              date: convertToDate(data.customerInfo.date) // แปลง Timestamp เป็น Date
            } : undefined,
            serviceByInfo: data.serviceByInfo ? {
              ...data.serviceByInfo,
              date: convertToDate(data.serviceByInfo.date) // แปลง Timestamp เป็น Date
            } : undefined,
          };

          setSheet(processedData);
        }
      })
      .catch((err) => {
        console.error('Error fetching service sheet:', err);
        setError('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>Loading document...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!sheet) return null;

  // สร้างชื่อไฟล์แบบไดนามิก
  const fileName = `ServiceSheet-${sheet.jobCode || id}.pdf`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ส่วน Header สำหรับปุ่ม Download */}
      <div style={{ 
        padding: '8px 16px', 
        backgroundColor: '#f0f0f0', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <PDFDownloadLink
          document={<ServiceSheetPDF sheet={sheet} logoSrc={logo} />}
          fileName={fileName}
          style={{
            textDecoration: 'none',
            padding: '6px 12px',
            color: '#fff',
            backgroundColor: '#080808',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          {({ loading: downloadLoading }) =>
            downloadLoading ? 'Preparing...' : 'Download PDF'
          }
        </PDFDownloadLink>
      </div>

      {/* ตัวพรีวิว PDF */}
      <div style={{ flex: 1 }}>
        <PDFViewer style={{ width: '100%', height: '100%' }} showToolbar={true}>
          <ServiceSheetPDF sheet={sheet} logoSrc={logo} />
        </PDFViewer>
      </div>
    </div>
  );
}