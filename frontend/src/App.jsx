import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TimetablePage from './pages/TimetablePage';
import MaterialsPage from './pages/MaterialsPage';
import MessagingPage from './pages/MessagingPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/" element={<div>Login Page Placeholder</div>} /> {/* Add login later */}
      </Routes>
    </Router>
  );
}

export default App;