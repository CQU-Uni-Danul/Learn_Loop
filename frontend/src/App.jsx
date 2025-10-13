import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginDashboard from './pages/Login';
import NotificationsPage from './pages/NotificationsPage';
import TimetablePage from './pages/TimetablePage';
import StudentNotificationsPage from "./pages/StudentNotificationsPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher/" element={<TeacherDashboard />} />
        <Route path="/student/" element={<StudentDashboard />} />
        <Route path="/admin/" element={<AdminDashboard />} />
        <Route path="/" element={<LoginDashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/students/notifications" element={<StudentNotificationsPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
      </Routes>
    </Router>
  );
}

export default App;