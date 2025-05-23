// src/pages/Projects/index.tsx
import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '@/api/project';
import type { ProjectData } from '@/types/project';

const { Search } = Input;

const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const filteredData = projects.filter((item) =>
    item.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Search
        placeholder="ค้นหาโปรเจกต์ตามชื่อ..."
        allowClear
        enterButton="ค้นหา"
        size="large"
        onSearch={(value) => setSearchTerm(value)}
        style={{ marginBottom: 24, maxWidth: 400 }}
      />

      <Row gutter={[16, 16]}>
        {filteredData.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card
              hoverable
              title={item.projectName}
              onClick={() => navigate(`/projects/${item.id}`)}
              cover={
                item.logo ? (
                  <img
                    src={item.logo}
                    alt="project logo"
                    style={{ height: 140, objectFit: 'contain', padding: 16 }}
                  />
                ) : null
              }
            >
              <p><strong>ID:</strong> {item.projectId}</p>
              <p><strong>By:</strong> {item.createBy}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Projects;
