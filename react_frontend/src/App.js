import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./components/shell.css";
import "./styles/pages.css";

import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./routes/Guards";
import { AppShell } from "./components/AppShell";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DefectsPage from "./pages/DefectsPage";
import DefectDetailPage from "./pages/DefectDetailPage";
import CorrectiveActionsPage from "./pages/CorrectiveActionsPage";
import ReportsPage from "./pages/ReportsPage";
import NotFoundPage from "./pages/NotFoundPage";

// PUBLIC_INTERFACE
function App() {
  /** React application entrypoint: routing + auth provider + main layout. */
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppShell />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="defects" element={<DefectsPage />} />
              <Route path="defects/:id" element={<DefectDetailPage />} />
              <Route path="corrective-actions" element={<CorrectiveActionsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
