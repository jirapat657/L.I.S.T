import Sidebar from '@/components/Layout/Sidebar'
import Layout, { Content } from 'antd/es/layout/layout'
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useLayoutStyle } from './layoutConfig'

export default function AppLayout() {
  const { styles } = useLayoutStyle()

  return (
    <Suspense fallback={null}>
      <Layout className={styles.appContainer}>
        <Sidebar />
        <Layout>
          <Content className={styles.appContent}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Suspense>
  )
}
