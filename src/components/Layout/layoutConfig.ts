import { createStyles } from 'antd-style'

export const useLayoutStyle = createStyles(() => {
  return {
    authContainer: {
      minHeight: '100vh',
      backgroundImage: 'url(/images/login-background.jpg)', //backgroundหน้าlogin,forget pass
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
    },
    authContent: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: 800,
    },
    appContainer: { minHeight: '100vh', backgroundColor: '#202020' },
    appContent: {
      width: 'calc(100vw - 250px)',
      backgroundColor: 'white',
      padding: '50px',
      minHeight: '100vh', // ✅ ปรับให้ยืดตามเนื้อหา
      boxSizing: 'border-box',
    },
    
    sidebarContainer: {
      width: 250,
      backgroundColor: '#202020',
      boxShadow: '14px 17px 40px 4px #7090B014',
      marginTop: '31px',
      marginLeft: '22px',
      overflow: 'hidden',
    },
    sidebarTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight: 600,
    },
    sidebarMenuItem: {
      backgroundColor: '#202020',
      '& .ant-menu-item-selected': {
        backgroundColor: '#FC0A18',
        color: 'white',
      },
    },
  }
})
