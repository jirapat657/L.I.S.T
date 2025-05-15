import { Suspense } from 'react'
import { Content } from 'antd/es/layout/layout'
import { Outlet } from 'react-router-dom'
import { useLayoutStyle } from './layoutConfig'

export default function AuthLayout() {
  const { styles } = useLayoutStyle()
  return (
    <div className={styles.authContainer}>
      <Suspense fallback={null}>
        <Content className={styles.authContent}>
          <Outlet />
        </Content>
      </Suspense>
    </div>
  )
}
