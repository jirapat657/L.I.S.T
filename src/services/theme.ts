export const theme = {
  token: {
    colorPrimary: '#080808', // สีพื้นหลังPrimary
    fontSizeBase: 16, // ปรับขนาดฟอนต์พื้นฐาน
  },
  components: {
    Table: {
      headerBg: '#080808',     // สีพื้นหลังของ header row
      headerColor: '#ffffff',  // สีตัวอักษรของ header
    },
    Select: {
      optionSelectedBg: '#080808',   // พื้นหลังตอนเลือก
      optionSelectedColor: '#ffffff', // ตัวอักษรของตัวเลือกที่ถูกเลือก
    },
    Tooltip: {
      colorBgSpotlight: 'gray', // เพิ่ม tooltip หากต้องการ
      colorText: '#ffffff',
    },
  },
}
