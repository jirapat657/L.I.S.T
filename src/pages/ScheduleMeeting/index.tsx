
const PUBLIC_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=soaxeter%40gmail.com&ctz=Asia%2FBangkok"; 
  // แก้ src=... เป็น public calendar id ของคุณ

const ScheduleMeetingFullCalendar = () => {
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      
      <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
        <iframe
          src={PUBLIC_CALENDAR_EMBED_URL}
          style={{ width: '100%', height: 700, border: '0' }}
          frameBorder="0"
          scrolling="no"
          title="Google Calendar"
        ></iframe>
      </div>
      <p style={{ color: '#888', marginTop: 16 }}>
        * หากต้องการใช้งานเพิ่ม/แก้ไขกิจกรรม ต้องกดที่ลิงก์ด้านบนเพื่อไปยัง Google Calendar โดยตรง
      </p>
    </div>
  );
};

export default ScheduleMeetingFullCalendar;
