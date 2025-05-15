import { Flex, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'

import { useStyle } from '@/components/PageContainer/config'

type PageContainerProps = {
  children: React.ReactNode
  title: string
}

export default function PageContainer({ children, title = '' }: PageContainerProps) {
  const { styles } = useStyle()
  return (
    <>
      <Flex justify='space-between' align='center' style={{ height: 48 }}>
        <Typography.Text className={styles.title}>{title}</Typography.Text>
        <UserOutlined />
      </Flex>
      {children}
    </>
  )
}
