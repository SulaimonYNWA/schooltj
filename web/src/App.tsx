import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddTeacher from './pages/AddTeacher';
import Courses from './pages/Courses';
import Teachers from './pages/Teachers';
import Profile from './pages/Profile';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Announcements from './pages/Announcements';
import Timetable from './pages/Timetable';
import Settings from './pages/Settings';
import Grades from './pages/Grades';
import SchoolDetail from './pages/SchoolDetail';
import Notifications from './pages/Notifications';
import Homework from './pages/Homework';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/students" element={<Students />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/add-teacher" element={<AddTeacher />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/schools/:id" element={<SchoolDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/homework" element={<Homework />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
