// ✅ src/components/Layout/Sidebar/index.tsx
import type { MenuProps } from 'antd'
import React, { useContext, useState } from 'react'
import { BsTable } from 'react-icons/bs'
import { CalendarOutlined, FileTextFilled, HddFilled, SettingFilled, UnorderedListOutlined } from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'
import { Divider, Flex, Layout, Menu, Space } from 'antd'

import { PATH } from '@/constants/enums'
import { useLayoutStyle } from '@/components/Layout/layoutConfig'
import { AuthContext } from '@/context/AuthContext'

type MenuItem = Required<MenuProps>['items'][number]

function getPathFromKey(key: React.Key): string {
  return typeof key === 'string'
    ? (PATH[key.toUpperCase().replace('-', '_') as keyof typeof PATH] as string)
    : ''
}

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon: React.ReactNode,
  children?: MenuItem[],
  onClick?: () => void
): MenuItem {
  return {
    key,
    icon: <span style={{ fontSize: 20, color: 'white' }}>{icon}</span>,
    label: children ? (
      label
    ) : (
      <Link to={getPathFromKey(key)} style={{ color: 'white' }}>
        {label}
      </Link>
    ),
    onClick,
    children,
  } as MenuItem
}

export default function Sidebar() {
  const { styles } = useLayoutStyle()
  const location = useLocation()
  const [selectedKey, setSelectedKey] = useState(() => {
    const path = location.pathname.split('/')[1]
    return path || 'dashboard'
  })

  const { currentUser } = useContext(AuthContext)
  const role = currentUser?.profile?.role

  const items: MenuItem[] = [
    getItem('Dashboard', 'dashboard', <BsTable />),
    getItem('Support', 'support', <HddFilled />),
    getItem('Projects', 'projects', <UnorderedListOutlined />),
    getItem('Scope of Work', 'scope', <FileTextFilled />),
    getItem('Other Document', 'other-document', <FileTextFilled />),
    getItem('Schedule Meeting', 'schedule-meeting', <CalendarOutlined />),
    getItem(
      <span style={{ color: 'white' }}>Setting</span>,
      'setting',
      <SettingFilled />,
      [
        getItem(
          <Link to={PATH.SETTING_ADD_PROJECT} style={{ color: 'white' }}>
            Add Project
          </Link>,
          'setting/add-project',
          null
        ),
        ...(role === 'Admin'
          ? [
              getItem(
                <Link to={PATH.SETTING_ADD_USER} style={{ color: 'white' }}>
                  Add User
                </Link>,
                'setting/add-user',
                null
              ),
            ]
          : []),
      ]
    ),
  ]

  return (
    <Layout.Sider className={styles.sidebarContainer}>
      <Space direction="vertical">
        <img src='/icons/headerSidebar.png' alt='Logo' className={styles.logo} />
      </Space>
      <Divider
        style={{
          borderColor: 'white',   // เปลี่ยนสีเส้นเป็นขาว
          margin: '8px 0',        // ลดระยะห่างบนล่าง (default คือ 24px)
        }}
      />

      <Flex vertical align="center" style={{ height: '100%' }}>
        <Menu
          selectedKeys={[selectedKey]}
          mode="inline"
          items={items}
          onClick={(e) => setSelectedKey(e.key)}
          className={styles.sidebarMenuItem}
          style={{ flex: 1 }}
        />
      </Flex>
    </Layout.Sider>
  )
}
