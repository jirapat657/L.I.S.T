// src/components/ServiceSheetPDF.tsx
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

/* ---------------- Types (ตัวอย่าง) ---------------- */
type ServiceTask = {
  description: string
  type: 'I' | 'T' | 'O' | string
  status: '0' | '1' | string
  serviceBy: string
}
type PartyInfo = { company?: string; name?: string; date?: any; signature?: string }
type ClientServiceSheetData = {
  projectName?: string
  jobCode?: string
  date?: any
  user?: string
  totalHours?: string | number
  serviceLocation?: string
  startTime?: string
  endTime?: string
  tasks?: ServiceTask[]
  remark?: string 
  customer?: PartyInfo
  serviceByInfo?: PartyInfo
  chargeFlags?: ('included'|'free'|'extra')[]
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 18,          // ขอบกระดาษ (mm-ish)
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
    // textAlign: 'right',
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
  table: { borderWidth: 1, borderColor: '#000', borderRadius: 4, marginTop: 4 },
  tHead: { flexDirection: 'row', backgroundColor: '#f0f0f0', textAlign: 'center' },
  tRow: {
    flexDirection: 'row',
    alignItems: 'stretch', // เปลี่ยนกลับเป็น stretch
    minHeight: 24,
    borderColor: '#000',
  },
  cell: {
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 6,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    height: '100%', // กำหนดให้เซลล์สูงเต็มที่
    flex: 1, // สำหรับคอลัมน์ที่ต้องการให้ขยายตาม
  },
  cellLast: {
    padding: 6,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: '100%',
    borderRightWidth: 0,
  },
  cNo: { 
    width: 30,
    justifyContent: 'center',
    textAlign: 'center',
    height: '100%',
  },
  cTask: { flexGrow: 1, minWidth: 240, maxWidth: 240 },
  cType: { width: 60, textAlign: 'center' },
  cStatus: { width: 60, textAlign: 'center' },
  cServiceBy: { width: 160 },

  // Remark
  remarkBox: { borderWidth: 1, borderColor: '#000', borderRadius: 4, padding: 8, minHeight: 77, marginTop: 10 },

  // Codes + checkboxes
  footerRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  codes: { flex: 1 },
  checks: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  check: { width: 10, height: 10, borderWidth: 1, borderColor: '#000', marginRight: 6 },
  checked: { backgroundColor: '#000' },

  // Signature blocks
  signRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 20, // เพิ่ม marginTop เพื่อให้มีที่ว่างสำหรับ label
  },
  signBoxContainer: {
    flex: 1,
    position: 'relative', // จำเป็นสำหรับการจัดตำแหน่ง absolute ของ label
  },
  signLabel: {
    fontWeight: 'bold',
    position: 'absolute',
    top: -15, // ย้าย label ขึ้นไปเหนือกล่อง
    backgroundColor: '#fff', // เพิ่มพื้นหลังเพื่อไม่ให้คำซ้อนกับเส้นขอบ
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
const fmtDate = (d: any) =>
  d?.toDate ? dayjs(d.toDate()).format('DD/MM/YYYY') : dayjs(d).isValid() ? dayjs(d).format('DD/MM/YYYY') : '-'

const isChecked = (flags: ClientServiceSheetData['chargeFlags'], k: 'included'|'free'|'extra') =>
  !!flags?.includes(k)

/* ---------------- Component ---------------- */
export const ServiceSheetPDF = ({ sheet, logoSrc }: { sheet: ClientServiceSheetData; logoSrc?: string }) => (
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
        {(sheet.tasks?.length ? sheet.tasks : []).map((t, i) => (
          <View key={i} style={styles.tRow}>
            <View style={[styles.cell, styles.cNo]}><Text>{i + 1}</Text></View>
            <View style={[styles.cell, styles.cTask]}><Text wrap>{t.description || '-'}</Text></View>
            <View style={[styles.cell, styles.cType]}><Text>{t.type || '-'}</Text></View>
            <View style={[styles.cell, styles.cStatus]}><Text>{t.status || '-'}</Text></View>
            <View style={[styles.cellLast, styles.cServiceBy]}><Text>{t.serviceBy || '-'}</Text></View>
          </View>
        ))}

        {/* Empty Rows (minimum 5 rows total) */}
        {Array.from({ length: Math.max(0, 9 - (sheet.tasks?.length || 0)) }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.tRow}>
            <View style={[styles.cell, styles.cNo]}><Text> </Text></View>
            <View style={[styles.cell, styles.cTask]}><Text> </Text></View>
            <View style={[styles.cell, styles.cType]}><Text> </Text></View>
            <View style={[styles.cell, styles.cStatus]}><Text> </Text></View>
            <View style={[styles.cellLast, styles.cServiceBy]}><Text> </Text></View>
          </View>
        ))}
      </View>

      {/* Remark */}
      <View style={styles.remarkBox}>
        <Text style={styles.label}>Remark :</Text>
        <Text>{sheet.remark || ' '}</Text>
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
            <View style={[styles.check, sheet.chargeTypes?.includes('included') && styles.checked]} />
            <Text>Included in Agreement</Text>
          </View>
          <View style={styles.checkRow}>
            <View style={[styles.check, sheet.chargeTypes?.includes('free') && styles.checked]} />
            <Text>Free of Charge</Text>
          </View>
          <View style={styles.checkRow}>
            <View style={[styles.check, sheet.chargeTypes?.includes('extra') && styles.checked]} />
            <Text>Extra Charge: {sheet.extraChargeDescription || '__________________'}</Text>
          </View>
        </View>
      </View>

      {/* Signatures */}
      <View style={styles.signRow}>
        <View style={styles.signBoxContainer}>
          <Text style={styles.signLabel}>Customer</Text>
          <View style={styles.signBox}>
            <Text>Company: {sheet.customerInfo?.company || '-'}</Text>
            <Text>Name: {sheet.customerInfo?.name || '-'}</Text>
            <Text>Date: {sheet.customerInfo?.date ? new Date(sheet.customerInfo.date).toLocaleDateString() : '-'}</Text>
            <Text>Signature: {sheet.customerInfo?.signature || '-'}</Text>
          </View>
        </View>

        <View style={styles.signBoxContainer}>
          <Text style={styles.signLabel}>Service by</Text>
          <View style={styles.signBox}>
            <Text>Company: {sheet.serviceByInfo?.company || '-'}</Text>
            <Text>Name: {sheet.serviceByInfo?.name || '-'}</Text>
            <Text>Date: {sheet.serviceByInfo?.date ? new Date(sheet.serviceByInfo.date).toLocaleDateString() : '-'}</Text>
            <Text>Signature: {sheet.serviceByInfo?.signature || '-'}</Text>
          </View>
        </View>
      </View>

      
    </Page>
  </Document>
)
