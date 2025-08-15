//src/router/index.tsx

import { Flex, Result, Spin } from 'antd'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  redirect,
  type LoaderFunctionArgs,
} from 'react-router-dom'

import { PAGE_TITLE, PATH } from '@/constants/enums'
import { useAuth } from '@/hooks/useAuth'

import SignIn from '@/pages/Auth/SignIn'
import AppLayout from '@/components/Layout/appLayout'
import AuthLayout from '@/components/Layout/authLayout'
import ForgetPassword from '@/pages/Auth/ForgetPassword'
import PageContainer from '@/components/PageContainer'
import Dashboard from '@/pages/Dashboard'
import Support from '@/pages/Support'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/Projects/ProjectDetail'
import AddIssueForm from '@/pages/Projects/AddIssueForm';
import ViewIssue from '@/pages/Projects/ViewIssue';
import EditIssueForm from '@/pages/Projects/EditIssueForm';
import DuplicateIssueForm from '@/pages/Projects/DuplicateIssueForm';
import ScopeOfWork from '@/pages/ScopeOfWork';
import ClientServiceSheet from '@/pages/ClientServiceSheet';
import AddClientServiceSheet from '@/pages/ClientServiceSheet/AddClientServiceSheet';
import DuplicateClientServiceSheet from '@/pages/ClientServiceSheet/DuplicateClientServiceSheet';
import ServiceSheetPrint from '@/pages/ClientServiceSheet/ServiceSheetPrint'
import AddProjectSetting from '@/pages/Setting/AddProject';
import AddUserSetting from '@/pages/Setting/AddUser';
import OtherDocument from '@/pages/OtherDocument'
import ScheduleMeeting from '@/pages/ScheduleMeeting'
import MeetingSummary from '@/pages/MeetingSummary'
import ToDoList from '@/pages/ToDoList'


export function Router() {
  const { currentUser, loading } = useAuth()

  if (loading || currentUser === undefined) {
    return (
      <Flex justify='center' align='center' style={{ height: '100vh', width: '100vw' }}>
        <Spin size='large' />
      </Flex>
    )
  }

  function loginLoader() {
    if (currentUser && !loading) {
      return redirect('/')
    }
    return null
  }

  function adminOnlyLoader({ request }: LoaderFunctionArgs) {
    console.log('Checking User Role:', currentUser?.profile?.role);  // ตรวจสอบค่าของ role ใน currentUser
    if (!currentUser && !loading) {
      const params = new URLSearchParams()
      params.set('from', new URL(request.url).pathname)
      return redirect('/sign-in?' + params.toString())
    } else if (!loading && currentUser?.profile?.role !== 'Admin') {
      return redirect('/unauthorized') // หรือหน้าที่คุณเตรียมไว้
    } else {
      return { currentUser }
    }
  }

  function protectedLoader({ request }: LoaderFunctionArgs) {
    if (!currentUser && !loading) {
      const params = new URLSearchParams()
      params.set('from', new URL(request.url).pathname)
      return redirect('/sign-in?' + params.toString())
    } else if (!loading) {
      return { currentUser }
    } else {
      return false
    }
  }
  const router = createBrowserRouter([
    {
      id: 'auth',
      loader: loginLoader,
      element: <AuthLayout />,
      errorElement: (
        <Flex
          justify='center'
          align='center'
          style={{ height: '100vh', width: '100vw', backgroundColor: '#F5F5F5' }}
        >
          <Result status='404' title='404' subTitle='Sorry, the page you visited does not exist.' />
        </Flex>
      ),
      children: [
        {
          path: PATH.AUTH.SIGN_IN,
          element: <SignIn />,
        },
        {
          path: PATH.AUTH.FORGET_PASSWORD,
          element: <ForgetPassword />,
        },
      ],
    },
    {
      id: 'root',
      path: '/',
      loader: protectedLoader,
      element: <AppLayout />,
      errorElement: (
        <Flex
          justify='center'
          align='center'
          style={{ height: '100vh', width: '100vw', backgroundColor: '#F5F5F5' }}
        >
          <Result status='404' title='404' subTitle='Sorry, the page you visited does not exist.' />
        </Flex>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={PATH.DASHBOARD} replace />,
        },
        {
          path: PATH.DASHBOARD,
          element: (
            <PageContainer title={PAGE_TITLE.DASHBOARD}>
              <Dashboard />
            </PageContainer>
          ),
        },
        {
          path: PATH.SUPPORT,
          element: (
            <PageContainer title={PAGE_TITLE.SUPPORT}>
              <Support />
            </PageContainer>
          ),
        },
        {
          path: PATH.TODOLIST,
          element: (
            <PageContainer title={PAGE_TITLE.TODOLIST}>
              <ToDoList />
            </PageContainer>
          ),
        },
        {
          path: PATH.PROJECTS,
          element: (
            <PageContainer title={PAGE_TITLE.PROJECTS}>
              <Projects />
            </PageContainer>
          ),
        },
        {
          path: PATH.PROJECT_DETAIL,
          element: (
            <PageContainer title={PAGE_TITLE.PROJECT_DETAIL}>
              <ProjectDetail />
            </PageContainer>
          ),
        },
        {
          path: PATH.PROJECT_ADD,
          element: (
            <PageContainer title="Add Issue">
              <AddIssueForm />
            </PageContainer>
          ),
        },
        {
          path: PATH.PROJECT_VIEW,
          element: (
            <PageContainer title="View Issue">
              <ViewIssue />
            </PageContainer>
          ),
        },
        {
          path: PATH.PROJECT_EDIT,
          element: (
            <PageContainer title="Edit Issue">
              <EditIssueForm />
            </PageContainer>
          ),
        },
        {
          path: PATH.PROJECT_DUPLICATE,
          element: (
            <PageContainer title="Duplicate Issue">
              <DuplicateIssueForm />
            </PageContainer>
          ),
        },
        {
          path: PATH.SCOPE,
          element: (
            <PageContainer title={PAGE_TITLE.SCOPE}>
              <ScopeOfWork />
            </PageContainer>
          ),
        },
        {
          path: PATH.CLIENTSERVICESHEET,
          element: (
            <PageContainer title={PAGE_TITLE.CLIENTSERVICESHEET}>
              <ClientServiceSheet />
            </PageContainer>
          ),
        },
        {
          path: PATH.ADD_CLIENT_SERVICE_SHEET,
          element: (
            <PageContainer title={PAGE_TITLE.ADD_CLIENT_SERVICE_SHEET}>
              <AddClientServiceSheet />
            </PageContainer>
          ),
        },
        {
          path: PATH.DUPLICATE_CLIENT_SERVICE_SHEET,
          element: (
            <PageContainer title={PAGE_TITLE.DUPLICATE_CLIENT_SERVICE_SHEET}>
              <DuplicateClientServiceSheet />
            </PageContainer>
          ),
        },
        {
          path: "/service-sheets/print/:id",
          element: <ServiceSheetPrint />,
        },
        {
          path: PATH.OTHER_DOCUMENT,
          element: (
            <PageContainer title={PAGE_TITLE.OTHER_DOCUMENT}>
              <OtherDocument />
            </PageContainer>
          ),
        },
        {
          path: PATH.SCHEDULE_MEETING,
          element: (
            <PageContainer title={PAGE_TITLE.SCHEDULE_MEETING}>
              <ScheduleMeeting />
            </PageContainer>
          ),
        },
        {
          path: PATH.MEETING_SUMMARY,
          element: (
            <PageContainer title={PAGE_TITLE.MEETING_SUMMARY}>
              <MeetingSummary />
            </PageContainer>
          ),
        },
        {
          path: PATH.SETTING_ADD_PROJECT,
          element: (
            <PageContainer title={PAGE_TITLE.SETTING_ADD_PROJECT}>
              <AddProjectSetting />
            </PageContainer>
          ),
        },
        {
          path: PATH.SETTING_ADD_USER,
          element: (
            <PageContainer title={PAGE_TITLE.SETTING_ADD_USER}>
              <AddUserSetting />
            </PageContainer>
          ),
          loader: adminOnlyLoader,
        },
      ],
    },
  ])

  return <RouterProvider router={router} />
}
