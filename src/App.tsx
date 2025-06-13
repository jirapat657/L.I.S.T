import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

import dayjs from 'dayjs'
import { ConfigProvider } from 'antd'
import { Router } from '@/router/index'
import { theme } from '@/services/theme'
import { Toaster } from 'react-hot-toast'
import { AuthContextProvider } from '@/context/AuthContextProvider'
import { queryClient } from '@/services/react-query/getQueryClient'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

dayjs.extend(buddhistEra)

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

function App() {
  return (
    <>
      <ConfigProvider theme={theme}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: persister }}>
          <AuthContextProvider>
            <Toaster />
            <Router />
          </AuthContextProvider>
        </PersistQueryClientProvider>
      </ConfigProvider>
    </>
  )
}

export default App
