// src/types/meetingSummary.ts

// ประเภทข้อมูลของไฟล์ที่แนบมา
export interface FileData {
  name: string;  // ชื่อไฟล์
  url: string;   // URL ของไฟล์เพื่อดาวน์โหลด
}

// ประเภทข้อมูลของ Meeting Summary
export interface MeetingSummaryData {
  id: string;  // ID ของเอกสารใน Firestore
  meetingDate: FirebaseFirestore.Timestamp ;  // วันที่ของการประชุม
  meetingNo: string;  // หมายเลขการประชุม
  meetingTime: FirebaseFirestore.Timestamp;  // เวลาในการประชุม
  attendees?: string;  // รายชื่อผู้เข้าร่วม
  meetingTopic?: string;  // หัวข้อของการประชุม
  meetingChannel?: string;  // ช่องทางการประชุม (เช่น Zoom, Teams)
  meetingPlace?: string;  // สถานที่หรือแพลตฟอร์มในการประชุม
  noteTaker?: string;  // ชื่อผู้จดบันทึก
  remark?: string | null;  // หมายเหตุเพิ่มเติม
  files?: FileData[];  // ไฟล์ที่อัปโหลด
  createdAt: FirebaseFirestore.Timestamp;  // วันที่สร้างเอกสาร
  createdBy?: string;      // ทำให้ optional
}

// ประเภทข้อมูลของ Payload ที่ใช้สำหรับสร้างหรืออัปเดต Meeting Summary
export interface MeetingSummaryPayload {
  meetingDate: FirebaseFirestore.Timestamp ;  // วันที่ของการประชุม
  meetingNo: string;  // หมายเลขการประชุม
  meetingTime: FirebaseFirestore.Timestamp;  // เวลาในการประชุม
  attendees?: string;  // รายชื่อผู้เข้าร่วม
  meetingTopic?: string;  // หัวข้อของการประชุม
  meetingChannel?: string;  // ช่องทางการประชุม
  meetingPlace?: string;  // สถานที่หรือแพลตฟอร์มในการประชุม
  noteTaker?: string;  // ชื่อผู้จดบันทึก
  remark?: string | null;  // หมายเหตุเพิ่มเติม
  files?: FileData[];  // ไฟล์ที่อัปโหลด
  createdAt: FirebaseFirestore.Timestamp;  // วันที่สร้างเอกสาร
  createdBy: string;  // ผู้สร้างเอกสาร (ชื่อหรืออีเมล)
}

// ประเภทข้อมูลของค่าฟอร์มที่ใช้ในหน้าฟอร์มสร้างหรือแก้ไข Meeting Summary
export interface MeetingSummaryFormValues {
  meetingDate: Date ;  // วันที่ของการประชุม (ใช้ในฟอร์ม)
  meetingNo: string;  // หมายเลขการประชุม (ใช้ในฟอร์ม)
  meetingTime: Dayjs;  // เวลาในการประชุม (ใช้ในฟอร์ม)
  attendees?: string;  // รายชื่อผู้เข้าร่วม (ใช้ในฟอร์ม)
  meetingTopic?: string;  // หัวข้อของการประชุม (ใช้ในฟอร์ม)
  meetingChannel?: string;  // ช่องทางการประชุม (ใช้ในฟอร์ม)
  meetingPlace?: string;  // สถานที่หรือแพลตฟอร์มในการประชุม (ใช้ในฟอร์ม)
  noteTaker?: string;  // ชื่อผู้จดบันทึก (ใช้ในฟอร์ม)
  remark?: string | null;  // หมายเหตุเพิ่มเติม (ใช้ในฟอร์ม)
  files?: FileData[];  // ไฟล์ที่อัปโหลด (ใช้ในฟอร์ม)
}
