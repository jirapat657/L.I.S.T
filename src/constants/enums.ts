export const PATH = Object.freeze({
  AUTH: {
    SIGN_IN: '/sign-in',
    FORGET_PASSWORD: '/forget-password',
  },
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_ADD: '/projects/:id/add',
  PROJECT_VIEW: '/projects/:id/view/:issueId',       
  PROJECT_EDIT: '/projects/:projectId/edit/:issueId',       
  PROJECT_DUPLICATE: '/projects/:id/duplicate/:issueId',
  SCOPE: '/scope',         
  SCOPE_ADD: '/scope/add', 
  SETTING_ADD_PROJECT: '/setting/add-project',
  SETTING_ADD_USER: '/setting/add-user',
})

export const PAGE_TITLE = Object.freeze({
  DASHBOARD: 'Dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_ADD: '/projects/:id/add',
  PROJECT_VIEW: '/projects/:id/view/:issueId',       
  PROJECT_EDIT: '/projects/:projectId/edit/:issueId',       
  PROJECT_DUPLICATE: '/projects/:id/duplicate/:issueId',
  SCOPE: '/scope',         
  SCOPE_ADD: '/scope/add',
  SETTING_ADD_PROJECT: '/setting/add-project',
  SETTING_ADD_USER: '/setting/add-user',
})
