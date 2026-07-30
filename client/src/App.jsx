import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/ChangePassword";
import AdminUsersPage from "./pages/AdminUsersPage";

// Masters
import RoleMaster from "./pages/masters/RoleMaster";
import ClientTypeMaster from "./pages/masters/ClientTypeMaster";
import CaseTypeMaster from "./pages/masters/CaseTypeMaster";
import StatusMaster from "./pages/masters/StatusMaster";
import CourtMaster from "./pages/masters/CourtMaster";
import LocationMaster from "./pages/masters/LocationMaster";


// Entities
import ClientList from "./pages/entities/ClientList";
import ClientForm from "./pages/entities/ClientForm";
import AdvocateList from "./pages/entities/AdvocateList";
import AdvocateForm from "./pages/entities/AdvocateForm";
import CaseList from "./pages/entities/CaseList";
import CaseForm from "./pages/entities/CaseForm";
import AppointmentList from "./pages/entities/AppointmentList";
import AppointmentForm from "./pages/entities/AppointmentForm";
import CompletedAppointmentsPage from "./pages/CompletedAppointmentsPage";

// Reports
import ReportsPage from "./pages/ReportsPage";
import ClientReportPage from "./pages/ClientReportPage";
import CaseReportPage from "./pages/CaseReportPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        {/* Admin only routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]}><Outlet /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admins" element={<AdminUsersPage />} />
          <Route path="/masters/role" element={<RoleMaster />} />
          <Route path="/masters/client-type" element={<ClientTypeMaster />} />
          <Route path="/masters/case-type" element={<CaseTypeMaster />} />
          <Route path="/masters/status" element={<StatusMaster />} />
          <Route path="/masters/court" element={<CourtMaster />} />
          <Route path="/masters/location" element={<LocationMaster />} />
          
          <Route path="/advocate" element={<AdvocateList />} />
          <Route path="/advocate/create" element={<AdvocateForm />} />
          <Route path="/advocate/:id/edit" element={<AdvocateForm />} />
          
          <Route path="/client" element={<ClientList />} />
          <Route path="/client/create" element={<ClientForm />} />
          <Route path="/client/:id/edit" element={<ClientForm />} />
          
          <Route path="/case" element={<CaseList />} />
          <Route path="/case/create" element={<CaseForm />} />
          <Route path="/case/:id/edit" element={<CaseForm />} />
          
          <Route path="/reports/appointment" element={<ReportsPage />} />
          <Route path="/reports/client" element={<ClientReportPage />} />
          <Route path="/reports/case" element={<CaseReportPage />} />
        </Route>
        
        {/* Routes accessible to both Admin and Advocate */}
        <Route path="/appointments" element={<AppointmentList />} />
        <Route path="/appointments/create" element={<AppointmentForm />} />
        <Route path="/appointments/:id/edit" element={<AppointmentForm />} />
        <Route path="/completed-appointments" element={<CompletedAppointmentsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
