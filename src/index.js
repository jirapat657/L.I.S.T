// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/Projects/ProjectDetail';
import AddIssueForm from './pages/Projects/AddIssueForm';
import ViewIssue from './pages/ViewIssue';
import EditIssue from './pages/EditIssue';
import DuplicateIssue from './pages/DuplicateIssue';
import ScopeOfWork from './pages/ScopeOfWork';
import AddProject from './pages/AddProject';
import AddUser from './pages/AddUser';
import AddScopeOfWork from './pages/ScopeOfWork/AddScopeOfWork';
import ViewProject from './pages/ViewProject';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import EditProfile from './pages/EditProfile';
import { UserProvider } from './contexts/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';


// Ant Design
import 'antd/dist/reset.css';
import { ConfigProvider } from 'antd';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            {/* ⬅️ Routes ที่ไม่ใช้ Layout หลัก */}
            <Route path="/login" element={<PublicRoute><SignIn /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

            {/* ⬅️ Routes ที่ใช้ Layout หลัก */}
            <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>}>
              <Route index element={<Home />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="projects/:id/add" element={<AddIssueForm />} />
              <Route path="projects/:id/view/:issueId" element={<ViewIssue />} />
              <Route path="projects/:id/edit/:issueId" element={<EditIssue />} />
              <Route path="projects/:id/duplicate/:issueId" element={<DuplicateIssue />} />
              <Route path="scope" element={<ScopeOfWork />} />
              <Route path="settings/add-project" element={<AddProject />} />
              <Route path="settings/add-user" element={<AddUser />} />
              <Route path="scope/add" element={<AddScopeOfWork />} />
              <Route path="projects/view/:projectId" element={<ViewProject />} />
              <Route path="edit-profile" element={<EditProfile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </ConfigProvider>
  </React.StrictMode>
);

reportWebVitals();
