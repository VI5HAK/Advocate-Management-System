import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Lazy-loaded pages
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));

// Masters
const CourtMaster = lazy(() => import("./pages/masters/CourtMaster"));
const LocationMaster = lazy(() => import("./pages/masters/LocationMaster"));
const MasterPage = lazy(() => import("./pages/masters/MasterPage"));

// Entities
const ClientForm = lazy(() => import("./pages/entities/ClientForm"));
const AdvocateForm = lazy(() => import("./pages/entities/AdvocateForm"));
const CaseForm = lazy(() => import("./pages/entities/CaseForm"));
const AppointmentForm = lazy(() => import("./pages/entities/AppointmentForm"));
const HearingList = lazy(() => import("./pages/entities/HearingList"));
const HearingForm = lazy(() => import("./pages/entities/HearingForm"));
const EntityListPage = lazy(() => import("./pages/entities/EntityListPage"));

// Reports & Grouped Completed Pages
const GenericReportPage = lazy(() => import("./pages/reports/GenericReportPage"));
const GroupedCompletedReport = lazy(() => import("./pages/reports/GroupedCompletedReport"));

// Configurations
import { MASTER_PAGE_CONFIG } from "./config/masterPages";
import { ENTITY_LIST_CONFIG } from "./config/entityListPages";
import { REPORTS_CONFIG } from "./config/reports";
import { GROUPED_REPORTS_CONFIG } from "./config/groupedReports";

function AppRoutes() {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

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
          <Route path="/masters/role" element={<MasterPage config={MASTER_PAGE_CONFIG.role} />} />
          <Route path="/masters/client-type" element={<MasterPage config={MASTER_PAGE_CONFIG.clientType} />} />
          <Route path="/masters/case-type" element={<MasterPage config={MASTER_PAGE_CONFIG.caseType} />} />
          <Route path="/masters/status" element={<MasterPage config={MASTER_PAGE_CONFIG.status} />} />
          <Route path="/masters/court" element={<CourtMaster />} />
          <Route path="/masters/location" element={<LocationMaster />} />
          <Route path="/masters/judge" element={<MasterPage config={MASTER_PAGE_CONFIG.judge} />} />
          
          <Route path="/advocate" element={<EntityListPage config={ENTITY_LIST_CONFIG.advocate} />} />
          <Route path="/advocate/create" element={<AdvocateForm />} />
          <Route path="/advocate/:id/edit" element={<AdvocateForm />} />
          
          <Route path="/client" element={<EntityListPage config={ENTITY_LIST_CONFIG.client} />} />
          <Route path="/client/create" element={<ClientForm />} />
          <Route path="/client/:id/edit" element={<ClientForm />} />
          
          <Route path="/case" element={<EntityListPage config={ENTITY_LIST_CONFIG.case} />} />
          <Route path="/case/create" element={<CaseForm />} />
          <Route path="/case/:id/edit" element={<CaseForm />} />
          
          <Route path="/reports/advocate" element={<GenericReportPage config={REPORTS_CONFIG.advocate} />} />
          <Route path="/reports/client" element={<GenericReportPage config={REPORTS_CONFIG.client} />} />
          <Route path="/reports/appointment" element={<GenericReportPage config={REPORTS_CONFIG.appointment} />} />
        </Route>
        
        {/* Routes accessible to both Admin and Advocate */}
        <Route path="/appointments" element={<EntityListPage config={ENTITY_LIST_CONFIG.appointment} readOnly={isAdvocate} />} />
        <Route path="/appointments/create" element={<AppointmentForm />} />
        <Route path="/appointments/:id/edit" element={<AppointmentForm />} />
        <Route path="/completed-appointments" element={<GroupedCompletedReport config={GROUPED_REPORTS_CONFIG.appointments} />} />
        
        <Route path="/hearings" element={<HearingList />} />
        <Route path="/hearings/create" element={<HearingForm />} />
        <Route path="/hearings/:id/edit" element={<HearingForm />} />
        <Route path="/reports/hearing" element={<GroupedCompletedReport config={GROUPED_REPORTS_CONFIG.hearings} />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={
          <div className="flex h-screen w-screen items-center justify-center animate-gradient-bg">
            <div className="w-10 h-10 border-4 border-white/40 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        }>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
