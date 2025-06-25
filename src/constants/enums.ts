export const PATH = Object.freeze({
  AUTH: {
    SIGN_IN: '/sign-in',
    FORGET_PASSWORD: '/forget-password',
  },
  HOME: '/',
  DASHBOARD: '/dashboard',
  SUPPORT: '/support',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_ADD: '/projects/:id/add',
  PROJECT_VIEW: '/projects/:id/view/:issueId',       
  PROJECT_EDIT: '/projects/:projectId/edit/:issueId',       
  PROJECT_DUPLICATE: '/projects/:projectId/duplicate/:issueId',
  SCOPE: '/scope',         
  SETTING_ADD_PROJECT: '/setting/add-project',
  SETTING_ADD_USER: '/setting/add-user',
})

export const PAGE_TITLE = Object.freeze({
  DASHBOARD: 'Dashboard',
  SUPPORT: 'Support',
  PROJECTS: 'Projects',
  PROJECT_DETAIL: 'Project Detail',
  PROJECT_ADD: 'Add Issue',
  PROJECT_VIEW: 'View Issue',
  PROJECT_EDIT: 'Edit Issue',
  PROJECT_DUPLICATE: 'Duplicate Issue',
  SCOPE: 'Scope of Work',
  SETTING_ADD_PROJECT: 'Add Project',
  SETTING_ADD_USER: 'Add User',
});
