import React, { useContext, useState } from 'react';
import { Flex, Typography, Avatar, Modal, Space, Button, Divider } from 'antd';
import { AuthContext } from '@/context/AuthContext';
import { useStyle } from '@/components/PageContainer/config';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useNavigate } from 'react-router-dom';
import { BiLogOut } from 'react-icons/bi';

type PageContainerProps = {
  children: React.ReactNode;
  title: string;
};


export default function PageContainer({ children, title = '' }: PageContainerProps) {
  const { styles } = useStyle();
  const { currentUser, loading } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  if (loading || !currentUser || !currentUser.profile) return null;

  const user = currentUser.profile;
  const firstChar = user.userName?.charAt(0)?.toUpperCase() ?? '?';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/sign-in'); // เปลี่ยนเป็น path หน้า login ตามโปรเจกต์ของคุณ
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <>
      <Flex justify="space-between" align="center" style={{ height: 48 }}>
        <Typography.Text className={styles.title}>{title}</Typography.Text>
        <div
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            gap: 24,
            padding: '4px 24px',
            borderRadius: 50,
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            backgroundColor: '#fff',
            transition: 'background 0.3s, box-shadow 0.3s',
            marginBottom:'20px'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#fff';
          }}

        >
          <div>
            <div style={{ fontWeight: 500  , color: '#7D0012'}}>{user.userName}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{user.jobPosition}</div>
          </div>
          <Avatar>{firstChar}</Avatar>
        </div>
      </Flex>

      {children}

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* รูปตรงกลาง */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar size={64}>{firstChar}</Avatar>
          </div>
          {/* Email ตรงกลาง */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 500  , color: '#7D0012'}}>
                {currentUser.email}
            </div>
            
          </div>

          {/* กล่องข้อมูลบัญชี */}
          <div
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              padding: 16,
              backgroundColor: '#fafafa',
            }}
          >
            <Typography.Text strong>ข้อมูลบัญชี</Typography.Text>
            <Divider style={{margin: '5px'}}></Divider>
            <div>
              <Typography.Text strong>ชื่อ: </Typography.Text>
              {user.userName}
            </div>
            <Divider style={{margin: '5px'}}></Divider>
            <div>
              <Typography.Text strong>ตำแหน่ง: </Typography.Text>
              {user.jobPosition}
            </div>
          </div>

          {/* ปุ่ม logout */}
          <Button danger block onClick={handleSignOut}>
            <BiLogOut></BiLogOut>Log out
          </Button>
        </Space>
      </Modal>

    </>
  );
}
