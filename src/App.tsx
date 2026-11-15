import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./app/AuthContext";
import { RequireAdmin } from "./app/RequireAdmin";
import { LoginPage } from "./app/LoginPage";
import { AppShell } from "./components/AppShell";
import { EntityPage } from "./components/EntityPage";
import { entities } from "./features/registry";
import { Dashboard } from "./features/Dashboard";
import { AppointmentsPage } from "./features/AppointmentsPage";
import { SchedulesPage } from "./features/SchedulesPage";
import { NotificationsPage } from "./features/NotificationsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route
              path="patients"
              element={<EntityPage config={entities.patients} />}
            />
            <Route
              path="professionals"
              element={<EntityPage config={entities.professionals} />}
            />
            <Route
              path="specialties"
              element={<EntityPage config={entities.specialties} />}
            />
            <Route
              path="services"
              element={<EntityPage config={entities.services} />}
            />
            <Route
              path="users"
              element={<EntityPage config={entities.users} />}
            />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
