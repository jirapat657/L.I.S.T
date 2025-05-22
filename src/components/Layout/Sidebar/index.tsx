// ✅ src/components/Layout/Sidebar/index.tsx
import type { MenuProps } from 'antd'
import { signOut } from 'firebase/auth'
import React, { useState } from 'react'
import { BsTable } from 'react-icons/bs'
import { BiLogOut } from 'react-icons/bi'
import { SettingOutlined } from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'
import { Flex, Layout, Menu, Space, Typography } from 'antd'

import { PATH } from '@/constants/enums'
import { auth } from '@/services/firebase'

import { useLayoutStyle } from '@/components/Layout/layoutConfig'

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
  const isSignOut = key === 'sign-out'
  return {
    key,
    icon: <span style={{ fontSize: 20, color: 'white' }}>{icon}</span>,
    label: children ? (
      label
    ) : (
      <Link to={isSignOut ? '' : getPathFromKey(key)} style={{ color: 'white' }}>
        {label}
      </Link>
    ),
    onClick: isSignOut ? () => signOut(auth) : onClick,
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

  const items: MenuItem[] = [
    getItem('Dashboard', 'dashboard', <BsTable />),
    getItem('Projects', 'projects', <BsTable />),
    getItem('Scope of Work', 'scope', <BsTable />),
    getItem('Setting', 'setting', <SettingOutlined />, [
      getItem(
        <Link to={PATH.SETTING_ADD_PROJECT} style={{ color: 'white' }}>
          Add Project
        </Link>,
        'setting/add-project',
        null
      ),
      getItem(
        <Link to={PATH.SETTING_ADD_USER} style={{ color: 'white' }}>
          Add User
        </Link>,
        'setting/add-user',
        null
      ),
    ]),
    getItem('Sign Out', 'sign-out', <BiLogOut style={{ fontSize: 20, color: '#A3AED0' }} />),
  ]

  return (
    <Layout.Sider className={styles.sidebarContainer}>
      <Space direction='vertical'>
        <Typography.Text className={styles.sidebarTitle}>ISSUE</Typography.Text>
        <Typography.Text className={styles.sidebarTitle}>MANAGEMENT</Typography.Text>
      </Space>
      <Flex vertical align='center' style={{ height: '100%' }}>
        <Menu
          selectedKeys={[selectedKey]}
          mode='inline'
          items={items}
          onClick={(e) => setSelectedKey(e.key)}
          className={styles.sidebarMenuItem}
          style={{ flex: 1 }}
        />
      </Flex>
    </Layout.Sider>
  )
}
