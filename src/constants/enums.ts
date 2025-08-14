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
  CLIENTSERVICESHEET: '/clientservicesheet',
  ADD_CLIENT_SERVICE_SHEET: '/add-client-service-sheet',
  SETTING_ADD_PROJECT: '/setting/add-project',
  SETTING_ADD_USER: '/setting/add-user',
  OTHER_DOCUMENT: '/other-document',
  SCHEDULE_MEETING: '/schedule-meeting',
  MEETING_SUMMARY: '/meeting-summary',
  TODOLIST: '/todolist'
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
  CLIENTSERVICESHEET: 'Client Service Sheet',
  ADD_CLIENT_SERVICE_SHEET: 'Client Service Sheet',
  SETTING_ADD_PROJECT: 'Add Project',
  SETTING_ADD_USER: 'Add User',
  OTHER_DOCUMENT: 'Other Document',
  SCHEDULE_MEETING: 'Meeting Summary',
  MEETING_SUMMARY: 'Meeting Summary',
  TODOLIST: 'To Do List'
});
