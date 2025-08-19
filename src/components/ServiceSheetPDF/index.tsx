// src/components/ServiceSheetPDF.tsx
import type { ClientServiceSheet_PDF } from '@/types/clientServiceSheet'
import {
  Page, Text, View, Document, StyleSheet, Font, Image
} from '@react-pdf/renderer'
import dayjs from 'dayjs'


Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' }
  ]
})

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 18,
    fontSize: 8,
    lineHeight: 1.35
  },

  // Letterhead
  letterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  logo: { width: 75, marginRight: 8 },
  companyBlock: { flexGrow: 1, gap: 2 },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 35,
    marginBottom: 20
  },

  // Info boxes
  boxRow: { flexDirection: 'row', gap: 8 },
  box: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4
  },
  boxCol: { flex: 1 },
  label: { fontWeight: 'bold' },

  // Table
  table: { borderWidth: 1, borderColor: '#000', borderRadius: 4, marginTop: 4, overflow: 'hidden' }, // [เพิ่ม] overflow: 'hidden' เพื่อให้ border-radius แสดงผลถูกต้อง
  tHead: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderColor: '#000' }, // [แก้ไข] เพิ่มเส้นใต้
  tRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    
    borderColor: '#f0f0f0', // [แก้ไข] สีเส้นให้อ่อนลง
    minHeight: 24
  },
  tRowLast: { // [เพิ่ม] สไตล์สำหรับแถวสุดท้าย ไม่ต้องมีเส้นใต้
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 24,
  },
  cell: {
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 6,
    justifyContent: 'center', // [แก้ไข] จัดกึ่งกลางแนวตั้งสำหรับข้อความสั้นๆ
    flexGrow: 1, // [แก้ไข] ให้ขยายเต็มพื้นที่
    flexShrink: 1,
  },
  cellLast: { // [แก้ไข] ทำให้สไตล์สอดคล้องกัน
    padding: 6,
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
  },
  cNo: { 
    width: 30,
    flexGrow: 0, // [เพิ่ม] ไม่ต้องขยาย
    textAlign: 'center'
  },
  cTask: { flexBasis: 240, flexGrow: 1 }, // [แก้ไข] ใช้ flexBasis และ flexGrow
  cType: { width: 60, flexGrow: 0, textAlign: 'center' },
  cStatus: { width: 60, flexGrow: 0, textAlign: 'center' },
  cServiceBy: { flexBasis: 160, flexGrow: 1 }, // [แก้ไข] ใช้ flexBasis และ flexGrow

  // Remark
  remarkBox: { borderWidth: 1, borderColor: '#000', borderRadius: 4, padding: 8, minHeight: 77, marginTop: 10 },

  // Codes + checkboxes
  footerRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  codes: { flex: 1 },
  checks: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  check: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 6,
  },
  checked: {
    borderColor: '#000',
    backgroundColor: '#000',
  },

  // Signature blocks
  signRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 25, // [แก้ไข] เพิ่ม marginTop
  },
  signBoxContainer: {
    flex: 1,
    position: 'relative', 
  },
  signLabel: {
    fontWeight: 'bold',
    position: 'absolute',
    top: -15, 
    left: 8, // [เพิ่ม] จัดตำแหน่งให้สวยงาม
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

  
})

/* ---------------- Helpers ---------------- */
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

/* ---------------- Component ---------------- */
export const ServiceSheetPDF = ({ sheet, logoSrc }: { sheet: ClientServiceSheet_PDF; logoSrc?: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Letterhead */}
      <View style={styles.letterHead}>
        
        <View style={styles.companyBlock}>
          {logoSrc ? <Image style={styles.logo} src={logoSrc} /> : <View style={[styles.logo]} />}
          <Text>ลูคัส สแทรททิจี จำกัด (สำนักงานใหญ่)</Text>
          <Text>49 ซอย 12 ถนนโชตนา ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ จ.เชียงใหม่ 50300</Text>
          <Text>เลขประจำตัวผู้เสียภาษี 0505567004571</Text>
          <Text>เบอร์: 064-9978756</Text>
          <Text>www.ls.co.th</Text>
        </View>
        <Text style={styles.title}>Client Service Sheet</Text>
      </View>

      {/* Top boxes */}
      <View style={[styles.boxRow]}>
        <View style={[styles.box, { flex: 1.2 }]}>
          <Text><Text style={styles.label}>Project Name : </Text>{sheet.projectName || '-'}</Text>
          <Text><Text style={styles.label}>Service location : </Text>{sheet.serviceLocation || '-'}</Text>
          <Text><Text style={styles.label}>Start Time - End Time : </Text>{sheet.startTime || '-'} - {sheet.endTime || '-'}</Text>
        </View>

        <View style={[styles.box, { flex: 0.9 }]}>
          <Text><Text style={styles.label}>Job Code : </Text>{sheet.jobCode || '-'}</Text>
          <Text><Text style={styles.label}>Date : </Text>{fmtDate(sheet.date)}</Text>
          <Text><Text style={styles.label}>User : </Text>{sheet.user || '-'}</Text>
          <Text><Text style={styles.label}>Total Hours : </Text>{sheet.totalHours ?? '-'}</Text>
        </View>
      </View>

      {/* Tasks Table */}
      <View style={styles.table}>
        {/* Head */}
        <View style={styles.tHead}>
          <View style={[styles.cell, styles.cNo]}><Text>No.</Text></View>
          <View style={[styles.cell, styles.cTask]}><Text>Task description</Text></View>
          <View style={[styles.cell, styles.cType]}><Text>Type</Text></View>
          <View style={[styles.cell, styles.cStatus]}><Text>Status</Text></View>
          <View style={[styles.cellLast, styles.cServiceBy]}><Text>Service By</Text></View>
        </View>

        {/* Data Rows */}
        {/* [แก้ไข] เพิ่มการวนลูปสำหรับแถวว่าง และใช้ style ของแถวสุดท้าย */}
        {Array.from({ length: Math.max(9, sheet.tasks?.length || 0) }).map((_, i) => {
            const t = sheet.tasks?.[i]
            const isLastRow = i === Math.max(9, sheet.tasks?.length || 0) - 1
            const rowStyle = isLastRow ? styles.tRowLast : styles.tRow
            return (
              <View key={t?.description ? `task-${i}` : `empty-${i}`} style={rowStyle}>
                <View style={[styles.cell, styles.cNo]}><Text>{t ? i + 1 : ' '}</Text></View>
                <View style={[styles.cell, styles.cTask]}><Text wrap>{t?.description || ' '}</Text></View>
                <View style={[styles.cell, styles.cType]}><Text wrap>{t?.type || ' '}</Text></View>
                <View style={[styles.cell, styles.cStatus]}><Text wrap>{t?.status || ' '}</Text></View>
                <View style={[styles.cellLast, styles.cServiceBy]}><Text wrap>{t?.serviceBy || ' '}</Text></View>
              </View>
            )
        })}
      </View>

      {/* Remark */}
      <View style={styles.remarkBox}>
        <Text style={styles.label}>Remark :</Text>
        <Text wrap>{sheet.remark || ' '}</Text>
      </View>

      {/* Codes + Charge flags */}
      <View style={styles.footerRow}>
        <View style={styles.codes}>
          <Text style={styles.label}>Type Code</Text>
          <Text>I  = Implementation</Text>
          <Text>T = Training</Text>
          <Text>O = Onsite Service</Text>
        </View>
        <View style={styles.codes}>
          <Text style={styles.label}>Status Code</Text>
          <Text>0 = Complete</Text>
          <Text>1 = Follow up</Text>
        </View>

        <View style={styles.checks}>
          <View style={styles.checkRow}>
            <View style={[styles.check, sheet.chargeTypes?.includes('included') ? styles.checked : {}]} />
            <Text>Included in Agreement</Text>
          </View>
          <View style={styles.checkRow}>
            <View style={[styles.check, sheet.chargeTypes?.includes('free') ? styles.checked : {}]} />
            <Text>Free of Charge</Text>
          </View>
          <View style={styles.checkRow}>
            <View style={[styles.check, sheet.chargeTypes?.includes('extra') ? styles.checked : {}]} />
            <Text wrap>Extra Charge: {sheet.extraChargeDescription || '__________________'}</Text>
          </View>
        </View>
      </View>

      {/* Signatures */}
      <View style={styles.signRow}>
        <View style={styles.signBoxContainer}>
          <Text style={styles.signLabel}>Customer</Text>
          <View style={styles.signBox}>
            <Text wrap>Company: {sheet.customerInfo?.company || '-'}</Text>
            <Text wrap>Name: {sheet.customerInfo?.name || '-'}</Text>
            <Text>Date: {sheet.customerInfo?.date ? fmtDate(sheet.customerInfo.date) : '-'}</Text>
            <Text>Signature: {sheet.customerInfo?.signature || '-'}</Text>
          </View>
        </View>

        <View style={styles.signBoxContainer}>
          <Text style={styles.signLabel}>Service by</Text>
          <View style={styles.signBox}>
            <Text wrap>Company: {sheet.serviceByInfo?.company || '-'}</Text>
            <Text wrap>Name: {sheet.serviceByInfo?.name || '-'}</Text>
            <Text>Date: {sheet.serviceByInfo?.date ? fmtDate(sheet.serviceByInfo.date) : '-'}</Text>
            <Text>Signature: {sheet.serviceByInfo?.signature || '-'}</Text>
          </View>
        </View>
      </View>

      
    </Page>
  </Document>
)