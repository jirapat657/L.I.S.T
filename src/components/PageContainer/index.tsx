// src/components/PageContainer/index.tsx

import React, { useContext } from 'react';
import {
  Flex,
  Typography,
  Avatar,
  Dropdown,
} from 'antd';
import { AuthContext } from '@/context/AuthContext';
import { useStyle } from '@/components/PageContainer/config';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useNavigate } from 'react-router-dom';
import { BiLogOut } from 'react-icons/bi';
import type { MenuProps } from 'antd';

type PageContainerProps = {
  children: React.ReactNode;
  title: string;
};

export default function PageContainer({ children, title = '' }: PageContainerProps) {
  const { styles } = useStyle();
  const { currentUser, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading || !currentUser || !currentUser.profile) return null;

  const user = currentUser.profile;
  const firstChar = user.userName?.charAt(0)?.toUpperCase() ?? '?';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/sign-in'); // เปลี่ยนเส้นทางไปหน้าล็อกอิน
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'avatar',
      label: (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingInline:120 }}>
          <Avatar size={64} style={{ backgroundColor: 'black', color: 'white' }}>
            {firstChar}
          </Avatar>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'email',
      label: (
        <div style={{ fontWeight: 500, color: '#7D0012', textAlign: 'center' }}>
          {currentUser.email}
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
   {
      key: 'username',
      label: (
        <div style={{ fontWeight: 500, color: '#000', pointerEvents: 'none' }}>
          <strong>ชื่อ:</strong> {user.userName}
        </div>
      ),
      disabled: true,
    },
    {
      key: 'position',
      label: (
        <div style={{ fontWeight: 500, color: '#000', pointerEvents: 'none' }}>
          <strong>ตำแหน่ง:</strong> {user.jobPosition}
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <span style={{ color: 'red' }}>
          <BiLogOut style={{ marginRight: 8 }} />
          Log out
        </span>
      ),
      onClick: handleSignOut,
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ height: 48 }}>
        <Typography.Text className={styles.title}>{title}</Typography.Text>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              gap: 24,
              padding: '4px 24px',
              borderRadius: 50,
              border: '1px solid #7F7F7F',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              backgroundColor: '#fff',
              transition: 'background 0.3s, box-shadow 0.3s',
              marginBottom: '20px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#fff';
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: '#7D0012' }}>{user.userName}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{user.jobPosition}</div>
            </div>
            <Avatar style={{ backgroundColor: 'black', color: 'white' }}>
              {firstChar}
            </Avatar>
          </div>
        </Dropdown>
      </Flex>

      {children}
    </>
  );
}
