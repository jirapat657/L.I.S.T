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
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/Projects/ProjectDetail'
import AddIssueForm from '@/pages/Projects/AddIssueForm';
import ViewIssue from '@/pages/Projects/ViewIssue';
import EditIssueForm from '@/pages/Projects/EditIssueForm';
import DuplicateIssueForm from '@/pages/Projects/DuplicateIssueForm';
import ScopeOfWork from '@/pages/ScopeOfWork';
import AddScopeOfWork from '@/pages/ScopeOfWork/AddScopeOfWork';
import AddProjectSetting from '@/pages/Setting/AddProject';
import AddUserSetting from '@/pages/Setting/AddUser';

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
          path: PATH.SCOPE_ADD,
          element: (
            <PageContainer title={PAGE_TITLE.SCOPE_ADD}>
              <AddScopeOfWork />
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
        },
      ],
    },
  ])

  return <RouterProvider router={router} />
}
