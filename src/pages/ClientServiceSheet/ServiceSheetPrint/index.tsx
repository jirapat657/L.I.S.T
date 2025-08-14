// src/pages/ServiceSheetPrint.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { getClientServiceSheetById } from '@/api/clientServiceSheet';
import { ServiceSheetPDF } from '@/components/ServiceSheetPDF';
import logo from '/icons/Lucas_Strategy.png';
import type { ClientServiceSheetData } from '@/types/clientServiceSheet'; // นำเข้า type

export default function ServiceSheetPrint() {
  const { id } = useParams();
  const [sheet, setSheet] = useState<ClientServiceSheetData | null>(null); // ระบุ type ที่นี่
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Missing service sheet ID');
      setLoading(false);
      return;
    }
    getClientServiceSheetById(id)
      .then((data) => {
        if (!data) {
          setError('Service sheet not found');
        } else {
          setSheet(data); // 現在สามารถรับ ClientServiceSheetData ได้
        }
      })
      .catch((err) => {
        console.error('Error fetching service sheet:', err);
        setError('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
  if (!sheet) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ปุ่ม Download PDF */}
      <div style={{ padding: 8 }}>
        <PDFDownloadLink
          document={<ServiceSheetPDF sheet={sheet} logoSrc={logo} />}
          fileName={`service-sheet-${sheet.jobCode || id}.pdf`}
        >
          {({ loading }) =>
            loading ? 'Preparing document...' : 'Download PDF'
          }
        </PDFDownloadLink>
      </div>

      {/* ตัวพรีวิว PDF */}
      <div style={{ flex: 1 }}>
        <PDFViewer style={{ width: '100%', height: '100%' }}>
          <ServiceSheetPDF sheet={sheet} logoSrc={logo} />
        </PDFViewer>
      </div>
    </div>
  );
}