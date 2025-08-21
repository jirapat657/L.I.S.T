// src/components/ProjectChangeRequestPDF/index.tsx
import {
  Page, Text, View, Document, StyleSheet, Font, Image,
  Svg,
  Path
} from '@react-pdf/renderer';
import dayjs from 'dayjs';
import type { ProjectChangeRequest_PDF } from '@/types/projectChangeRequest';

// แนะนำให้ลงทะเบียนฟอนต์ภาษาไทย เช่น Sarabun
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 30,
    fontSize: 9,
    lineHeight: 1.4,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  companyInfo: {
    fontSize: 8,
    gap: 1,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // --- Info Boxes ---
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 8,
    flex: 1,
    gap: 4,
  },
  infoLine: {
    flexDirection: 'row',
  },
  label: {
    fontWeight: 'bold',
    minWidth: 70,
  },
  // --- Table ---
  table: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: '#fff', // No background color
    borderBottomWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tRow: {
    flexDirection: 'row',
    // borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 25, // Increase row height
  },
  tRowLast: {
    flexDirection: 'row',
    minHeight: 45,
  },
  cell: {
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 6,
    flexGrow: 1,
    flexShrink: 1,
  },
  cellLast: {
    padding: 6,
    flexGrow: 1,
    flexShrink: 1,
  },
  cSeq: { flexBasis: 40, flexGrow: 0, textAlign: 'center' },
  cDesc: { flexBasis: 250, flexGrow: 1 },
  cRequested: { flexBasis: 100, flexGrow: 1 },
  cApproved: { flexBasis: 100, flexGrow: 1 },

  // --- Charge Section ---
  chargeBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    gap: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   // แทนที่ style check เดิมด้วย style ใหม่
  checkContainer: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  // --- Signature Section ---
  signRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 25,
  },
  signBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 10,
    flex: 1,
    gap: 4, // Add gap between text lines
  },
});

// [แก้ไข] เปลี่ยนค่าสำรองจากจุดไข่ปลาเป็นขีด (-)
const fmtDate = (d: Date | string | { toDate?: () => Date } | undefined) => {
  let dateValue: string | number | Date | null | undefined
  if (d && typeof d === 'object' && typeof (d as { toDate?: () => Date }).toDate === 'function') {
    dateValue = (d as { toDate: () => Date }).toDate()
  } else {
    dateValue = d as string | number | Date | null | undefined
  }
  return dayjs(dateValue).isValid()
    ? dayjs(dateValue).format('DD/MM/YYYY')
    : '-'
}

export const ProjectChangeRequestPDF = ({ sheet, logoSrc }: { sheet: ProjectChangeRequest_PDF; logoSrc?: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Image style={{ width: 80, marginBottom: 5 }} src={logoSrc || ''} />
          <Text>ลูคัส สแทรททิจี จำกัด (สำนักงานใหญ่) &nbsp;</Text>
          <Text>49 ซอย 12 ถนนโชตนา ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ จ.เชียงใหม่ 50300 &nbsp;</Text>
          <Text>เลขประจำตัวผู้เสียภาษีอากร 0505567004571 &nbsp;&nbsp;</Text>
          <Text>เบอร์มือถือ 064-9978756</Text>
          <Text>www.ls.co.th</Text>
        </View>
        <Text style={styles.documentTitle}>Project Change request</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <View style={styles.infoLine}><Text style={styles.label}>Project Name</Text><Text>: {sheet.projectName || ''}</Text></View>
          <View style={styles.infoLine}><Text style={styles.label}>Project Stage</Text><Text>: {sheet.projectStage || ''}</Text></View>
        </View>
        <View style={styles.infoBox}>
          <View style={styles.infoLine}><Text style={styles.label}>Project Code</Text><Text>: {sheet.jobCode || ''}</Text></View>
          <View style={styles.infoLine}><Text style={styles.label}>Date</Text><Text>: {fmtDate(sheet.date)}</Text></View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tHead}>
          <View style={[styles.cell, styles.cSeq]}><Text>Seq.</Text></View>
          <View style={[styles.cell, styles.cDesc]}><Text>Description</Text></View>
          <View style={[styles.cell, styles.cRequested]}><Text>Requested By</Text></View>
          <View style={[styles.cellLast, styles.cApproved]}><Text>Approved</Text></View>
        </View>
        {Array.from({ length: 10 }).map((_, i) => { // สร้าง 10 แถวเสมอ
            const task = sheet.tasks?.[i];
            const isLastRow = i === 9;
            return (
              <View key={task?.id || `empty-${i}`} style={isLastRow ? styles.tRowLast : styles.tRow}>
                <View style={[styles.cell, styles.cSeq]}><Text wrap>{task?.sequence || ' '}</Text></View>
                <View style={[styles.cell, styles.cDesc]}><Text wrap>{task?.description || ' '}</Text></View>
                <View style={[styles.cell, styles.cRequested]}><Text wrap>{task?.requestedBy || ' '}</Text></View>
                <View style={[styles.cellLast, styles.cApproved]}><Text wrap>{task?.approved || ' '}</Text></View>
              </View>
            );
        })}
      </View>

      {/* Charge Section */}
        <View style={styles.chargeBox}>
            {/* Included in Agreement */}
            <View style={styles.checkRow}>
                <View style={styles.checkContainer}>
                {sheet.chargeTypes?.includes('included') && (
                    <Svg width={10} height={10} viewBox="0 0 24 24">
                    <Path
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        fill="#000"
                    />
                    </Svg>
                )}
                </View>
                <Text>Included in Agreement</Text>
            </View>

            {/* Free of Charge */}
            <View style={styles.checkRow}>
                <View style={styles.checkContainer}>
                {sheet.chargeTypes?.includes('free') && (
                    <Svg width={10} height={10} viewBox="0 0 24 24">
                    <Path
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        fill="#000"
                    />
                    </Svg>
                )}
                </View>
                <Text>Free of Charge</Text>
            </View>

            {/* Extra Charge */}
            <View style={styles.checkRow}>
                <View style={styles.checkContainer}>
                {sheet.chargeTypes?.includes('extra') && (
                    <Svg width={10} height={10} viewBox="0 0 24 24">
                    <Path
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        fill="#000"
                    />
                    </Svg>
                )}
                </View>
                <Text>Extra Charge: {sheet.extraChargeDescription || ''}</Text>
            </View>
        </View>

      {/* [แก้ไข] อัปเดต Signature Section ให้ดึงข้อมูลจริง */}
      <View style={styles.signRow}>
        <View style={styles.signBox}>
          <Text>Company: {sheet.customerInfo?.company || '-'}</Text>
          <Text>Name: {sheet.customerInfo?.name || '-'}</Text>
          <Text>Date: {fmtDate(sheet.customerInfo?.date)}</Text>
          <Text>Signature: {sheet.customerInfo?.signature || '-'}</Text>
        </View>
        <View style={styles.signBox}>
          <Text>Company: {sheet.serviceByInfo?.company || '-'}</Text>
          <Text>Name: {sheet.serviceByInfo?.name || '-'}</Text>
          <Text>Date: {fmtDate(sheet.serviceByInfo?.date)}</Text>
          <Text>Signature: {sheet.serviceByInfo?.signature || '-'}</Text>
        </View>
      </View>
    </Page>
  </Document>
);