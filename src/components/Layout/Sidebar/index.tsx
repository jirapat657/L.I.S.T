import type { MenuProps } from 'antd'
import { signOut } from 'firebase/auth'
import React, { useState } from 'react'
import { BsTable } from 'react-icons/bs'
import { BiLogOut } from 'react-icons/bi'
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

function getItem(label: React.ReactNode, key: React.Key, icon: React.ReactNode): MenuItem {
  const isSignOut = key === 'sign-out'
  return {
    key,
    icon: <span style={{ fontSize: 20, color: 'white' }}>{icon}</span>,
    label: (
      <Link to={isSignOut ? '' : getPathFromKey(key)} style={{ color: 'white' }}>
        {label}
      </Link>
    ),
    onClick: () => (isSignOut ? signOut(auth) : null),
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
