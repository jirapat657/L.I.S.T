import React, { useState } from 'react';
import { Input, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

// 🟩 สร้าง Type สำหรับข้อมูลโปรเจกต์
interface Project {
  id: number;
  title: string;
  description: string;
}

// 🟦 สร้างข้อมูลจำลอง
const dummyData: Project[] = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  title: `โปรเจกต์ที่ ${i + 1}`,
  description: 'รายละเอียดโปรเจกต์โดยย่อ...',
}));

const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();

  // 🟨 กรองข้อมูลตามคำค้นหา
  const filteredData = dummyData.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* 🔍 ช่องค้นหา */}
      <Search
        placeholder="ค้นหาโปรเจกต์..."
        allowClear
        enterButton="ค้นหา"
        size="large"
        onSearch={(value: string) => setSearchTerm(value)}
        style={{ marginBottom: 24, maxWidth: 400 }}
      />

      {/* 🧾 แสดงโปรเจกต์ในกริด */}
      <Row gutter={[16, 16]}>
        {filteredData.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card
              hoverable
              title={item.title}
              onClick={() => navigate(`/projects/${item.id}`)} // ✅ ลิงก์ไปยังหน้ารายละเอียด
            >
              {item.description}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Projects;
