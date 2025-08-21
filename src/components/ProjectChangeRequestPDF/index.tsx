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
    padding: 18,
    fontSize: 8,
    lineHeight: 1.35
  },
  // --- letterHead ---
  letterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  logo: { width: 75, marginRight: 8, marginBottom: 4 },
  companyBlock: { flexGrow: 1, gap: 2 },
  // --- Document Title ---
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 35,
    marginBottom: 20
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
    minWidth: 55,
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
    minHeight: 40, // Increase row height
  },
  tRowLast: {
    flexDirection: 'row',
    minHeight: 24,
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
    marginBottom: 40,
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
    gap: 10, 
    marginTop: 55,
  },
  signBoxContainer: {
    flex: 1,
    position: 'relative', 
  },
  signLabel: {
    fontWeight: 'bold',
    position: 'absolute',
    top: -15, 
    left: 8,
    backgroundColor: '#fff', 
    paddingHorizontal: 4,
  },
  signBox: { 
    borderWidth: 1, 
    borderColor: '#000', 
    borderRadius: 4, 
    padding: 8, 
    minHeight: 70,
  },
  signLabelMinor: {
    fontWeight: 'bold',
    minWidth: 43,
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
      <View style={styles.letterHead}>
        <View style={styles.companyBlock}>
          {logoSrc ? <Image style={styles.logo} src={logoSrc} /> : <View style={[styles.logo]} />}
          <Text>ลูคัส สแทรททิจี จำกัด (สำนักงานใหญ่) &nbsp;</Text>
          <Text>49 ซอย 12 ถนนโชตนา ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ จ.เชียงใหม่ 50300 &nbsp;</Text>
          <Text>เลขประจำตัวผู้เสียภาษี 0505567004571 &nbsp;&nbsp;</Text>
          <Text>เบอร์มือถือ 064-9978756</Text>
          <Text>www.ls.co.th</Text>
        </View>
        <Text style={styles.title}>Project Change request</Text>
      </View>

      {/* Top boxes */}
      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <View style={styles.infoLine}><Text style={styles.label}>Project Name : </Text><Text>{sheet.projectName || '-'}</Text></View>
          <View style={styles.infoLine}><Text style={styles.label}>Project Stage : </Text><Text>{sheet.projectStage || '-'}</Text></View>
        </View>
        <View style={styles.infoBox}>
          <View style={styles.infoLine}><Text style={styles.label}>Project Code : </Text><Text>{sheet.jobCode || '-'}</Text></View>
          <View style={styles.infoLine}><Text style={styles.label}>Date : </Text><Text>{fmtDate(sheet.date) || '-'}</Text></View>
        </View>
      </View>

      {/* Description Section */}
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
                <Text>Extra Charge : {sheet.extraChargeDescription || '__________________'}</Text>
            </View>
        </View>

      {/* Signatures */}
      <View style={styles.signRow}>
        <View style={styles.signBoxContainer}>
          <Text style={styles.signLabel}>Customer</Text>
          <View style={styles.signBox}>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Company : </Text><Text>{sheet.customerInfo?.company || '-'}</Text></View>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Name : </Text><Text>{sheet.customerInfo?.name || '-'}</Text></View>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Date : </Text><Text>{sheet.customerInfo?.date ? fmtDate(sheet.customerInfo.date) : '-'}</Text></View>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Signature : </Text><Text>{sheet.customerInfo?.signature || '-'}</Text></View>
          </View>
        </View>

        <View style={styles.signBoxContainer}>
          <Text style={styles.signLabel}>Service by</Text>
          <View style={styles.signBox}>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Company : </Text><Text>{sheet.serviceByInfo?.company || '-'}</Text></View>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Name : </Text><Text>{sheet.serviceByInfo?.name || '-'}</Text></View>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Date : </Text><Text>{sheet.serviceByInfo?.date ? fmtDate(sheet.serviceByInfo.date) : '-'}</Text></View>
            <View style={styles.infoLine}><Text style={styles.signLabelMinor}>Signature : </Text><Text>{sheet.serviceByInfo?.signature || '-'}</Text></View>
          </View>
        </View>
      </View>

    </Page>
  </Document>
);