// src/router.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Student pages
import Login from "./Pages/Login/Login.jsx";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Academic from "./Pages/Academic/Academic.jsx";
import PersonalInfo from "./Pages/PersonalInfo/PersonalInfo.jsx";
import EncryptionKey from "./Pages/MyEncryptionKey/MEK.jsx";
import StudentSidebar from "./components/StudentSidebar/StudentSidebar.jsx";

// Error pages
import NotFoundPage from "./Pages/Error/NotFoundPage.jsx";
import GeneralErrorPage from "./Pages/Error/GeneralErrorPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

// Admin pages
import AdminSidebar from "./components/AdminSidebar/AdminSidebar.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";
import ManagementKey from "./Pages/Admin/ManagementKey.jsx";
import ManageStudentInformation from "./Pages/Admin/ManageStudentInformation.jsx";
import ManageGrades from "./Pages/Admin/ManageGrades.jsx";
import AdminEncryptionKey from "./Pages/Admin/EncryptionKey.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ===== LOGIN ===== */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* ===== STUDENT ===== */}
          <Route element={<RequireAuth allowedRoleCodes={[0]} />}>
            <Route path="/student" element={<StudentSidebar />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="academic" element={<Academic />} />
              <Route path="personal-info" element={<PersonalInfo />} />
              <Route path="encryption-key" element={<EncryptionKey />} />
            </Route>
          </Route>

          {/* ===== ERROR PAGES ===== */}
          <Route path="/error" element={<GeneralErrorPage />} />

          {/* ===== ADMIN ===== */}
          <Route element={<RequireAuth allowedRoleCodes={[1]} />}>
            <Route path="/admin" element={<AdminSidebar />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="management-key" element={<ManagementKey />} />
              <Route path="students" element={<ManageStudentInformation />} />
              <Route path="grades" element={<ManageGrades />} />
              <Route path="logs" element={<AdminEncryptionKey />} />
            </Route>
          </Route>

          {/* ===== 404 ===== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
