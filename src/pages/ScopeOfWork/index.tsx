import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const ScopeOfWork: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button type="primary" onClick={() => navigate('/scope/add')}>
          ➕ Add SOW
        </Button>
      </div>

      {/* รายการ SOW อื่น ๆ (ถ้ามี) */}
      <p>ยังไม่มีรายการ Scope of Work</p>
    </div>
  );
};

export default ScopeOfWork;
