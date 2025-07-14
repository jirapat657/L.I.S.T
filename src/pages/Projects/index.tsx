// src/pages/Projects/index.tsx
import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '@/api/project';
import type { ProjectData } from '@/types/project';

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
      <Input.Search
        placeholder="Project Name"
        allowClear
        onChange={(e) => setSearchTerm(e.target.value)}
        onSearch={(value) => setSearchTerm(value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />

      <Row gutter={[16, 16]} justify="start">
        {filteredData.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card
              hoverable
              onClick={() => navigate(`/projects/${item.id}`)}
              style={{
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{
                padding: '12px',
                flex: 'none', // Prevent body from growing
              }}
              cover={
                <div
                  style={{
                    height: 120, // Reduced height to accommodate text better
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: '#fafafa',
                  }}
                >
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt="project logo"
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                      }}
                    >
                      No Image
                    </div>
                  )}
                </div>
              }
            >
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: 16,
                  textAlign: 'center',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.25em',
                  height: '3.75em', // 1.25em x 3 lines
                  wordBreak: 'break-word',
                }}
                title={item.projectName} // Show full name on hover
              >
                {item.projectName}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Projects;